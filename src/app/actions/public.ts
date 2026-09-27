'use server';
import { reservationSchema, enquirySchema, loginSchema } from '@/lib/validation';
import { serviceDb, db } from '@/lib/supabase';
import { getSite } from '@/lib/data';
import { bookingSlots } from '@/lib/booking';
import { rateLimit } from '@/lib/rate-limit';
import { notifyReservation, sendEmail } from '@/lib/email';
import { findTable, findSeat, seatLayout, takenSeatIds, describeSeats } from '@/lib/floor-plan';
import { redirect } from 'next/navigation';
import { z } from 'zod';
export type FormResult={ok:boolean;message:string;reference?:string};
export type TableBooking={table_id:string;time:string;seat_ids:string};
export type AvailabilityResult={ok:true;bookings:TableBooking[]}|{ok:false;message:string};
/** Returns occupied tables and sitting start times only, never guest details. */
export async function tableAvailability(date:unknown):Promise<AvailabilityResult>{
  const parsed=z.iso.date().safeParse(date);
  if(!parsed.success)return {ok:false,message:'Choose a valid date to check tables.'};
  try{
    await rateLimit('availability');
    const {data,error}=await serviceDb().from('reservations').select('table_id,time,seat_ids').eq('date',parsed.data).in('status',['pending','confirmed']);
    if(error)return {ok:false,message:'We couldn’t check the tables. Please try again.'};
    return {ok:true,bookings:(data??[]).map(r=>({table_id:String(r.table_id),time:String(r.time).slice(0,5),seat_ids:String(r.seat_ids??'')}))};
  }catch{return {ok:false,message:'Table availability is temporarily unavailable. Please try again shortly.'};}
}
export async function submitReservation(input:unknown):Promise<FormResult>{
  const parsed=reservationSchema.safeParse(input);if(!parsed.success)return {ok:false,message:parsed.error.issues[0].message};
  try{
    await rateLimit('reservation');const v=parsed.data;const {settings}=await getSite();
    if(v.party_size>settings.max_party||!bookingSlots(v.date,settings).includes(v.time))return {ok:false,message:'That date or time is not available. Please choose another.'};
    const chosenSeats=v.seat_ids?v.seat_ids.split(',').filter(Boolean):[];
    if(chosenSeats.length>v.party_size)return {ok:false,message:`You chose ${chosenSeats.length} seats for ${v.party_size} guests. Please adjust one of them.`};
    if(chosenSeats.some(id=>!findSeat(id)))return {ok:false,message:'One of those seats is no longer on our floor plan. Please choose again.'};
    if(v.table_id){
      const table=findTable(v.table_id);
      if(!table)return {ok:false,message:'That table is no longer on our floor plan. Please choose another.'};
      if(!chosenSeats.length&&table.seats<v.party_size)return {ok:false,message:`${table.label} seats ${table.seats}. Please choose a larger table.`};
    }
    if(chosenSeats.length||v.table_id){
      // Re-check against live bookings so a stale tab cannot claim a seat someone else just took.
      const held=await serviceDb().from('reservations').select('table_id,time,seat_ids').eq('date',v.date).in('status',['pending','confirmed']);
      if(held.error)return {ok:false,message:'We could not check your chosen seats. Please try again before submitting.'};
      const taken=takenSeatIds(v.time,(held.data??[]).map(r=>({table_id:String(r.table_id),time:String(r.time).slice(0,5),seat_ids:String(r.seat_ids??'')})));
      const wanted=chosenSeats.length?chosenSeats:seatLayout(findTable(v.table_id)!).map(s=>s.id);
      if(wanted.some(id=>taken.has(id)))return {ok:false,message:'Those seats were just taken for this time. Please choose again.'};
    }
    const {consent,website,...record}=v; void consent;void website;
    const client=serviceDb();const {data,error}=await client.from('reservations').insert({...record,privacy_accepted_at:new Date().toISOString()}).select('id').single();
    if(error){if(error.code==='23P01')return {ok:false,message:'That table was just taken for this time. Please choose another.'};if(error.code==='23505')return {ok:true,message:'We have already received this request. It is awaiting confirmation.'};throw new Error('We could not save your request. Please try again.');}
    const chosen=chosenSeats.length?describeSeats(chosenSeats):v.table_id?findTable(v.table_id)?.label:undefined;
    const sent=await notifyReservation(data.id,v.email,`Thank you, ${v.name}. We have received your request for ${v.party_size} on ${v.date} at ${v.time} (South African time).${chosen?` You asked for ${chosen}, which we will hold where we can.`:''} This is a request, not a confirmed booking. Our team will contact you to confirm. Reference: ${data.id.slice(0,8).toUpperCase()}.`);
    return {ok:true,reference:data.id.slice(0,8).toUpperCase(),message:`Your request is with our team. We will contact you to confirm your table.${sent?' An acknowledgement has been emailed to you.':' Email acknowledgements are currently unavailable. Please keep your reference.'}`};
  }catch(error){return {ok:false,message:error instanceof Error?error.message:'We could not save your request.'};}
}
export async function submitEnquiry(input:unknown):Promise<FormResult>{
  const parsed=enquirySchema.safeParse(input);if(!parsed.success)return {ok:false,message:parsed.error.issues[0].message};
  try{await rateLimit('enquiry');const {consent,website,...record}=parsed.data;void consent;void website;const {error}=await serviceDb().from('contact_enquiries').insert({...record,privacy_accepted_at:new Date().toISOString()});if(error&&error.code!=='23505')throw new Error('Your message could not be saved. Please try again.');if(process.env.STAFF_NOTIFICATION_EMAIL)await sendEmail(process.env.STAFF_NOTIFICATION_EMAIL,'New BUKO enquiry',`${record.name}\n${record.email}\n\n${record.message}`);return {ok:true,message:'Thank you for getting in touch. Your message is with our team.'};}catch(error){return {ok:false,message:error instanceof Error?error.message:'We could not save your message.'};}
}
export async function login(input:unknown):Promise<FormResult>{const parsed=loginSchema.safeParse(input);if(!parsed.success)return {ok:false,message:'Enter your email and password.'};try{await rateLimit('login');const client=await db();const {error}=await client.auth.signInWithPassword(parsed.data);if(error)return {ok:false,message:'We could not sign you in. Check your details and try again.'};const {data:{user}}=await client.auth.getUser();const {data:profile}=await client.from('staff_profiles').select('id').eq('id',user!.id).eq('active',true).single();if(!profile){await client.auth.signOut();return {ok:false,message:'This account does not have staff access.'};}}catch(error){return {ok:false,message:error instanceof Error?error.message:'Sign-in is unavailable.'};}redirect('/admin');}
export async function logout(){const client=await db();await client.auth.signOut();redirect('/admin/login');}

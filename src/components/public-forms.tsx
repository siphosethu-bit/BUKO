'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { reservationSchema, enquirySchema, type ReservationInput, type ReservationFormInput } from '@/lib/validation';
import { bookingSlots, johannesburgDate } from '@/lib/booking';
import { findTable, findSeat, zones, primaryTableOf, describeSeats } from '@/lib/floor-plan';
import { FloorPlan } from '@/components/floor-plan';
import { submitReservation, submitEnquiry, type FormResult } from '@/app/actions/public';
import type { Settings } from '@/lib/types';
import type { z } from 'zod';
function Success({result}:{result:FormResult}){return <div className="success-panel" role="status" tabIndex={-1}><Check size={30}/><h2>{result.reference?'Your request is in.':'Thank you.'}</h2><p>{result.message}</p>{result.reference&&<p style={{marginTop:18}}>Your reference: <strong>{result.reference}</strong></p>}<Link className="button button-dark-outline" href="/">Back to BUKO <ArrowRight size={16}/></Link></div>;}
export function ReservationForm({settings,connected}:{settings:Settings;connected:boolean}){
  const [result,setResult]=useState<FormResult|null>(null);const [requestId,setRequestId]=useState(''); const [date,setDate]=useState(''); const [time,setTime]=useState(''); const [seatIds,setSeatIds]=useState<string[]>([]); const [party,setParty]=useState(2);
  const {register,handleSubmit,setValue,formState:{errors,isSubmitting}}=useForm<ReservationFormInput, unknown, ReservationInput>({resolver:zodResolver(reservationSchema),defaultValues:{name:'',email:'',phone:'',date:'',time:'',party_size:2,requests:'',website:'',table_id:'',seat_ids:'',request_id:'00000000-0000-4000-8000-000000000000'}});
  const slots=bookingSlots(date,settings);const ready=connected&&settings.booking_enabled;
  /** Seats drive both fields: the ids themselves, plus the table they share for the kitchen's list. */
  const applySeats=(ids:string[])=>{setSeatIds(ids);setValue('seat_ids',ids.join(','),{shouldDirty:true});setValue('table_id',primaryTableOf(ids),{shouldDirty:true});};
  const submit=handleSubmit(async values=>{const id=requestId||crypto.randomUUID();setRequestId(id);try{setResult(await submitReservation({...values,request_id:id}));}catch{setResult({ok:false,message:'Your connection was interrupted. Please try again.'});}});
  if(result?.ok)return <Success result={result}/>;
  return <form className="form-panel" onSubmit={submit} noValidate>{!ready&&<p className="notice">Online reservations will open soon. Please check back for available dates.</p>}<div className="form-grid">
    <Field label="Your name" error={errors.name?.message} id="name"><input id="name" autoComplete="name" {...register('name')} aria-invalid={!!errors.name} aria-describedby="name-error"/></Field>
    <Field label="Email address" error={errors.email?.message} id="email"><input id="email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} aria-describedby="email-error"/></Field>
    <Field label="Contact number" error={errors.phone?.message} id="phone"><input id="phone" type="tel" autoComplete="tel" placeholder="+27" {...register('phone')} aria-invalid={!!errors.phone} aria-describedby="phone-error"/></Field>
    <Field label="Number of guests" error={errors.party_size?.message} id="party_size"><select id="party_size" {...register('party_size',{valueAsNumber:true,onChange:e=>{const n=Number(e.target.value);setParty(n);if(seatIds.length>n||seatIds.some(id=>{const f=findSeat(id);return !f||f.table.seats<n;}))applySeats([]);}})}>{Array.from({length:settings.max_party},(_,i)=><option key={i+1} value={i+1}>{i+1} {i===0?'guest':'guests'}</option>)}</select></Field>
    <Field label="Preferred date" error={errors.date?.message} id="date"><input id="date" type="date" min={johannesburgDate()} {...register('date',{onChange:e=>{setDate(e.target.value);setTime('');setValue('time','');applySeats([]);}})} aria-invalid={!!errors.date} aria-describedby="date-error"/></Field>
    <Field label="Preferred time" error={errors.time?.message} id="time"><TimeSlotPicker slots={slots} value={time} onSelect={t=>{setTime(t);setValue('time',t,{shouldValidate:true,shouldDirty:true});applySeats([]);}} hasDate={!!date} ready={ready}/><span className="field-hint">South African time (SAST)</span></Field>
    <Field label="Anything we should know? (optional)" error={errors.requests?.message} id="requests" full><textarea id="requests" placeholder="A celebration, accessibility needs or dietary requirements…" {...register('requests')}/></Field>
  </div><FloorPlan seats={seatIds} date={date} time={time} partySize={party} ready={ready} slots={slots} onDateChange={d=>{setDate(d);setValue('date',d,{shouldDirty:true});setTime('');setValue('time','');applySeats([]);}} onTimeChange={t=>{setTime(t);setValue('time',t,{shouldDirty:true,shouldValidate:true});applySeats([]);}} onSelect={applySeats}/><ReservationSummary date={date} time={time} party={party} seatIds={seatIds}/><div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} autoComplete="off" {...register('website')}/></div><label className="checkbox-line"><input type="checkbox" {...register('consent')}/><span>I agree to BUKO using these details to arrange my reservation. <Link href="/privacy">Privacy notice</Link></span></label>{errors.consent&&<p className="field-error">{errors.consent.message}</p>}{result&&!result.ok&&<p className="status-message error" role="alert">{result.message}</p>}<div className="form-submit"><button className="button button-gold" disabled={!ready||isSubmitting}>{isSubmitting?'Sending your request…':'Request a Table'}<ArrowRight size={17}/></button><p>Your table is reserved only once our team confirms your request.</p></div></form>;
}
export function ContactForm({connected}:{connected:boolean}){
  const [result,setResult]=useState<FormResult|null>(null);const [requestId,setRequestId]=useState('');
  const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm<z.infer<typeof enquirySchema>>({resolver:zodResolver(enquirySchema),defaultValues:{name:'',email:'',message:'',website:'',request_id:'00000000-0000-4000-8000-000000000000'}});
  if(result?.ok)return <Success result={result}/>;
  return <form className="form-panel" noValidate onSubmit={handleSubmit(async v=>{const id=requestId||crypto.randomUUID();setRequestId(id);try{setResult(await submitEnquiry({...v,request_id:id}));}catch{setResult({ok:false,message:'Your connection was interrupted. Please try again.'});}})}>{!connected&&<p className="notice">We’re getting ready to welcome you. Contact details and enquiries will be available soon.</p>}<div className="form-grid"><Field label="Your name" id="name" error={errors.name?.message}><input id="name" autoComplete="name" {...register('name')} aria-describedby="name-error"/></Field><Field label="Email address" id="email" error={errors.email?.message}><input id="email" type="email" autoComplete="email" {...register('email')} aria-describedby="email-error"/></Field><Field label="Your message" id="message" error={errors.message?.message} full><textarea id="message" rows={6} {...register('message')} aria-describedby="message-error"/></Field></div><div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} {...register('website')}/></div><label className="checkbox-line"><input type="checkbox" {...register('consent')}/><span>I agree to the <Link href="/privacy">privacy notice</Link>.</span></label>{errors.consent&&<p className="field-error">Please accept the privacy notice.</p>}{result&&!result.ok&&<p className="status-message error" role="alert">{result.message}</p>}<div className="form-submit"><button className="button button-gold" disabled={!connected||isSubmitting}>{isSubmitting?'Sending…':'Send your Message'} <ArrowRight size={17}/></button></div></form>;
}
function ReservationSummary({date,time,party,seatIds}:{date:string;time:string;party:number;seatIds:string[]}){
  const table=findTable(primaryTableOf(seatIds));const zone=table&&zones.find(z=>z.id===table.zone);
  const when=date?new Date(`${date}T12:00:00+02:00`).toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long'}):'';
  return <div className="reservation-summary"><span className="eyebrow">Your request so far</span><dl>
    <div><dt>Date</dt><dd>{when||'Not chosen yet'}</dd></div>
    <div><dt>Time</dt><dd>{time?`${time} (SAST)`:'Not chosen yet'}</dd></div>
    <div><dt>Guests</dt><dd>{party} {party===1?'guest':'guests'}</dd></div>
    <div><dt>Where you’ll sit</dt><dd>{seatIds.length?describeSeats(seatIds):'No preference, we will seat you well'}</dd></div>
    {table&&zone&&<div><dt>Area</dt><dd>{zone.label}</dd></div>}
  </dl></div>;
}
function TimeSlotPicker({slots,value,onSelect,hasDate,ready}:{slots:string[];value:string;onSelect:(t:string)=>void;hasDate:boolean;ready:boolean}){
  if(!ready)return <p className="time-picker-empty">Online booking opens soon. Check back for available times.</p>;
  if(!hasDate)return <p className="time-picker-empty">Choose a date to see available times.</p>;
  if(!slots.length)return <p className="time-picker-empty">No tables available on this date. Try another date.</p>;
  return <div className="time-picker" role="group" aria-label="Preferred time" aria-describedby="time-error">{slots.map((t,i)=><button key={t} type="button" className="time-pill" aria-pressed={value===t} style={{'--i':i} as React.CSSProperties} onClick={()=>onSelect(t)}>{t}</button>)}</div>;
}
function Field({label,id,error,children,full=false}:{label:string;id:string;error?:string;children:React.ReactNode;full?:boolean}){return <div className={`field ${full?'full':''}`}><label htmlFor={id}>{label}</label>{children}<span id={`${id}-error`} className="field-error">{error}</span></div>;}

import 'server-only';
import { serviceDb } from './supabase';
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return false;
  try { const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[to],subject,text}),signal:AbortSignal.timeout(8000)});return result.ok; } catch { return false; }
}
export async function notifyReservation(id:string,email:string,text:string){
  const sent=await sendEmail(email,'Your BUKO reservation request',text);
  const staffSent=process.env.STAFF_NOTIFICATION_EMAIL ? await sendEmail(process.env.STAFF_NOTIFICATION_EMAIL,'BUKO reservation update',`Reservation ${id}. ${text}`) : false;
  await serviceDb().from('reservations').update({email_status:sent&&staffSent?'sent':sent?'customer_sent':'not_sent'}).eq('id',id);
  return sent;
}

import type { Settings } from './types';
export function johannesburgDate(now=new Date()){ return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function bookingSlots(date: string, settings: Settings, now = new Date()): string[] {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!settings.booking_enabled||settings.closures.includes(date))return [];
  const day=new Date(`${date}T12:00:00+02:00`);if(!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==date)return [];
  const current=johannesburgDate(now);const limit=new Date(`${current}T00:00:00+02:00`);limit.setUTCDate(limit.getUTCDate()+settings.horizon_days);
  if(date<current||date>johannesburgDate(limit))return [];
  const hours=settings.hours.find(h=>h.day===day.getUTCDay());if(!hours)return [];
  const minutes=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));const slots:string[]=[];
  for(let t=minutes(hours.open);t<minutes(hours.close);t+=settings.interval_minutes){ const slot=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;if(new Date(`${date}T${slot}:00+02:00`).getTime()>=now.getTime()+settings.lead_hours*3600000)slots.push(slot); }
  return slots;
}

import { requireStaff } from '@/lib/auth';
import { ReservationsEditor } from '@/components/admin/reservations-editor';
import { AdminHeading } from '@/components/admin/shared';
export default async function Page(){const {client}=await requireStaff();const [bookings,enquiries]=await Promise.all([client.from('reservations').select('*').order('date',{ascending:false}).limit(500),client.from('contact_enquiries').select('*').order('created_at',{ascending:false}).limit(200)]);return <><AdminHeading title="A place for every guest." description="Review requests, confirm tables and keep the team up to date. Showing the latest 500 reservations."/><ReservationsEditor bookings={bookings.data||[]} enquiries={enquiries.data||[]}/></>;}

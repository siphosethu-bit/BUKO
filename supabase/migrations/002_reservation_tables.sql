-- Adds the guest's requested table to a reservation.
-- Table ids come from src/lib/floor-plan.ts; an empty string means "no preference".
begin;

alter table public.reservations add column if not exists table_id text not null default '' check (length(table_id) <= 40);

-- Staff filter the day's bookings by table when assigning the room.
create index if not exists reservations_date_table on public.reservations(date, table_id);

commit;

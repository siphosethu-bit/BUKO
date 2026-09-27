-- Prevent simultaneous requests and staff changes from occupying the same table.
begin;
create or replace function public.guard_table_booking() returns trigger
language plpgsql security definer set search_path = '' as $$
declare capacity integer;
begin
  if new.table_id='' or new.status not in ('pending','confirmed') then return new; end if;
  capacity=case new.table_id when 'W1' then 2 when 'W2' then 2 when 'W3' then 2
    when 'M1' then 4 when 'M2' then 4 when 'M3' then 4 when 'M4' then 6 when 'M5' then 6
    when 'P1' then 10 when 'T1' then 2 when 'T2' then 4 when 'T3' then 6 else null end;
  if capacity is null or new.party_size>capacity then raise exception 'Table cannot accommodate this request' using errcode='23514'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.table_id || ':' || new.date::text,0));
  if exists(select 1 from public.reservations r where r.table_id=new.table_id and r.date=new.date
    and r.status in ('pending','confirmed') and r.id<>new.id and r.request_id<>new.request_id
    and abs(extract(epoch from (r.time-new.time)))<7200) then
    raise exception 'This table is already taken for this sitting' using errcode='23P01';
  end if;
  return new;
end; $$;
create trigger guard_table_booking before insert or update of table_id,date,time,party_size,status on public.reservations
for each row execute function public.guard_table_booking();
commit;

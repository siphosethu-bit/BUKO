-- Extend the table guard to individual chairs, including picks across tables.
begin;
alter table public.reservations add column if not exists seat_ids text not null default '';

create or replace function public.guard_table_booking() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  capacities jsonb := '{"W1":2,"W2":2,"W3":2,"M1":4,"M2":4,"M3":4,"M4":6,"M5":6,"P1":10,"T1":2,"T2":4,"T3":6}';
  chosen text[] := string_to_array(nullif(new.seat_ids,''), ',');
  requested_tables text[];
  seat text;
  capacity integer;
begin
  if new.status not in ('pending','confirmed') then return new; end if;
  if chosen is null and new.table_id='' then return new; end if;
  if chosen is not null then
    if cardinality(chosen)>new.party_size or cardinality(chosen)<>(select count(distinct s) from unnest(chosen) s) then
      raise exception 'Choose one unique seat per guest' using errcode='23514';
    end if;
    foreach seat in array chosen loop
      capacity := (capacities->>split_part(seat,'-',1))::integer;
      if capacity is null or seat !~ '^[A-Z][A-Z0-9]*-[1-9][0-9]?$' then
        raise exception 'Unknown seat' using errcode='23514';
      end if;
      if split_part(seat,'-',2)::integer > capacity then
        raise exception 'Unknown seat' using errcode='23514';
      end if;
    end loop;
    select array_agg(distinct split_part(s,'-',1)) into requested_tables from unnest(chosen) s;
    if new.table_id<>'' and (cardinality(requested_tables)<>1 or new.table_id<>requested_tables[1]) then
      raise exception 'Table and seats do not match' using errcode='23514';
    end if;
  else
    capacity := (capacities->>new.table_id)::integer;
    if capacity is null or capacity<new.party_size then
      raise exception 'Table cannot accommodate this request' using errcode='23514';
    end if;
    requested_tables := array[new.table_id];
  end if;
  -- One lock per service date also covers reservations spanning multiple tables.
  perform pg_advisory_xact_lock(hashtextextended('seating:' || new.date::text,0));
  if exists (
    select 1 from public.reservations r
    where r.date=new.date and r.status in ('pending','confirmed')
      and r.id<>new.id and r.request_id<>new.request_id
      and abs(extract(epoch from (r.time-new.time)))<7200
      and (
        (r.seat_ids='' and r.table_id=any(requested_tables))
        or (chosen is not null and string_to_array(r.seat_ids,',') && chosen)
        or (chosen is null and exists (
          select 1 from unnest(string_to_array(r.seat_ids,',')) s where split_part(s,'-',1)=new.table_id
        ))
      )
  ) then
    raise exception 'These seats are already taken for this sitting' using errcode='23P01';
  end if;
  return new;
end; $$;
drop trigger if exists guard_table_booking on public.reservations;
create trigger guard_table_booking before insert or update of table_id,seat_ids,date,time,party_size,status
on public.reservations for each row execute function public.guard_table_booking();
commit;

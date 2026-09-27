begin;
create extension if not exists pgcrypto;

create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '', email text not null default '',
  role text not null check(role in ('owner','editor')), active boolean not null default true,
  created_at timestamptz not null default now()
);
create function public.is_staff() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.staff_profiles where id=auth.uid() and active);
$$;
create function public.is_owner() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.staff_profiles where id=auth.uid() and active and role='owner');
$$;

create table public.site_config (
  key text primary key check(key in ('content','settings','appearance')),
  published jsonb not null default '{}', draft jsonb,
  updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null
);
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 100),
  sort_order integer not null default 0 check(sort_order>=0), status text not null default 'draft' check(status in ('draft','published','archived')),
  updated_at timestamptz not null default now()
);
create table public.menu_items (
  id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 120),
  description text not null default '', category_id uuid references public.menu_categories(id) on delete set null,
  price numeric(10,2) check(price>=0), image text not null default '', dietary text not null default '', allergens text not null default '',
  available boolean not null default true, featured boolean not null default false,
  sort_order integer not null default 0 check(sort_order>=0), status text not null default 'draft' check(status in ('draft','published','archived')),
  draft jsonb, updated_at timestamptz not null default now()
);
create table public.media_assets (
  id uuid primary key default gen_random_uuid(), name text not null, alt text not null default '',
  path text not null unique, url text not null unique, type text not null check(type in ('image','pdf')),
  size integer not null check(size>0), created_at timestamptz not null default now(), uploaded_by uuid references auth.users(id) on delete set null
);
create table public.menu_documents (
  id uuid primary key default gen_random_uuid(), name text not null, url text not null,
  version integer not null default 1 check(version>0), status text not null default 'draft' check(status in ('draft','published','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.reservations (
  id uuid primary key default gen_random_uuid(), request_id uuid not null unique,
  name text not null check(length(name) between 2 and 100), email text not null check(length(email)<=254), phone text not null check(length(phone)<=30),
  date date not null, time time not null, party_size integer not null check(party_size between 1 and 100),
  requests text not null default '' check(length(requests)<=1000),
  status text not null default 'pending' check(status in ('pending','confirmed','cancelled','completed','no-show')),
  internal_notes text not null default '', email_status text not null default 'not_sent',
  privacy_accepted_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.contact_enquiries (
  id uuid primary key default gen_random_uuid(), request_id uuid not null unique,
  name text not null check(length(name) between 2 and 100), email text not null check(length(email)<=254), message text not null check(length(message) between 10 and 3000),
  status text not null default 'new' check(status in ('new','read','resolved')),
  privacy_accepted_at timestamptz not null, created_at timestamptz not null default now()
);
create table public.content_revisions (
  id uuid primary key default gen_random_uuid(), resource text not null, resource_id text not null,
  snapshot jsonb not null, actor uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor uuid references auth.users(id) on delete set null,
  action text not null, resource text not null, resource_id text not null, created_at timestamptz not null default now()
);
create table public.rate_limits (key text primary key, count integer not null, window_start timestamptz not null);
create index reservations_date_status on public.reservations(date,status);
create index menu_items_status_order on public.menu_items(status,sort_order);
create index enquiries_status on public.contact_enquiries(status,created_at desc);
create index revisions_resource on public.content_revisions(resource,resource_id,created_at desc);
create index audit_created on public.audit_logs(created_at desc);

create function public.record_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare rid text;
begin
  if tg_table_name='site_config' then rid=coalesce(to_jsonb(new)->>'key',to_jsonb(old)->>'key'); else rid=coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id'); end if;
  insert into public.audit_logs(actor,action,resource,resource_id) values(auth.uid(),lower(tg_op),tg_table_name,rid);
  if tg_op='UPDATE' and tg_table_name in ('site_config','menu_items') then
    insert into public.content_revisions(resource,resource_id,snapshot,actor) values(tg_table_name,rid,to_jsonb(old),auth.uid());
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
create function public.touch_updated() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at=now();return new;end; $$;
do $$ declare t text; begin
  foreach t in array array['site_config','menu_categories','menu_items','media_assets','menu_documents','reservations','contact_enquiries','staff_profiles'] loop
    execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function public.record_change()',t);
  end loop;
  foreach t in array array['site_config','menu_categories','menu_items','menu_documents','reservations'] loop
    execute format('create trigger touch_updated before update on public.%I for each row execute function public.touch_updated()',t);
  end loop;
  foreach t in array array['staff_profiles','site_config','menu_categories','menu_items','media_assets','menu_documents','reservations','contact_enquiries','content_revisions','audit_logs','rate_limits'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

create policy staff_read on public.staff_profiles for select to authenticated using(public.is_staff());
-- Staff membership changes are only made by the owner-checked server, using the service role.
create policy config_read on public.site_config for select to authenticated using(public.is_staff());
create policy config_write on public.site_config for update to authenticated using(public.is_owner() or (key='content' and public.is_staff())) with check(public.is_owner() or (key='content' and public.is_staff()));
do $$ declare t text; begin
  foreach t in array array['menu_categories','menu_items','media_assets','menu_documents'] loop
    execute format('create policy staff_manage on public.%I for all to authenticated using(public.is_staff()) with check(public.is_staff())',t);
  end loop;
  foreach t in array array['reservations','contact_enquiries'] loop
    execute format('create policy staff_read on public.%I for select to authenticated using(public.is_staff())',t);
    execute format('create policy staff_update on public.%I for update to authenticated using(public.is_staff()) with check(public.is_staff())',t);
    execute format('create policy owner_delete on public.%I for delete to authenticated using(public.is_owner())',t);
  end loop;
  foreach t in array array['content_revisions','audit_logs'] loop
    execute format('create policy staff_read on public.%I for select to authenticated using(public.is_staff())',t);
  end loop;
end $$;

-- Public views deliberately omit drafts, staff data, customer records and internal notes.
create view public.public_config as select key,published from public.site_config;
create view public.public_menu as select id,name,description,category_id,price,image,dietary,allergens,available,featured,sort_order,status from public.menu_items where status='published';
create view public.public_categories as select id,name,sort_order,status from public.menu_categories where status='published';
create view public.public_documents as select id,name,url,version,status,created_at from public.menu_documents where status='published';
grant select on public.public_config,public.public_menu,public.public_categories,public.public_documents to anon,authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
revoke all on public.rate_limits from anon,authenticated;

create function public.consume_rate_limit(p_key text,p_limit integer,p_window_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$
declare current_count integer;
begin
  insert into public.rate_limits(key,count,window_start) values(p_key,1,now())
  on conflict(key) do update set count=case when public.rate_limits.window_start<now()-make_interval(secs=>p_window_seconds) then 1 else public.rate_limits.count+1 end,
    window_start=case when public.rate_limits.window_start<now()-make_interval(secs=>p_window_seconds) then now() else public.rate_limits.window_start end returning count into current_count;
  delete from public.rate_limits where window_start<now()-interval '1 day';
  return current_count<=p_limit;
end; $$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;

create function public.publish_config(p_key text) returns void language plpgsql security invoker set search_path='' as $$
begin
  if not public.is_staff() or (p_key<>'content' and not public.is_owner()) then raise exception 'Not authorized'; end if;
  update public.site_config set published=draft,draft=null,updated_by=auth.uid() where key=p_key and draft is not null;
end; $$;
revoke all on function public.publish_config(text) from public,anon;
grant execute on function public.publish_config(text) to authenticated;

-- Service-side booking validation is repeated here so a stale form cannot bypass current rules.
create function public.validate_reservation() returns trigger language plpgsql security definer set search_path='' as $$
declare s jsonb; h jsonb; opens time; closes time; slot_minutes integer;
begin
  select published into s from public.site_config where key='settings';
  if not coalesce((s->>'booking_enabled')::boolean,false) then raise exception 'Reservations are closed';end if;
  if new.party_size>(s->>'max_party')::integer then raise exception 'Party too large';end if;
  if (s->'closures') ? new.date::text then raise exception 'Date closed';end if;
  if new.date>(now() at time zone 'Africa/Johannesburg')::date+(s->>'horizon_days')::integer then raise exception 'Date beyond booking window';end if;
  if (new.date+new.time) at time zone 'Africa/Johannesburg'<now()+make_interval(hours=>(s->>'lead_hours')::integer) then raise exception 'Insufficient notice';end if;
  select value into h from jsonb_array_elements(s->'hours') where (value->>'day')::integer=extract(dow from new.date)::integer;
  if h is null then raise exception 'Restaurant closed';end if;
  opens=(h->>'open')::time;closes=(h->>'close')::time;
  slot_minutes=extract(epoch from (new.time-opens))::integer/60;
  if new.time<opens or new.time>=closes or slot_minutes%(s->>'interval_minutes')::integer<>0 then raise exception 'Time unavailable';end if;
  return new;
end; $$;
create trigger validate_reservation before insert on public.reservations for each row execute function public.validate_reservation();

insert into public.site_config(key,published) values
('content','{}'),('appearance','{}'),('settings','{"name":"BUKO","phone":"","email":"","address":"","map_url":"","instagram_url":"","hours":[],"closures":[],"booking_enabled":false,"max_party":8,"lead_hours":4,"horizon_days":90,"interval_minutes":30,"menu_mode":"digital","privacy_contact":""}');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('restaurant-media','restaurant-media',true,10485760,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;
create policy restaurant_media_read on storage.objects for select to public using(bucket_id='restaurant-media');
-- Direct storage writes are service-only; the upload server validates bytes and normalises images.
commit;

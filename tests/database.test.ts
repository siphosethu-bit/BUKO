import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const pg=new PGlite();
const owner='10000000-0000-4000-8000-000000000001';
const editor='10000000-0000-4000-8000-000000000002';
before(async()=>{
 await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text);alter table storage.objects enable row level security;`);
 const migration=await readFile('supabase/migrations/001_initial.sql','utf8');
 await pg.exec(migration.replace('create extension if not exists pgcrypto;',''));
 for (const file of ['002_reservation_tables.sql', '003_table_booking_guard.sql', '004_seat_booking_guard.sql']) {
   await pg.exec(await readFile(`supabase/migrations/${file}`, 'utf8'));
 }
 await pg.exec(`insert into auth.users values('${owner}'),('${editor}');insert into public.staff_profiles(id,name,role) values('${owner}','Owner','owner'),('${editor}','Editor','editor');`);
});
after(async()=>{await pg.close();});
async function as(role:string,uid:string,fn:()=>Promise<void>){await pg.exec(`set role ${role};select set_config('request.jwt.claim.sub','${uid}',false);`);try{await fn();}finally{await pg.exec('reset role;');}}
test('anonymous readers cannot access private content or reservation records',async()=>{await as('anon','',async()=>{for(const table of ['staff_profiles','site_config','menu_items','reservations','contact_enquiries','audit_logs','content_revisions','rate_limits'])await assert.rejects(pg.query(`select * from public.${table}`));const configs=await pg.query('select * from public.public_config');assert.equal(configs.rows.length,3);assert.ok(!Object.keys(configs.rows[0] as object).includes('draft'));});});
test('editor can draft content but cannot publish owner settings or change roles',async()=>{await as('authenticated',editor,async()=>{await pg.exec(`update site_config set draft='{"hero_title":"Private draft"}' where key='content';`);const update=await pg.query(`update site_config set draft='{"booking_enabled":true}' where key='settings' returning key`);assert.equal(update.rows.length,0);const roles=await pg.query(`update staff_profiles set role='owner' where id='${editor}' returning id`);assert.equal(roles.rows.length,0);await assert.rejects(pg.query(`select publish_config('settings')`));});});
test('drafts stay private until staff publishes, and old content is revisioned',async()=>{await as('anon','',async()=>{const result=await pg.query<{published:Record<string,unknown>}>(`select published from public_config where key='content'`);assert.equal(result.rows[0].published.hero_title,undefined);});await as('authenticated',editor,async()=>{await pg.exec(`select publish_config('content')`);const revisions=await pg.query(`select * from content_revisions where resource='site_config'`);assert.ok(revisions.rows.length>=2);});await as('anon','',async()=>{const result=await pg.query<{published:Record<string,unknown>}>(`select published from public_config where key='content'`);assert.equal(result.rows[0].published.hero_title,'Private draft');});});
test('menu public view hides drafts and archived items',async()=>{await as('authenticated',editor,async()=>{await pg.exec(`insert into menu_items(name,status,draft) values('Draft dish','draft','{"description":"private"}'),('Live dish','published','{"description":"not public"}'),('Archived dish','archived',null);`);});await as('anon','',async()=>{const rows=await pg.query<{name:string}>('select * from public_menu');assert.equal(rows.rows.length,1);assert.equal(rows.rows[0].name,'Live dish');assert.ok(!Object.keys(rows.rows[0]).includes('draft'));});});
test('rate limiting is atomic and inaccessible to public roles',async()=>{await as('anon','',async()=>{await assert.rejects(pg.query(`select consume_rate_limit('test',2,900)`));});await as('service_role','',async()=>{const values=[];for(let i=0;i<3;i++){const r=await pg.query<{ok:boolean}>(`select consume_rate_limit('test',2,900) as ok`);values.push(r.rows[0].ok);}assert.deepEqual(values,[true,true,false]);});});
test('booking trigger rejects unconfigured hours, saves valid requests and prevents duplicates',async()=>{
 const id=crypto.randomUUID();const insert=`insert into reservations(request_id,name,email,phone,date,time,party_size,privacy_accepted_at) values('${id}','Guest','guest@example.com','+27820000000',(now() at time zone 'Africa/Johannesburg')::date+1,'13:00',2,now())`;
 await as('service_role','',async()=>{await assert.rejects(pg.query(insert));});
 const hours=Array.from({length:7},(_,day)=>({day,open:'12:00',close:'22:00'}));
 await pg.query(`update site_config set published=published || $1::jsonb where key='settings'`,[JSON.stringify({booking_enabled:true,hours})]);
 await as('service_role','',async()=>{await pg.exec(insert);await assert.rejects(pg.exec(insert));});
 await as('authenticated',editor,async()=>{const r=await pg.query<{status:string}>('select status from reservations');assert.equal(r.rows[0].status,'pending');});
});
test('deactivated staff lose access even with a valid user id',async()=>{await pg.exec(`update staff_profiles set active=false where id='${editor}'`);await as('authenticated',editor,async()=>{const r=await pg.query('select * from reservations');assert.equal(r.rows.length,0);const c=await pg.query('select * from site_config');assert.equal(c.rows.length,0);});});

test('table guard rejects overlaps and capacity violations, and releases cancelled bookings', async () => {
  const insert = (table: string, time: string, guests = 2) => pg.query<{id:string}>(
    `insert into reservations(request_id,name,email,phone,date,time,party_size,table_id,privacy_accepted_at)
     values($1,'Guest','guest@example.com','+27820000000',(now() at time zone 'Africa/Johannesburg')::date+2,$2,$3,$4,now()) returning id`,
    [crypto.randomUUID(), time, guests, table],
  );
  await as('service_role', '', async () => {
    const first = await insert('W1', '18:00');
    await assert.rejects(insert('W1', '19:00'), /already taken/);
    await assert.rejects(insert('W2', '18:00', 4), /accommodate/);
    await assert.rejects(insert('missing', '18:00'), /accommodate/);
    await insert('W1', '20:00');
    await insert('W2', '18:00');
    await pg.query(`update reservations set status='cancelled' where id=$1`, [first.rows[0].id]);
    await insert('W1', '18:00');
    await assert.rejects(pg.query(`update reservations set status='confirmed' where id=$1`, [first.rows[0].id]), /already taken/);
  });
});

test('different chairs at one table can be requested, but overlapping seat picks cannot', async () => {
  const reserve = (seatIds:string, table:string) => pg.query(
    `insert into reservations(request_id,name,email,phone,date,time,party_size,table_id,seat_ids,privacy_accepted_at)
     values($1,'Guest','guest@example.com','+27820000000',(now() at time zone 'Africa/Johannesburg')::date+3,'18:00',2,$2,$3,now())`,
    [crypto.randomUUID(), table, seatIds],
  );
  await as('service_role', '', async () => {
    await reserve('M1-1', 'M1');
    await reserve('M1-2', 'M1');
    await assert.rejects(reserve('M1-1,M2-1', ''), /already taken/);
    await assert.rejects(reserve('', 'M1'), /already taken/);
    await assert.rejects(reserve('M1-5', 'M1'), /Unknown seat/);
    await assert.rejects(reserve('M2-1,M2-1', 'M2'), /unique seat/);
    await reserve('M2-1,M3-1', '');
    await assert.rejects(reserve('M3-1', 'M3'), /already taken/);
  });
});

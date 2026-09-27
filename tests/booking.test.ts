import {test} from 'node:test';
import assert from 'node:assert/strict';
import { bookingSlots,johannesburgDate } from '../src/lib/booking';
import { defaultSettings } from '../src/lib/defaults';
import { reservationSchema,settingsSchema,contentSchema } from '../src/lib/validation';
import { addMinutes,overlaps,findTable,tables } from '../src/lib/floor-plan';
const settings={...defaultSettings,booking_enabled:true,hours:[{day:4,open:'12:00',close:'15:00'}]};
const now=new Date('2026-09-24T07:00:00Z');
test('Johannesburg date handles midnight independently of server timezone',()=>{assert.equal(johannesburgDate(new Date('2026-09-23T22:30:00Z')),'2026-09-24');});
test('booking slots apply lead time and exclude closing time',()=>{assert.deepEqual(bookingSlots('2026-09-24',settings,now),['13:00','13:30','14:00','14:30']);});
test('closed, disabled, out-of-window and invalid dates produce no slots',()=>{assert.deepEqual(bookingSlots('2026-09-24',{...settings,closures:['2026-09-24']},now),[]);assert.deepEqual(bookingSlots('2026-09-24',defaultSettings,now),[]);assert.deepEqual(bookingSlots('2026-09-25',settings,now),[]);assert.deepEqual(bookingSlots('2027-09-24',settings,now),[]);assert.deepEqual(bookingSlots('2026-02-31',settings,now),[]);});
test('booking input requires consent, idempotency key and valid contact',()=>{const input={name:'Thabo Guest',email:'guest@example.com',phone:'+27 82 000 0000',date:'2026-09-24',time:'13:00',party_size:2,requests:'',website:'',consent:true,request_id:crypto.randomUUID()};assert.equal(reservationSchema.safeParse(input).success,true);for(const invalid of [{consent:false},{website:'spam'},{party_size:-1},{request_id:''},{email:'invalid'},{phone:'abc'},{table_id:'x'.repeat(41)}])assert.equal(reservationSchema.safeParse({...input,...invalid}).success,false);
assert.equal(reservationSchema.safeParse({...input,table_id:'W1'}).data?.table_id,'W1');
assert.equal(reservationSchema.safeParse(input).data?.table_id,'');});
test('table turn times clamp to the day and overlap only within one sitting',()=>{
  assert.equal(addMinutes('19:00',120),'21:00');
  assert.equal(addMinutes('23:30',120),'23:59');
  assert.equal(overlaps('19:00','20:30'),true);
  assert.equal(overlaps('19:00','21:00'),false);
  assert.equal(overlaps('21:00','19:00'),false);
});
test('every table has a unique id and belongs to a real zone',()=>{
  assert.equal(new Set(tables.map(t=>t.id)).size,tables.length);
  assert.equal(findTable('W1')?.seats,2);
  assert.equal(findTable('nope'),undefined);
  assert.ok(tables.every(t=>t.seats>0));
});
test('settings reject duplicate days and overnight or missing hours',()=>{assert.equal(settingsSchema.safeParse({...defaultSettings,booking_enabled:true}).success,false);assert.equal(settingsSchema.safeParse({...settings,hours:[...settings.hours,...settings.hours]}).success,false);assert.equal(settingsSchema.safeParse({...settings,hours:[{day:1,open:'22:00',close:'12:00'}]}).success,false);});
test('content does not accept unsafe or third-party image URLs',()=>{assert.equal(contentSchema.shape.hero_image.safeParse('javascript:alert(1)').success,false);assert.equal(contentSchema.shape.hero_image.safeParse('https://untrusted.example/file.svg').success,false);assert.equal(contentSchema.shape.hero_image.safeParse('/images/hero.webp').success,true);});

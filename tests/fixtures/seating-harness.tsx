import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {FloorPlan} from '../../src/components/floor-plan';
function Harness(){
  const [seats,setSeats]=useState<string[]>([]);const [date,setDate]=useState('2026-10-01');const [time,setTime]=useState('18:00');const [party,setParty]=useState(2);
  return <main style={{padding:24,maxWidth:900,margin:'auto'}}><h1>Reservation test</h1><label>Guests<select value={party} onChange={e=>{setParty(Number(e.target.value));setSeats([]);}}>{[2,4,6,10].map(n=><option key={n}>{n}</option>)}</select></label><FloorPlan seats={seats} onSelect={setSeats} date={date} time={time} partySize={party} ready slots={['18:00','19:00','20:00']} onDateChange={v=>{setDate(v);setSeats([]);}} onTimeChange={v=>{setTime(v);setSeats([]);}}/><p data-testid="chosen">{seats.join(',')||'none'}</p></main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);

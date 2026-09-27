'use client';
import {useState} from 'react';
import Image from 'next/image';
import {Search, Leaf} from 'lucide-react';
import type {Category,Dish} from '@/lib/types';

export function MenuBrowser({dishes,categories}:{dishes:Dish[];categories:Category[]}){
  const [selected,setSelected]=useState('all');
  const [query,setQuery]=useState('');
  const term=query.trim().toLowerCase();
  const visible=dishes.filter(d=>d.available&&(selected==='all'||selected===d.category_id)&&`${d.name} ${d.description} ${d.dietary}`.toLowerCase().includes(term));
  // Keep the kitchen's own ordering, and group anything without a category under "More".
  const courses=categories.map(c=>({category:c,items:visible.filter(d=>d.category_id===c.id).sort((a,b)=>a.sort_order-b.sort_order)})).filter(c=>c.items.length);
  const loose=visible.filter(d=>!categories.some(c=>c.id===d.category_id));
  if(loose.length)courses.push({category:{id:'other',name:'Also on the menu',sort_order:999,status:'published'},items:loose});

  return <>
    <div className="menu-toolbar">
      <div className="menu-search">
        <label className="sr-only" htmlFor="menu-search">Find a dish</label>
        <Search size={16} strokeWidth={1.7} aria-hidden="true"/>
        <input id="menu-search" type="search" placeholder="Search the menu" value={query} onChange={e=>setQuery(e.target.value)}/>
      </div>
      <div className="category-tabs" role="group" aria-label="Filter menu by course">
        <button type="button" aria-pressed={selected==='all'} onClick={()=>setSelected('all')}>All</button>
        {categories.map(c=><button type="button" key={c.id} aria-pressed={selected===c.id} onClick={()=>setSelected(c.id)}>{c.name}</button>)}
      </div>
    </div>

    {courses.map((course,ci)=>(
      <section className="menu-course" key={course.category.id} style={{'--c':ci} as React.CSSProperties}>
        <div className="menu-course-head">
          <h2>{course.category.name}</h2>
          <span aria-hidden="true"/>
          <small>{course.items.length} {course.items.length===1?'dish':'dishes'}</small>
        </div>
        <ul className="menu-course-list">
          {course.items.map((d,i)=>(
            <li className={`menu-row${d.image?' has-photo':''}`} key={d.id} style={{'--i':i} as React.CSSProperties}>
              {d.image&&<span className="menu-row-photo"><Image src={d.image} alt={d.name} fill sizes="(max-width: 700px) 92px, 120px" quality={90}/></span>}
              <div className="menu-row-body">
                <p className="menu-row-head">
                  <span className="menu-row-name">{d.name}</span>
                  <span className="menu-row-leader" aria-hidden="true"/>
                  {d.price!==null&&<span className="menu-row-price">R{Number(d.price).toFixed(0)}</span>}
                </p>
                {d.description&&<p className="menu-row-note">{d.description}</p>}
                {(d.dietary||d.allergens)&&<p className="menu-row-tags">
                  {d.dietary&&<span className="menu-tag"><Leaf size={11} strokeWidth={1.8}/>{d.dietary}</span>}
                  {d.allergens&&<span className="menu-allergens">Contains {d.allergens.toLowerCase()}</span>}
                </p>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    ))}

    {!visible.length&&<div className="empty-state">{dishes.length?`Nothing on the menu matches “${query}”. Try another dish or course.`:'Our kitchen is putting the finishing touches on this menu. Please check back soon.'}</div>}
  </>;
}

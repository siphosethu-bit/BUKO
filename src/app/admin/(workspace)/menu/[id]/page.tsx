import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { DishEditor } from '@/components/admin/menu-editor';
import { AdminHeading } from '@/components/admin/shared';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const {client}=await requireStaff();const [dish,categories,assets]=await Promise.all([id==='new'?Promise.resolve({data:{}}):client.from('menu_items').select('*').eq('id',id).single(),client.from('menu_categories').select('*').order('sort_order'),client.from('media_assets').select('*').eq('type','image')]);if(!dish.data)notFound();return <><AdminHeading title={id==='new'?'Something new.':'The details of a dish.'} description="Save privately, then publish when everything is right."/><DishEditor dish={dish.data} categories={categories.data||[]} assets={assets.data||[]}/></>;}

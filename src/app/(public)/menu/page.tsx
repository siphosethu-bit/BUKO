import Image from 'next/image';
import { getSite } from '@/lib/data';
import { PageIntro } from '@/components/page-intro';
import { MenuBrowser } from '@/components/menu-browser';
export const metadata = {title:'Our Menu', alternates:{canonical:'/menu'}};
export default async function Page() {
  const site = await getSite();
  const showDishes = site.settings.menu_mode !== 'pdf' || (site.sampleMenu && !site.documents.length);
  const favourites = site.dishes.filter(d => d.featured && d.available && d.image).slice(0, 3);
  return <main id="main" className="page-main menu-page">
    <PageIntro eyebrow="From the kitchen" title="A taste of BUKO."><p>For a long lunch, a shared supper, or just something sweet.</p></PageIntro>
    <div className="section-wrap menu-content">
      {showDishes && favourites.length > 0 && <section className="menu-favourites" aria-label="Kitchen favourites">
        {favourites.map(d => <article key={d.id} className="menu-favourite">
          <div className="menu-favourite-image"><Image src={d.image} alt={d.name} fill sizes="(max-width: 700px) 88vw, 29vw" quality={90}/></div>
          <div><span className="eyebrow">{site.categories.find(c => c.id === d.category_id)?.name || 'Kitchen favourite'}</span><h2>{d.name}</h2><p>{d.description}</p></div>
        </article>)}
      </section>}
      <div className="menu-section-intro"><div><span className="eyebrow">At the table</span><h2>Find your favourite.</h2></div><p>{site.sampleMenu ? 'Sample menu' : 'Our menu'} <span aria-hidden="true">·</span> Prices in rand</p></div>
      {showDishes && <MenuBrowser dishes={site.dishes} categories={site.categories}/>}
      {site.settings.menu_mode !== 'digital' && <div className="document-list">{site.documents.length ? site.documents.map(d => <a className="button button-dark-outline" href={d.url} key={d.id} target="_blank" rel="noreferrer">Download {d.name} (PDF) ↗</a>) : !showDishes && <p>The printed menu will be available here soon.</p>}</div>}
      <p className="menu-footnote">Please let our team know about any allergies or dietary requirements before ordering.</p>
    </div>
  </main>;
}

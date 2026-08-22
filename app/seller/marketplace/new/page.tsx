'use client';
import Link from 'next/link';
import {useState} from 'react';
import {Portal} from '../../../renter/page';
import {loadListings,saveListings,type Listing} from '../listing-store';

export default function NewListing(){
  const [published,setPublished]=useState(false);
  const [publishedText,setPublishedText]=useState('');
  const publish=(form:HTMLFormElement)=>{
    const data=new FormData(form);
    const quantity=Number(data.get('quantity'));
    const price=Number(data.get('price'));
    const until=String(data.get('until'));
    const method=String(data.get('method'));
    const donation=method!=='sale';
    const listing:Listing={id:Date.now(),title:quantity.toFixed(1)+' kWh '+(donation?'donation':'for sale'),detail:donation?(method==='fairshare'?'FairShare allocation · Waiting for match':'Free donation · Available today'):(price+'¢/kWh · Available until '+until),result:donation?'0 requests':'0 kWh sold',kind:donation?'donation':'sale'};
    saveListings([listing,...loadListings()]);
    setPublishedText(quantity.toFixed(1)+' kWh is now listed '+(donation?'as a donation.':'at '+price+'¢/kWh.'));
    setPublished(true);
  };
  if(published)return <Portal role="SOLAR SELLER" switchHref="/renter" switchText="Switch to renter"><section className="page-success"><span>✓</span><p className="kicker">LISTING PUBLISHED</p><h1>Your energy offer is ready</h1><p>{publishedText}</p><Link href="/seller/marketplace">View your listing →</Link></section></Portal>;
  return <Portal role="SOLAR SELLER" switchHref="/renter" switchText="Switch to renter">
    <div className="subpage-head"><Link href="/seller/marketplace">← Back to listings</Link><p className="kicker">NEW ENERGY OFFER</p><h1>Create a new listing</h1><p>Choose how much surplus energy to share and how neighbours can access it.</p></div>
    <form className="listing-page-form" onSubmit={e=>{e.preventDefault();publish(e.currentTarget)}}>
      <section><h2>Energy details</h2><label>Available energy <span>Required</span><div className="input-unit"><input name="quantity" type="number" min="0.5" step="0.5" defaultValue="8.0" required/><b>kWh</b></div></label><label>Available until<select name="until" defaultValue="5:00pm"><option value="3:00pm">3:00pm today</option><option value="5:00pm">5:00pm today</option><option value="7:00pm">7:00pm today</option></select></label></section>
      <section><h2>Sharing method</h2><label className="radio-card"><input type="radio" name="method" value="sale" defaultChecked/><span><b>Sell at a fair price</b><small>Earn credit while offering energy below demo retail.</small></span></label><label className="radio-card"><input type="radio" name="method" value="donation"/><span><b>Donate directly</b><small>Offer energy free to a local household.</small></span></label><label className="radio-card"><input type="radio" name="method" value="fairshare"/><span><b>Use FairShare allocation</b><small>Prioritise households according to transparent need factors.</small></span></label></section>
      <section><h2>Price</h2><label>Price per kWh<div className="input-unit"><input name="price" type="number" min="11" max="16" defaultValue="14" required/><b>¢</b></div></label><div className="fair-price-note"><b>Recommended fair-price band: 11–16¢/kWh</b><span>Your price is below the 34¢/kWh demo retail reference.</span></div></section>
      <div className="form-actions"><Link href="/seller/marketplace">Cancel</Link><button type="submit">Publish listing</button></div>
    </form>
  </Portal>
}

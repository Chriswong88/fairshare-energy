'use client';
import Link from 'next/link';
import {useState} from 'react';
import {Portal,Stat} from '../renter/page';

export default function Seller(){
  const [notice,setNotice]=useState('');
  const cancel=(name:string)=>setNotice(name+' has been cancelled.');
  return <Portal role="SOLAR SELLER" switchHref="/renter" switchText="Switch to renter">
    <div className="hero-row seller-hero">
      <div><p className="kicker">YOUR SOLAR, WORKING LOCALLY</p><h1>Share today’s surplus</h1><p>Track your solar use, earn a fair return, or donate surplus energy to a neighbour.</p></div>
      <Link className="primary-link" href="/seller/marketplace/new">+ Create a listing</Link>
    </div>
    {notice&&<div className="notice">✓ {notice}<button onClick={()=>setNotice('')}>×</button></div>}
    <section className="stats seller-stats">
      <Stat label="Wallet balance" value="$34.82" note="Available seller earnings"/>
      <Stat label="Available now" value="12.7 kWh" note="Estimated solar surplus"/>
    </section>
    <section className="solar-flow usage-tracking">
      <div>
        <p className="kicker">SOLAR POWER USAGE TRACKING</p>
        <h2>Today’s estimated energy use</h2>
        <div className="usage-bars">
          <div><span>Generated</span><i><b style={{width:'92%'}}/></i><strong>21.4 kWh</strong></div>
          <div><span>Home usage</span><i><b style={{width:'41%'}}/></i><strong>8.7 kWh</strong></div>
          <div><span>Available surplus</span><i><b style={{width:'59%'}}/></i><strong>12.7 kWh</strong></div>
        </div>
        <small className="assumption-note">Assumed daily solar generation and household usage for this demonstration.</small>
      </div>
      <div className="recommend"><span>RECOMMENDED PRICE</span><b>14¢<small>/kWh</small></b><p>Within today’s fair band</p></div>
    </section>
    <div className="section-head">
      <div><p className="kicker">YOUR LISTINGS</p><h2>Current energy offers</h2></div>
      <Link className="outline view-more" href="/seller/marketplace">View more →</Link>
    </div>
    <section className="seller-list simplified">
      <article><div><h3>8.0 kWh for sale</h3><p>Today until 5:00pm · 14¢/kWh</p></div><b>3.6 kWh sold</b><button className="cancel-button" onClick={()=>cancel('8.0 kWh sale listing')}>Cancel</button></article>
      <article><div><h3>4.0 kWh donation</h3><p>FairShare priority households</p></div><b>4 requests</b><button className="cancel-button" onClick={()=>cancel('4.0 kWh donation')}>Cancel</button></article>
    </section>
  </Portal>
}

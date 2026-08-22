'use client';
import Link from 'next/link';
import {useState} from 'react';
import {usePathname} from 'next/navigation';
export function Portal({children,role,switchHref,switchText}:{children:React.ReactNode;role:string;switchHref:string;switchText:string}){const path=usePathname(),base=role==='RENTER PORTAL'?'/renter':'/seller',links=[['Overview',base],['Marketplace',base+'/marketplace'],['FairShare',base+'/fairshare'],['Wallet & ledger',base+'/wallet']];return <main className="portal"><aside><Link href="/" className="logo"><b>F</b><span>FairShare<small>ENERGY</small></span></Link><nav>{links.map(([label,href])=><Link key={href} href={href} className={path===href?'active':''}>{label}</Link>)}</nav><div><small>{role}</small><strong>{role==='RENTER PORTAL'?'Jamie Reid':'Nguyen household'}</strong><Link href={switchHref}>{switchText} →</Link></div></aside><section className="portal-main"><header><span className="demo-dot">● Demo mode</span><Link className="role-switch" href="/">Choose another role <span>↗</span></Link></header><div className="portal-content">{children}</div></section></main>}
export function Stat({label,value,note}:{label:string;value:string;note:string}){return <article><span>{label}</span><b>{value}</b><small>{note}</small></article>}
export function Feature({n,title,text}:{n:string;title:string;text:string}){return <article><span>{n}</span><h3>{title}</h3><p>{text}</p></article>}
const offers=[['Nguyen household','Figtree','8.4','14¢'],['Bellambi Solar Co-op','Bellambi','12.0','Free'],['Amira & Sam','Woonona','6.2','12¢']];
export default function Renter(){
  const [notice,setNotice]=useState('');
  return <Portal role="RENTER PORTAL" switchHref="/seller" switchText="Switch to seller">
    <div className="hero-row">
      <div><p className="kicker">AFFORDABLE LOCAL POWER</p><h1>Affordable energy, without needing a rooftop</h1><p>Find energy from neighbours and see exactly why an offer is fair.</p></div>
    </div>
    {notice&&<div className="notice">✓ {notice}<button onClick={()=>setNotice('')}>×</button></div>}
    <section className="stats">
      <Stat label="Electricity plan" value="FairShare Local" note="Community solar plan"/>
      <Stat label="Saved this month" value="$12.74" note="This month"/>
      <Stat label="Energy received" value="38.6 kWh" note="From 5 local households"/>
    </section>
    <section className="plan-overview" aria-labelledby="plan-info-title">
      <div className="plan-info">
        <p className="kicker">PLAN INFO</p><h2 id="plan-info-title">FairShare Local plan</h2>
        <dl><div><dt>Monthly usage</dt><dd>186 kWh</dd></div><div><dt>Retail company</dt><dd>GreenSpark Energy</dd></div></dl>
      </div>
      <div className="plan-chart">
        <div className="plan-donut" role="img" aria-label="This month: 38.6 kilowatt-hours purchased and 12 dollars and 74 cents saved"><span><b>38.6</b><small>kWh bought</small></span></div>
        <div className="plan-legend"><p><i className="bought"/>Energy bought <b>38.6 kWh</b></p><p><i className="saved"/>Total saved <b>$12.74</b></p></div>
      </div>
    </section>
    <div className="section-head">
      <div><p className="kicker">NEAR YOU</p><h2>Available energy</h2></div>
      <Link className="outline view-more" href="/renter/marketplace">View more →</Link>
    </div>
    <section className="offer-list">{offers.map(o=><article key={o[0]}><div className="avatar">{o[0].split(' ').map(x=>x[0]).slice(0,2)}</div><div><h3>{o[0]}</h3><p>{o[1]} · within 6 km</p></div><b>{o[2]}<small> kWh</small></b><strong>{o[3]}<small>{o[3]==='Free'?' donated':' / kWh'}</small></strong><button onClick={()=>setNotice(o[2]+' kWh from '+o[0]+' has been added to your purchases.')}>Buy</button></article>)}</section>
  </Portal>
}

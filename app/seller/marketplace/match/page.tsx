'use client';
import Link from 'next/link';
import {useState} from 'react';
import {Portal} from '../../../renter/page';

const households=[['M. Okafor','Hardship · Renter','8.10','2.0 kWh'],['Jamie Reid','Renter · Apartment','6.84','1.2 kWh'],['L. Chen','Apartment · Senior','5.92','0.8 kWh']];
export default function ViewMatch(){
  const [approved,setApproved]=useState(false);
  return <Portal role="SOLAR SELLER" switchHref="/renter" switchText="Switch to renter">
    <div className="subpage-head"><Link href="/seller/marketplace">← Back to listings</Link><p className="kicker">FAIRSHARE MATCH</p><h1>Your donation match</h1><p>See who will receive the 4.0 kWh donation and why they were prioritised.</p></div>
    {approved&&<div className="notice">✓ Allocation approved. Recipients will receive the energy when the demo interval closes.</div>}
    <section className="match-overview"><article><span>ENERGY OFFERED</span><b>4.0 kWh</b></article><article><span>ELIGIBLE REQUESTS</span><b>4 households</b></article><article><span>ALLOCATION TIME</span><b>4:00pm today</b></article></section>
    <section className="match-explanation"><div><p className="kicker">TRANSPARENT ALLOCATION</p><h2>How FairShare selected the match</h2><p>Each household is ranked using energy need × equity weight × participation. Hardship affects priority, never price.</p></div><div className="formula-mini"><b>Need</b><i>×</i><b>Equity</b><i>×</i><b>Participation</b></div></section>
    <section className="match-table"><div className="match-row heading"><span>Household</span><span>Situation</span><span>Score</span><span>Allocation</span></div>{households.map(r=><div className="match-row" key={r[0]}>{r.map((x,i)=><span key={x} className={i===2?'priority-pill':''}>{x}</span>)}</div>)}</section>
    <div className="match-actions"><Link href="/seller/marketplace">Return to listings</Link><button disabled={approved} onClick={()=>setApproved(true)}>{approved?'Allocation approved':'Approve match'}</button></div>
  </Portal>
}

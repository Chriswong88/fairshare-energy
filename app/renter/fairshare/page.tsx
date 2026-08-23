'use client';

import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import LocationLabel from '../../location-label';
import '../../buyer-dashboard.css';
import '../../buyer-energy.css';

type Purchase={id:string;seller_name:string;seller_suburb:string;quantity_kwh:number;price_per_kwh_cents:number;standard_rate_cents:number;status:string;purchased_at:string};
type EnergyData={month:string;purchases:Purchase[];usage:unknown[];summary:{localEnergyKwh:number;gridEnergyKwh:number;totalUsageKwh:number;savingsCents:number;sellerCount:number;averageLocalRateCents:number;coveragePercent:number}};

export default function BuyerEnergyPage() {
  const [month,setMonth]=useState(()=>new Date().toISOString().slice(0,7));
  const [data,setData]=useState<EnergyData>(()=>emptyData());
  const [message,setMessage]=useState('');
  const months=useMemo(()=>monthOptions(),[]),s=data.summary,hasData=s.totalUsageKwh>0;
  useEffect(()=>{let cancelled=false;Promise.resolve().then(()=>{if(!cancelled)setData(localData(month));});fetch(`/api/buyer/energy?month=${month}`).then(async r=>{if(!r.ok)throw new Error('local');const value=await r.json() as EnergyData;if(!cancelled)setData(value);}).catch(()=>undefined);return()=>{cancelled=true};},[month]);
  const cancelPurchase=async(p:Purchase)=>{if(!window.confirm(`Cancel your energy subscription with ${p.seller_name}?`))return;let backend=false;if(!p.id.startsWith('local-')){const response=await fetch(`/api/buyer/energy/${p.id}`,{method:'DELETE'});backend=response.ok;}if(!backend){const local=readLocal().filter(item=>item.id!==p.id&&item.localId!==p.id);localStorage.setItem('fairshare-renter-purchases',JSON.stringify(local));setData(localData(month));}else{const response=await fetch(`/api/buyer/energy?month=${month}`);if(response.ok)setData(await response.json() as EnergyData);}setMessage('Subscription cancelled.');};
  return (
    <main className="buyer-dashboard-page buyer-energy-page">
      <BuyerSidebar />

      <section className="buyer-main">
        <header className="buyer-topbar">
          <button className="buyer-location-button">
            <span aria-hidden="true" /> <LocationLabel />
          </button>
          <button className="buyer-bell-button" aria-label="Notifications">
            <span>2</span>
          </button>
        </header>

        <div className="buyer-energy-content">
          <header className="buyer-energy-head">
            <h1>My Energy</h1>
            <p>Track the local solar you bought and how it was matched to your usage.</p>
          </header>
          {message&&<div className="listing-notice"><span>OK</span>{message}<button onClick={()=>setMessage('')}>x</button></div>}

          <section className="energy-top-stats" aria-label="Energy totals">
            <article>
              <span className="energy-home-icon" />
              <div>
                <p>Local energy bought</p>
                <strong>{kwh(s.localEnergyKwh)}</strong>
              </div>
            </article>
            <article>
              <span className="energy-grid-icon">G</span>
              <div>
                <p>Standard grid energy</p>
                <strong className="blue">{kwh(s.gridEnergyKwh)}</strong>
              </div>
            </article>
            <article>
              <span className="energy-people-icon">P</span>
              <div>
                <p>Local energy coverage</p>
                <strong>{s.coveragePercent}%</strong>
              </div>
            </article>
          </section>

          <section className="energy-main-grid">
            <article className="energy-month-card">
              <div className="energy-card-title">
                <h2>Your energy this month</h2>
                <label className="energy-month-select"><select aria-label="Choose energy month" value={month} onChange={e=>setMonth(e.target.value)}>{months.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select><span className="month-chevron" aria-hidden="true" /></label>
              </div>

              {hasData?<div className="coverage-bar" style={{gridTemplateColumns:`${s.coveragePercent}fr ${100-s.coveragePercent}fr`}}><span>{s.coveragePercent?`${s.coveragePercent}%`:''}</span><span>{s.coveragePercent<100?`${100-s.coveragePercent}%`:''}</span></div>:<div className="coverage-bar empty"><span>0%</span></div>}

              <div className="coverage-legend">
                <span><i className="local" /> Local solar bought <b>{kwh(s.localEnergyKwh)}</b></span>
                <span><i className="grid" /> Standard grid <b>{kwh(s.gridEnergyKwh)}</b></span>
              </div>

              <div className="usage-total-row">
                <div>
                  <p>Total household usage</p>
                  <strong>{kwh(s.totalUsageKwh)}</strong>
                </div>
                <div>
                  <p>Local energy bought</p>
                  <strong className="green">{kwh(s.localEnergyKwh)}</strong>
                </div>
                <div>
                  <p>Grid energy</p>
                  <strong className="blue">{kwh(s.gridEnergyKwh)}</strong>
                </div>
              </div>

              <div className="energy-info-note">
                <span>i</span>
                <p>Your electricity still flows through the grid. Your retailer financially matches verified local solar purchases to your usage.</p>
              </div>
            </article>

            <aside className="purchase-summary-card">
              <h2>Purchase summary</h2>
              <dl>
                <div>
                  <dt><span>P</span> Individual solar sellers</dt>
                  <dd>{s.sellerCount} households</dd>
                </div>
                <div>
                  <dt><span>T</span> Average local price</dt>
                  <dd className="green">{s.averageLocalRateCents.toFixed(1)}c/kWh</dd>
                </div>
                <div>
                  <dt><span>$</span> Standard rate</dt>
                  <dd>35c/kWh</dd>
                </div>
                <div>
                  <dt><span>S</span> Estimated saving</dt>
                  <dd className="green">{aud(s.savingsCents)}</dd>
                </div>
              </dl>
              <Link href="/renter/marketplace">Buy more local energy</Link>
            </aside>
          </section>

          <section className="individual-purchases-card">
            <h2>Your individual purchases</h2>
            <div className="purchase-table">
              <div className="purchase-heading">
                <span />
                <span>Seller</span>
                <span>Suburb</span>
                <span>Energy bought</span>
                <span>Price paid</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {data.purchases.map(p => (
                <div className="purchase-row" key={p.id}>
                  <span className="purchase-solar-icon" />
                  <strong>{p.seller_name}</strong>
                  <span>{p.seller_suburb}</span>
                  <b>{kwh(Number(p.quantity_kwh))}</b>
                  <b>{Number(p.price_per_kwh_cents).toFixed(1)}c/kWh</b>
                  <em>Matched</em>
                  <button className="cancel-purchase-button" onClick={()=>cancelPurchase(p)}>Cancel</button>
                </div>
              ))}
              {!data.purchases.length&&<div className="purchase-row"><span/><strong>No purchases this month</strong></div>}
              <div className="purchase-total-row">
                <strong>Total local energy bought</strong>
                <b>{kwh(s.localEnergyKwh)}</b>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function emptyData(month=new Date().toISOString().slice(0,7)):EnergyData{return{month,purchases:[],usage:[],summary:{localEnergyKwh:0,gridEnergyKwh:0,totalUsageKwh:0,savingsCents:0,sellerCount:0,averageLocalRateCents:0,coveragePercent:0}}}
type LocalPurchase={id:string;localId?:string;seller?:string;seller_name?:string;suburb?:string;seller_suburb?:string;quantityKwh?:number;quantity_kwh?:number;pricePerKwhCents?:number;price_per_kwh_cents?:number;createdAt?:string;purchased_at?:string};
function readLocal():LocalPurchase[]{try{const v:unknown=JSON.parse(localStorage.getItem('fairshare-renter-purchases')??'[]');return Array.isArray(v)?v as LocalPurchase[]:[]}catch{return[]}}
function localData(month:string):EnergyData{const purchases=readLocal().map((p,i):Purchase=>({id:p.id??`local-${i}`,seller_name:p.seller_name??p.seller??'Local seller',seller_suburb:p.seller_suburb??p.suburb??'Wollongong',quantity_kwh:Number(p.quantity_kwh??p.quantityKwh??0),price_per_kwh_cents:Number(p.price_per_kwh_cents??p.pricePerKwhCents??0),standard_rate_cents:35,status:'matched',purchased_at:p.purchased_at??p.createdAt??new Date().toISOString()})).filter(p=>p.purchased_at.slice(0,7)===month);const local=purchases.reduce((n,p)=>n+p.quantity_kwh,0),saving=Math.round(purchases.reduce((n,p)=>n+p.quantity_kwh*(35-p.price_per_kwh_cents),0)),avg=local?purchases.reduce((n,p)=>n+p.quantity_kwh*p.price_per_kwh_cents,0)/local:0;return{...emptyData(month),purchases,summary:{localEnergyKwh:local,gridEnergyKwh:0,totalUsageKwh:local,savingsCents:saving,sellerCount:new Set(purchases.map(p=>p.seller_name)).size,averageLocalRateCents:Math.round(avg*10)/10,coveragePercent:local?100:0}}}
function kwh(n:number){return`${Math.round(n*100)/100} kWh`}function aud(n:number){return new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n/100)}
function monthOptions(){const now=new Date();return Array.from({length:24},(_,i)=>{const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-i,1));return{value:d.toISOString().slice(0,7),label:new Intl.DateTimeFormat('en-AU',{month:'long',year:'numeric',timeZone:'UTC'}).format(d)}})}

function BuyerSidebar() {
  return (
    <aside className="buyer-sidebar">
      <Link href="/" className="buyer-brand">
        <span className="buyer-brand-mark" />
        <span>
          <b>
            Fair<span>Share</span>
          </b>
          <small>Local energy. Shared future.</small>
        </span>
      </Link>

      <div className="buyer-person">
        <span>BL</span>
        <div>
          <strong>Bob Lee</strong>
          <small>Energy Buyer</small>
        </div>
      </div>

      <nav className="buyer-nav">
        <Link href="/renter">
          <span>H</span> Dashboard
        </Link>
        <Link href="/renter/marketplace">
          <span>M</span> Marketplace
        </Link>
        <Link className="active" href="/renter/fairshare">
          <span>Z</span> My Energy
        </Link>
        <Link href="/renter/payment">
          <span>B</span> Bills & Savings
        </Link>
        <Link href="/renter/fairshare">
          <span>I</span> Impact
        </Link>
      </nav>

      <Link className="buyer-role-switch" href="/seller">
        Switch to seller
      </Link>
    </aside>
  );
}

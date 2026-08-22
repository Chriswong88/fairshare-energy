'use client';

import {useState} from 'react';
import {Portal} from './renter/page';

type Role='renter'|'seller';
type Section='marketplace'|'fairshare'|'wallet';

const offers=[['Nguyen household','8.4 kWh','14¢/kWh'],['Bellambi Solar Co-op','12.0 kWh','Free'],['Amira & Sam','6.2 kWh','12¢/kWh']];

export default function PortalSection({role,section}:{role:Role;section:Section}){
  const [message,setMessage]=useState('');
  const renter=role==='renter';
  const shell={role:renter?'RENTER PORTAL':'SOLAR SELLER',switchHref:renter?'/seller':'/renter',switchText:renter?'Switch to seller':'Switch to renter'};

  return <Portal {...shell}>
    {message&&<div className="notice">✓ {message}<button onClick={()=>setMessage('')}>×</button></div>}
    {section==='marketplace'&&(renter
      ? <RenterMarketplace onMessage={setMessage}/>
      : <SellerMarketplace onMessage={setMessage}/>
    )}
    {section==='fairshare'&&(renter
      ? <RenterFairShare onMessage={setMessage}/>
      : <SellerFairShare onMessage={setMessage}/>
    )}
    {section==='wallet'&&(renter
      ? <RenterWallet onMessage={setMessage}/>
      : <SellerWallet onMessage={setMessage}/>
    )}
  </Portal>;
}

function RenterMarketplace({onMessage}:{onMessage:(message:string)=>void}){
  return <>
    <PageHead kicker="LOCAL MARKETPLACE" title="Energy available near you" text="Compare price, distance and donation offers from local solar households." action="View my purchases" onAction={()=>onMessage('You have 2 active demo purchases.')}/>
    <div className="filter-row"><button>All offers · 7</button><button>Donations · 2</button><button>Under 15¢ · 5</button></div>
    <section className="market-grid">{offers.map((offer,index)=><article key={offer[0]}>
      <span className={index===1?'gift badge':'badge'}>{index===1?'DONATION':'FOR SALE'}</span>
      <h3>{offer[0]}</h3><p>Within {index+2} km · Available today</p>
      <div><b>{offer[1]}</b><strong>{offer[2]}</strong></div>
      <button onClick={()=>onMessage('Energy from '+offer[0]+' has been added to your purchases.')}>Buy energy →</button>
    </article>)}</section>
  </>;
}

function SellerMarketplace({onMessage}:{onMessage:(message:string)=>void}){
  return <>
    <PageHead kicker="SELLER MARKETPLACE" title="Manage your energy offers" text="Create, edit and cancel the surplus energy you share with neighbours." action="Create listing" onAction={()=>onMessage('A new 8 kWh demo listing was created.')}/>
    <section className="management-table">
      <div><b>8.0 kWh for sale</b><span>14¢/kWh · Available until 5pm</span><strong>3.6 kWh sold</strong><button onClick={()=>onMessage('Listing cancelled.')}>Cancel</button></div>
      <div><b>4.0 kWh donation</b><span>FairShare allocation · Matching</span><strong>4 requests</strong><button onClick={()=>onMessage('Donation cancelled.')}>Cancel</button></div>
    </section>
    <section className="market-summary"><article><span>Today’s earnings</span><b>$4.28</b></article><article><span>Energy sold</span><b>31.2 kWh</b></article><article><span>Energy donated</span><b>8.0 kWh</b></article></section>
  </>;
}

function RenterFairShare({onMessage}:{onMessage:(message:string)=>void}){
  return <>
    <PageHead kicker="FAIRSHARE PRIORITY" title="Your fair access status" text="See how your published priority score affects allocation when demand exceeds supply." action="Join next round" onAction={()=>onMessage('You joined the 4:00pm FairShare allocation round.')}/>
    <section className="score-board"><div><span>YOUR PRIORITY SCORE</span><b>6.84</b><strong>High priority</strong></div><div><h3>How it is calculated</h3><p><b>3.8</b> energy need × <b>1.8</b> renter equity × <b>1.0</b> participation</p><small>No protected personal details are shown to other residents.</small></div></section>
    <section className="allocation"><h2>Latest allocation</h2><div><span>Requested</span><b>9 kWh</b></div><div><span>Allocated</span><b>8 kWh</b></div><div><span>Price</span><b>14¢/kWh</b></div><button onClick={()=>onMessage('The same formula was applied to everyone.')}>Explain this result</button></section>
  </>;
}

function SellerFairShare({onMessage}:{onMessage:(message:string)=>void}){
  return <>
    <PageHead kicker="FAIRSHARE DONATIONS" title="Allocate surplus fairly" text="Offer energy to households with the greatest need using a transparent formula." action="Donate surplus" onAction={()=>onMessage('4 kWh has been offered to the next FairShare round.')}/>
    <section className="score-board seller-score"><div><span>NEXT ALLOCATION</span><b>4:00pm</b><strong>9 households waiting</strong></div><div><h3>Your current donation</h3><p><b>4.0 kWh</b> will be allocated by need × equity × participation.</p><small>Hardship status affects priority, never the energy price.</small></div></section>
    <section className="allocation"><h2>Allocation controls</h2><div><span>Energy offered</span><b>4.0 kWh</b></div><div><span>Maximum per home</span><b>2.0 kWh</b></div><div><span>Price</span><b>Free</b></div><button onClick={()=>onMessage('Your donation rules have been saved.')}>Save controls</button></section>
  </>;
}

function RenterWallet({onMessage}:{onMessage:(message:string)=>void}){
  return <>
    <PageHead kicker="ENERGY WALLET" title="Credits and transaction ledger" text="Track every dollar, support credit and kilowatt-hour received." action="Add demo credit" onAction={()=>onMessage('$10 demo credit was added to your wallet.')}/>
    <WalletStats values={[['Available credit','$18.40'],['Monthly saving','$12.74'],['Energy received','38.6 kWh']]}/>
    <Ledger rows={[['Today','Bellambi Solar Co-op','Donation received','Free'],['Yesterday','Nguyen household','6.2 kWh purchase','− $0.87'],['20 Aug','FairShare support','Council credit','+ $10.00']]}/>
  </>;
}

function SellerWallet({onMessage}:{onMessage:(message:string)=>void}){
  return <>
    <PageHead kicker="SELLER WALLET" title="Earnings and transfer ledger" text="Follow proceeds, donated energy and completed local transfers." action="Download statement" onAction={()=>onMessage('Your demo seller statement is ready.')}/>
    <WalletStats values={[['Available earnings','$34.82'],['Energy sold','88.4 kWh'],['Energy donated','8.0 kWh']]}/>
    <Ledger rows={[['Today','Jamie Reid','3.6 kWh sale','+ $0.50'],['Yesterday','M. Okafor','Donation completed','4.0 kWh'],['20 Aug','Amira & Sam','12.0 kWh sale','+ $1.68']]}/>
  </>;
}

function PageHead({kicker,title,text,action,onAction}:{kicker:string;title:string;text:string;action:string;onAction:()=>void}){
  return <div className="hero-row"><div><p className="kicker">{kicker}</p><h1>{title}</h1><p>{text}</p></div><button onClick={onAction}>{action}</button></div>;
}

function WalletStats({values}:{values:string[][]}){
  return <section className="stats">{values.map(value=><article key={value[0]}><span>{value[0]}</span><b>{value[1]}</b><small>Updated just now</small></article>)}</section>;
}

function Ledger({rows}:{rows:string[][]}){
  return <section className="ledger-page"><div className="ledger-title"><h2>Transaction history</h2><span>All demo activity</span></div>{rows.map((row,index)=><div className="ledger-entry" key={index}>{row.map(value=><span key={value}>{value}</span>)}</div>)}</section>;
}

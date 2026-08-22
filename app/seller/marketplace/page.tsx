'use client';
import Link from 'next/link';
import {useState} from 'react';
import {Portal} from '../../renter/page';
import {loadListings,saveListings} from './listing-store';

export default function SellerMarketplace(){
  const [listings,setListings]=useState(()=>loadListings());
  const [confirmId,setConfirmId]=useState<number|null>(null);
  const [notice,setNotice]=useState('');
  const confirmCancel=()=>{
    const item=listings.find(x=>x.id===confirmId);
    const next=listings.filter(x=>x.id!==confirmId);
    setListings(next);
    saveListings(next);
    setConfirmId(null);
    setNotice((item?.title||'Listing')+' was cancelled and removed from the marketplace.');
  };
  return <Portal role="SOLAR SELLER" switchHref="/renter" switchText="Switch to renter">
    <div className="hero-row">
      <div><p className="kicker">YOUR LISTINGS</p><h1>Manage your energy offers</h1><p>Create, review and cancel the surplus energy you share with neighbours.</p></div>
      <Link className="primary-link" href="/seller/marketplace/new">+ New listing</Link>
    </div>
    {notice&&<div className="notice">✓ {notice}<button onClick={()=>setNotice('')}>×</button></div>}
    <section className="management-table seller-market-table">
      {listings.map(item=><div key={item.id}>
        <div><b>{item.title}</b><span>{item.detail}</span></div>
        <strong>{item.result}</strong>
        {item.kind==='donation'?<Link className="table-link" href="/seller/marketplace/match">View match</Link>:null}
        <button className="cancel-button" onClick={()=>setConfirmId(item.id)}>Cancel</button>
      </div>)}
      {!listings.length&&<div className="empty-listings"><b>No active listings</b><span>Create a new listing when you have surplus solar energy.</span><Link href="/seller/marketplace/new">Create listing</Link></div>}
    </section>
    {confirmId!==null&&<div className="modal-backdrop" onMouseDown={()=>setConfirmId(null)}>
      <div className="confirm-card" onMouseDown={e=>e.stopPropagation()}>
        <span className="warning-icon">!</span><p className="kicker">CANCEL LISTING</p><h2>Remove this energy offer?</h2><p>The listing will immediately disappear from the seller marketplace. Completed transfers will remain in your ledger.</p>
        <div><button className="secondary-action" onClick={()=>setConfirmId(null)}>Keep listing</button><button className="danger-action" onClick={confirmCancel}>Yes, cancel listing</button></div>
      </div>
    </div>}
  </Portal>
}

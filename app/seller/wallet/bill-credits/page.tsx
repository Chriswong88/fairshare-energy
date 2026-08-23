'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {formatAud, type BillCredit} from '@/lib/bill-credits';
import DownloadStatementButton from '../download-statement-button';

type CreditsResponse = {credits?: BillCredit[]; totalCreditCents?: number; error?: string};

export default function BillCreditsPage() {
  const [data, setData] = useState<CreditsResponse | null>(null);

  useEffect(() => {
    fetch('/api/bill-credits', {cache: 'no-store'})
      .then(async (response) => {
        const result = (await response.json()) as CreditsResponse;
        if (!response.ok) throw new Error(result.error || 'Could not load bill credits.');
        setData(result);
      })
      .catch((error: Error) => setData({error: error.message}));
  }, []);

  return (
    <main className="bill-credits-page">
      <style>{`
        .bill-credits-page{min-height:100vh;background:#f8f8f3;color:#082b2d;padding:42px 24px}.bill-credits-layout{width:min(1050px,100%);margin:0 auto}
        .bill-credits-back{display:inline-block;color:#087a46;text-decoration:none;font-weight:800;margin-bottom:30px}.bill-credits-layout header p{color:#087a46;font-weight:900;letter-spacing:.12em;font-size:13px;margin:0 0 9px}
        .bill-credits-layout header h1{font-family:Georgia,serif;font-size:46px;font-weight:500;margin:0 0 9px}.bill-credits-layout header>span{color:#52617a;font-size:16px}
        .bill-credit-summary,.bill-credit-list,.bill-credits-message{background:white;border:1px solid #d9e0df;border-radius:12px;margin-top:26px;box-shadow:0 8px 24px #11352f0a}
        .bill-credit-summary{padding:25px;display:flex;align-items:center;gap:20px}.bill-credit-summary span{color:#52617a}.bill-credit-summary strong{font-size:30px;color:#087a46;margin-right:auto}
        .bill-credit-summary button,.bill-credits-message a{background:#087a46;color:white;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:800;border:0;cursor:pointer}.bill-credit-summary button:disabled{cursor:wait;opacity:.72}.bill-credit-summary .statement-download-error{color:#a43a2b;font-size:12px;max-width:190px}
        .bill-credit-list{padding:8px 24px 18px;overflow-x:auto}.bill-credit-list-head,.bill-credit-list article{display:grid;grid-template-columns:1fr 1fr 1.2fr 1fr .9fr;gap:18px;align-items:center;min-width:760px}
        .bill-credit-list-head{color:#52617a;font-size:12px;padding:16px 0;border-bottom:1px solid #dfe5ed}.bill-credit-list article{padding:18px 0;border-bottom:1px solid #edf1f5}.bill-credit-list article strong{color:#087a46}.bill-credit-list .confirmed-pill{width:max-content}
        .bill-credits-empty{padding:24px 0;color:#52617a}.bill-credits-message{padding:28px}.bill-credits-message h2{margin-top:0}.bill-credits-message.error{border-color:#e6c9c1}.bill-credits-message.error p{margin-bottom:26px}
        @media(max-width:700px){.bill-credits-page{padding:28px 16px}.bill-credits-layout header h1{font-size:38px}.bill-credit-summary{align-items:flex-start;flex-direction:column}.bill-credit-summary strong{margin:0}.bill-credit-summary button{width:100%;text-align:center;box-sizing:border-box}}
      `}</style>
      <div className="bill-credits-layout">
        <Link className="bill-credits-back" href="/seller/wallet">← Back to earnings</Link>
        <header><p>SELLER WALLET</p><h1>Bill credits</h1><span>Retailer credits calculated from your FairShare energy transactions.</span></header>
        {!data && <section className="bill-credits-message">Loading your bill credits…</section>}
        {data?.error && <section className="bill-credits-message error"><h2>Bill credits unavailable</h2><p>{data.error}</p><Link href="/">Sign in</Link></section>}
        {data && !data.error && <>
          <section className="bill-credit-summary"><span>Total retailer bill credit</span><strong>{formatAud(data.totalCreditCents ?? 0)}</strong><DownloadStatementButton className="bill-credit-download-button" /></section>
          <section className="bill-credit-list">
            <div className="bill-credit-list-head"><span>Date</span><span>Energy matched</span><span>Community earnings</span><span>Bill credit</span><span>Status</span></div>
            {(data.credits ?? []).map((credit) => <article key={credit.id}><span>{new Intl.DateTimeFormat('en-AU').format(new Date(credit.date))}</span><span>{credit.energyKwh.toFixed(2)} kWh</span><span>{formatAud(credit.communityEarningsCents)}</span><strong>{formatAud(credit.retailerCreditCents)}</strong><span className="confirmed-pill">{credit.status}</span></article>)}
            {!data.credits?.length && <p className="bill-credits-empty">No bill credits yet. Completed energy transactions will appear here.</p>}
          </section>
        </>}
      </div>
    </main>
  );
}

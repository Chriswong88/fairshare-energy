'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import type {ElectricityPlanInfo} from '@/lib/electricity-plans';
import LocationLabel from '../../location-label';
import '../../buyer-dashboard.css';
import '../../buyer-bills.css';

type BillsSummary = {
  month: string;
  estimatedBillCents: number;
  billWithoutFairShareCents: number;
  savedThisMonthCents: number;
  localEnergyKwh: number;
  standardGridKwh: number;
  communityRateCents: number;
  standardRateCents: number;
  savingRateCents: number;
  totalSavedSinceJoiningCents: number;
  statementStatus: 'in_progress' | 'confirmed';
  monthlySavings: Array<{month: string; savedCents: number}>;
};

type BillsResponse = {
  summary?: BillsSummary;
  planInfo?: ElectricityPlanInfo;
  error?: string;
};

const fallbackSummary: BillsSummary = {
  month: 'August 2026',
  estimatedBillCents: 9220,
  billWithoutFairShareCents: 10500,
  savedThisMonthCents: 1280,
  localEnergyKwh: 96,
  standardGridKwh: 54,
  communityRateCents: 27,
  standardRateCents: 35,
  savingRateCents: 8,
  totalSavedSinceJoiningCents: 4300,
  statementStatus: 'in_progress',
  monthlySavings: [
    {month: 'May', savedCents: 840},
    {month: 'June', savedCents: 1020},
    {month: 'July', savedCents: 1160},
    {month: 'August', savedCents: 1280},
  ],
};

const fallbackPlanInfo: ElectricityPlanInfo = {
  provider: 'EnergyAustralia',
  plan: 'Flexi Plan',
  headline: 'Variable market offer with flexible billing and no lock-in contract.',
  supplyArea: 'Wollongong / Ausgrid network',
  estimatedAnnualCost: '$1,670 for a typical 3,900 kWh household',
  usageRate: 'Around 35c/kWh standard grid rate used for FairShare estimates',
  solarFeedInTariff: 'Standard feed-in tariff varies by retailer and export conditions',
  billingNote: 'FairShare savings are shown as estimated bill credits until confirmed by the retailer.',
  features: ['No lock-in contract', 'Variable usage rates', 'Retailer applies local energy credits to your bill'],
  sourceNote: 'Sample plan document for development. Replace with verified retailer plan data before production.',
};

export default function BuyerBillsPage() {
  const [summary, setSummary] = useState(fallbackSummary);
  const [planInfo, setPlanInfo] = useState(fallbackPlanInfo);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading'>('idle');
  const [downloadError, setDownloadError] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'demo'>('loading');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/buyer/bills', {cache: 'no-store'})
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as BillsResponse;

        if (!response.ok || !data.summary) {
          throw new Error(data.error ?? 'Could not load bills.');
        }

        if (!cancelled) {
          setSummary(data.summary);
          if (data.planInfo) setPlanInfo(data.planInfo);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('demo');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const downloadStatement = async () => {
    setDownloadStatus('loading');
    setDownloadError('');

    try {
      const response = await fetch('/api/buyer-bills-statement', {cache: 'no-store'});
      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok || !contentType.includes('application/pdf')) {
        const result = (await response.json().catch(() => ({error: 'Could not create the PDF statement.'}))) as {error?: string};
        throw new Error(result.error || 'Could not create the PDF statement.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const disposition = response.headers.get('content-disposition') ?? '';
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? 'fairshare-buyer-statement.pdf';

      link.href = url;
      link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Could not create the PDF statement.');
    } finally {
      setDownloadStatus('idle');
    }
  };

  return (
    <main className="buyer-dashboard-page buyer-bills-page">
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

        <div className="buyer-bills-content">
          <header className="buyer-bills-head">
            <h1>Bills & Savings</h1>
            <p>{status === 'loading' ? 'Loading your latest bill estimate...' : 'See how local energy reduces your electricity costs.'}</p>
          </header>

          <section className="bills-stat-grid" aria-label="Bills and savings overview">
            <article>
              <span className="bill-file-icon">$</span>
              <div>
                <p>Estimated {summary.month.split(' ')[0]} bill</p>
                <strong>{formatMoney(summary.estimatedBillCents)}</strong>
              </div>
            </article>
            <article>
              <span className="bill-pig-icon">S</span>
              <div>
                <p>Saved this month</p>
                <strong className="green">{formatMoney(summary.savedThisMonthCents)}</strong>
              </div>
            </article>
            <article>
              <span className="bill-home-icon" />
              <div>
                <p>Local energy received</p>
                <strong>{formatKwh(summary.localEnergyKwh)}</strong>
              </div>
            </article>
          </section>

          <section className="bills-main-grid">
            <article className="bill-estimate-card">
              <div className="bill-card-title">
                <h2>{summary.month.split(' ')[0]} bill estimate</h2>
                <span>{summary.statementStatus === 'in_progress' ? 'In progress' : 'Confirmed'}</span>
              </div>

              <div className="bill-line">
                <span>Without FairShare</span>
                <strong>{formatMoney(summary.billWithoutFairShareCents)}</strong>
              </div>
              <div className="bill-line saving">
                <span>FairShare local energy saving</span>
                <strong>-{formatMoney(summary.savedThisMonthCents)}</strong>
              </div>

              <div className="final-bill-row">
                <b>Estimated final bill</b>
                <strong>{formatMoney(summary.estimatedBillCents)}</strong>
              </div>

              <div className="bill-info-note">
                <span>i</span>
                <p>Your participating retailer applies this credit to your normal electricity bill.</p>
              </div>

              <p className="bill-footnote">
                {status === 'demo'
                  ? 'Demo estimate shown because no signed-in buyer bill data was found.'
                  : 'Estimate based on your matched local energy transactions.'}
              </p>
            </article>

            <article className="current-rate-card">
              <h2>Your current rate</h2>
              <dl>
                <div>
                  <dt>Community rate</dt>
                  <dd className="green">{summary.communityRateCents}c/kWh</dd>
                </div>
                <div>
                  <dt>Standard rate</dt>
                  <dd>{summary.standardRateCents}c/kWh</dd>
                </div>
                <div>
                  <dt>Saving</dt>
                  <dd className="green">{summary.savingRateCents}c/kWh</dd>
                </div>
              </dl>

              <div className="rate-compare-bar">
                <span />
              </div>
              <div className="rate-label-row">
                <span>{summary.communityRateCents}c/kWh</span>
                <span>{summary.standardRateCents}c/kWh</span>
              </div>

              <button className="view-plan-button" type="button" onClick={() => setIsPlanOpen(true)}>
                View current plan
              </button>
            </article>
          </section>

          <section className="monthly-savings-card">
            <div className="monthly-savings-main">
              <h2>Monthly savings</h2>
              <div className="monthly-saving-list">
                {summary.monthlySavings.map(({month, savedCents}, index) => (
                  <article key={month} className={index === summary.monthlySavings.length - 1 ? 'current' : ''}>
                    <span>{month}</span>
                    <strong>{formatMoney(savedCents)}</strong>
                  </article>
                ))}
              </div>
            </div>

            <aside className="statement-panel">
              <button type="button" onClick={downloadStatement} disabled={downloadStatus === 'loading'}>
                {downloadStatus === 'loading' ? 'Creating PDF...' : 'Download statement'}
              </button>
              {downloadError && <span className="statement-download-error" role="alert">{downloadError}</span>}
              <p>Total saved since joining</p>
              <strong>{formatMoney(summary.totalSavedSinceJoiningCents)}</strong>
            </aside>
          </section>

          <p className="savings-disclaimer">
            <span /> All savings are estimates until confirmed on your retailer bill.
          </p>
        </div>
      </section>

      {isPlanOpen && (
        <div className="plan-modal-backdrop" role="presentation" onClick={() => setIsPlanOpen(false)}>
          <section className="plan-modal" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title" onClick={(event) => event.stopPropagation()}>
            <button className="plan-modal-close" type="button" aria-label="Close plan details" onClick={() => setIsPlanOpen(false)}>
              x
            </button>
            <p className="plan-modal-kicker">{planInfo.provider}</p>
            <h2 id="plan-modal-title">{planInfo.plan}</h2>
            <p className="plan-modal-intro">{planInfo.headline}</p>

            <dl className="plan-detail-list">
              <div>
                <dt>Supply area</dt>
                <dd>{planInfo.supplyArea}</dd>
              </div>
              <div>
                <dt>Estimated annual cost</dt>
                <dd>{planInfo.estimatedAnnualCost}</dd>
              </div>
              <div>
                <dt>Usage rate</dt>
                <dd>{planInfo.usageRate}</dd>
              </div>
              <div>
                <dt>Solar feed-in tariff</dt>
                <dd>{planInfo.solarFeedInTariff}</dd>
              </div>
            </dl>

            <ul className="plan-feature-list">
              {planInfo.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <p className="plan-modal-note">{planInfo.billingNote}</p>
            <small>{planInfo.sourceNote}</small>
          </section>
        </div>
      )}
    </main>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);
}

function formatKwh(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} kWh`;
}

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
        <Link href="/renter/fairshare">
          <span>Z</span> My Energy
        </Link>
        <Link className="active" href="/renter/payment">
          <span>B</span> Bills & Savings
        </Link>
        <Link href="/renter/impact">
          <span>I</span> Impact
        </Link>
      </nav>

      <Link className="buyer-role-switch" href="/seller">
        Switch to seller
      </Link>
    </aside>
  );
}

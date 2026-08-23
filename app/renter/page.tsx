'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect, useState} from 'react';
import type {ElectricityPlanInfo} from '@/lib/electricity-plans';
import LocationLabel from '../location-label';
import '../buyer-dashboard.css';

const usageDays = [
  58, 60, 66, 62, 71, 82, 78, 58, 64, 68, 72, 80, 92, 100, 79, 76,
  91, 79, 68, 72, 66, 49, 62, 48, 57, 68, 73, 59, 58, 48, 59,
];

type BuyerDashboardSummary = {
  fullName: string;
  savedThisMonthCents: number;
  localEnergyKwh: number;
  localEnergySharePercent: number;
  communityRateCents: number;
  standardRateCents: number;
  activeListing: {
    id: string | null;
    title: string;
    monthlyLimitKwh: number;
    matchedThisMonthKwh: number;
    status: string;
    pricePerKwhCents: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    source: string;
    dateLabel: string;
    energyLabel: string;
  }>;
};

type DashboardResponse = {
  summary?: BuyerDashboardSummary;
  planInfo?: ElectricityPlanInfo;
  error?: string;
};

const fallbackSummary: BuyerDashboardSummary = {
  fullName: 'Bob Lee',
  savedThisMonthCents: 1280,
  localEnergyKwh: 96,
  localEnergySharePercent: 64,
  communityRateCents: 27,
  standardRateCents: 35,
  activeListing: {
    id: null,
    title: 'Local energy listing',
    monthlyLimitKwh: 120,
    matchedThisMonthKwh: 96,
    status: 'active',
    pricePerKwhCents: 27,
  },
  recentActivity: [
    {id: 'demo-1', title: 'Matched energy credit', source: 'Local energy listing', dateLabel: 'Today', energyLabel: '+8.6 kWh'},
    {id: 'demo-2', title: 'Matched energy credit', source: 'Local energy listing', dateLabel: '18 May 2026', energyLabel: '+7.2 kWh'},
    {id: 'demo-3', title: 'Matched energy credit', source: 'Local energy listing', dateLabel: '11 May 2026', energyLabel: '+6.4 kWh'},
    {id: 'demo-4', title: 'Matched energy credit', source: 'Local energy listing', dateLabel: '4 May 2026', energyLabel: '+7.8 kWh'},
    {id: 'demo-5', title: 'Matched energy credit', source: 'Local energy listing', dateLabel: '27 Apr 2026', energyLabel: '+6.1 kWh'},
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

export function Portal({
  children,
  role,
  switchHref,
  switchText,
}: {
  children: React.ReactNode;
  role: string;
  switchHref: string;
  switchText: string;
}) {
  const path = usePathname();
  const base = role === 'RENTER PORTAL' ? '/renter' : '/seller';
  const paymentHref = role === 'RENTER PORTAL' ? `${base}/payment` : `${base}/wallet`;
  const links = [
    ['Overview', base],
    [role === 'RENTER PORTAL' ? 'Marketplace' : 'Listings', `${base}/marketplace`],
    ['FairShare', `${base}/fairshare`],
    [role === 'RENTER PORTAL' ? 'Payment' : 'Earnings', paymentHref],
  ];

  return (
    <main className="portal">
      <aside>
        <Link href="/" className="logo">
          <b>F</b>
          <span>
            FairShare<small>ENERGY</small>
          </span>
        </Link>
        <nav>
          {links.map(([label, href]) => (
            <Link key={href} href={href} className={path === href ? 'active' : ''}>
              {label}
            </Link>
          ))}
        </nav>
        <div>
          <small>{role}</small>
          <strong>{role === 'RENTER PORTAL' ? 'Jamie Reid' : 'Nguyen household'}</strong>
          <Link href={switchHref}>{switchText} -&gt;</Link>
        </div>
      </aside>
      <section className="portal-main">
        <header>
          <span className="demo-dot">Demo mode</span>
          <Link href="/">Choose another role</Link>
        </header>
        <div className="portal-content">{children}</div>
      </section>
    </main>
  );
}

export default function Renter() {
  const [summary, setSummary] = useState(fallbackSummary);
  const [planInfo, setPlanInfo] = useState(fallbackPlanInfo);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'demo'>('loading');
  const buyerStats = [
    {tone: 'green', icon: 'W', label: 'Saved this month', value: formatMoney(summary.savedThisMonthCents), note: 'vs. standard rate'},
    {tone: 'gold', icon: 'S', label: 'Local energy received', value: formatKwh(summary.localEnergyKwh), note: 'this month'},
    {tone: 'green', icon: 'P', label: 'Community rate', value: `${summary.communityRateCents}c/kWh`, note: 'incl. GST'},
    {tone: 'blue', icon: 'G', label: 'Standard rate', value: `${summary.standardRateCents}c/kWh`, note: 'incl. GST'},
  ];

  useEffect(() => {
    let cancelled = false;

    fetch('/api/buyer-dashboard', {cache: 'no-store'})
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as DashboardResponse;
        if (!response.ok || !data.summary) throw new Error(data.error ?? 'Could not load dashboard.');
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

  return (
    <main className="buyer-dashboard-page">
      <BuyerSidebar />

      <section className="buyer-main">
        <header className="buyer-topbar">
          <button className="buyer-location-button">
            <span aria-hidden="true" /> <LocationLabel />
          </button>
          <button className="buyer-bell-button" aria-label="Notifications">
            <span>3</span>
          </button>
        </header>

        <div className="buyer-dashboard-content">
          <div className="buyer-greeting-row">
            <h1>Good morning, {firstName(summary.fullName)}</h1>
            <span className="buyer-plan-pill">Renter plan</span>
          </div>

          <section className="buyer-stat-grid" aria-label="Buyer dashboard metrics">
            {buyerStats.map((item) => (
              <article key={item.label}>
                <span className={`buyer-stat-icon ${item.tone}`}>{item.icon}</span>
                <div>
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                  <small>{item.note}</small>
                </div>
              </article>
            ))}
          </section>

          <section className="buyer-dashboard-grid">
            <div className="buyer-left-column">
              <div className="buyer-feature-row">
                <article className="local-match-card">
                  <div className="match-ring">
                    <strong>{summary.localEnergySharePercent}%</strong>
                    <span>of your usage locally matched</span>
                  </div>
                  <p>Your usage is matched with local solar generation through your retailer, not delivered by a private cable.</p>
                  <Link href="/renter/fairshare">How energy matching works <span>i</span></Link>
                </article>

                <article className="active-energy-card">
                  <h2>Electricity plan</h2>
                  <div className="offer-title-row">
                    <span>P</span>
                    <strong>{planInfo.plan}</strong>
                  </div>
                  <dl>
                    <div>
                      <dt>Provider</dt>
                      <dd>{planInfo.provider}</dd>
                    </div>
                    <div>
                      <dt>Supply area</dt>
                      <dd>{planInfo.supplyArea}</dd>
                    </div>
                    <div>
                      <dt>FairShare rate</dt>
                      <dd>{summary.communityRateCents}c/kWh</dd>
                    </div>
                  </dl>
                  <button className="dashboard-plan-details-button" type="button" onClick={() => setIsPlanOpen(true)}>
                    View more details <span>{'>'}</span>
                  </button>
                </article>
              </div>

              <article className="usage-savings-card">
                <div className="usage-title-row">
                  <h2>Usage and savings this month</h2>
                  <div>
                    <span className="local-key" /> Local energy matched
                    <span className="grid-key" /> Standard grid
                  </div>
                </div>
                <div className="usage-chart">
                  <span className="usage-axis">kWh</span>
                  <div className="usage-grid">
                    {[10, 8, 6, 4, 2, 0].map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </div>
                  <div className="usage-bars">
                    {usageDays.map((height, index) => (
                      <span key={index} style={{height: `${height}%`}}>
                        <i />
                      </span>
                    ))}
                  </div>
                  <div className="usage-dates">
                    <span>1 May</span>
                    <span>5 May</span>
                    <span>10 May</span>
                    <span>15 May</span>
                    <span>20 May</span>
                    <span>25 May</span>
                    <span>31 May</span>
                  </div>
                </div>
                <div className="usage-summary-row">
                  <div>
                    <span className="leaf-icon">L</span>
                    <p>You have saved <strong>{formatMoney(summary.savedThisMonthCents)}</strong> this month</p>
                    <small>vs. standard rate</small>
                  </div>
                  <div>
                    <span className="solar-icon">S</span>
                    <p><strong>{formatKwh(summary.localEnergyKwh)}</strong> matched with local solar</p>
                    <small>{summary.localEnergySharePercent}% of your total usage</small>
                  </div>
                </div>
              </article>
            </div>

            <aside className="buyer-right-column">
              <article className="recent-activity-card">
                <h2>Recent activity</h2>
                <div className="buyer-activity-list">
                  {summary.recentActivity.map((item) => (
                    <div key={item.id}>
                      <span>S</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.source}</small>
                        <small>{item.dateLabel}</small>
                      </div>
                      <b>{item.energyLabel}</b>
                    </div>
                  ))}
                </div>
                <Link href="/renter/payment">View all activity <span>{'>'}</span></Link>
              </article>

              <article className="find-energy-card">
                <div className="mini-neighbourhood" aria-hidden="true">
                  <span className="sun" />
                  <span className="home" />
                  <span className="tree left" />
                  <span className="tree right" />
                </div>
                <div>
                  <h2>Find more local energy and support your community.</h2>
                  <Link href="/renter/marketplace">Browse local energy <span>{'>'}</span></Link>
                </div>
              </article>
            </aside>
          </section>
          {status === 'demo' && <p className="buyer-dashboard-note">Demo dashboard values are shown until you sign in as a buyer with database activity.</p>}
        </div>
      </section>

      {isPlanOpen && (
        <div className="plan-modal-backdrop" role="presentation" onClick={() => setIsPlanOpen(false)}>
          <section className="plan-modal" role="dialog" aria-modal="true" aria-labelledby="dashboard-plan-modal-title" onClick={(event) => event.stopPropagation()}>
            <button className="plan-modal-close" type="button" aria-label="Close plan details" onClick={() => setIsPlanOpen(false)}>
              x
            </button>
            <p className="plan-modal-kicker">{planInfo.provider}</p>
            <h2 id="dashboard-plan-modal-title">{planInfo.plan}</h2>
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

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || 'Bob';
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
        <Link className="active" href="/renter">
          <span>H</span> Dashboard
        </Link>
        <Link href="/renter/marketplace">
          <span>M</span> Marketplace
        </Link>
        <Link href="/renter/fairshare">
          <span>Z</span> My Energy
        </Link>
        <Link href="/renter/payment">
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

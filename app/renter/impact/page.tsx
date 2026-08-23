'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import LocationLabel from '../../location-label';
import UserName, {UserInitials} from '../../user-identity';
import '../../buyer-dashboard.css';
import '../../buyer-impact.css';

type ImpactSource = {
  sellerId: string;
  name: string;
  suburb: string;
  energyKwh: number;
  sharePercent: number;
};

type ImpactSummary = {
  localRenewableKwh: number;
  solarHouseholdsSupported: number;
  co2AvoidedKg: number;
  householdUsageKwh: number;
  localEnergySharePercent: number;
  localEnergyGoalPercent: number;
  sources: ImpactSource[];
  community: {
    participatingHouseholds: number;
    sharedThisMonthKwh: number;
    communitySavingsCents: number;
  };
};

type ImpactResponse = {
  summary?: ImpactSummary;
  error?: string;
};

const fallbackSummary: ImpactSummary = {
  localRenewableKwh: 96,
  solarHouseholdsSupported: 4,
  co2AvoidedKg: 72,
  householdUsageKwh: 150,
  localEnergySharePercent: 64,
  localEnergyGoalPercent: 75,
  sources: [
    {sellerId: 'demo-emily', name: 'Emily Carter', suburb: 'Warrawong', energyKwh: 42, sharePercent: 44},
    {sellerId: 'demo-jack', name: 'Jack Thompson', suburb: 'Dapto', energyKwh: 28, sharePercent: 29},
    {sellerId: 'demo-sophie', name: 'Sophie Nguyen', suburb: 'Wollongong', energyKwh: 26, sharePercent: 27},
  ],
  community: {
    participatingHouseholds: 126,
    sharedThisMonthKwh: 4820,
    communitySavingsCents: 124000,
  },
};

export default function BuyerImpactPage() {
  const [summary, setSummary] = useState(fallbackSummary);
  const [status, setStatus] = useState<'loading' | 'ready' | 'demo'>('loading');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/buyer/impact', {cache: 'no-store'})
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as ImpactResponse;

        if (!response.ok || !data.summary) {
          throw new Error(data.error ?? 'Could not load impact.');
        }

        if (!cancelled) {
          setSummary(data.summary);
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
    <main className="buyer-dashboard-page buyer-impact-page">
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

        <div className="buyer-impact-content">
          <header className="buyer-impact-head">
            <h1>Your Community Impact</h1>
            <p>{status === 'loading' ? 'Loading your latest community impact...' : 'See the difference your local energy choices make.'}</p>
          </header>

          <section className="buyer-impact-stats" aria-label="Impact overview">
            <article>
              <span className="impact-home-icon" />
              <div>
                <p>Local renewable energy</p>
                <strong>{formatKwh(summary.localRenewableKwh)}</strong>
              </div>
            </article>
            <article>
              <span className="impact-people-icon" />
              <div>
                <p>Solar households supported</p>
                <strong>{summary.solarHouseholdsSupported}</strong>
              </div>
            </article>
            <article>
              <span className="impact-leaf-icon">L</span>
              <div>
                <p>Estimated CO2 avoided</p>
                <strong>{summary.co2AvoidedKg} kg</strong>
              </div>
            </article>
          </section>

          <section className="buyer-impact-grid">
            <article className="energy-source-card">
              <h2>Where your energy came from</h2>
              <div className="energy-source-list">
                {summary.sources.map((source) => (
                  <div className="energy-source-row" key={source.sellerId}>
                    <span className="source-home-icon" />
                    <div>
                      <div>
                        <strong>{source.name}</strong>
                        <b>{formatKwh(source.energyKwh)}</b>
                      </div>
                      <i><span style={{width: `${source.sharePercent}%`}} /></i>
                    </div>
                  </div>
                ))}
              </div>
              <div className="source-total-row">
                <strong>Total matched locally</strong>
                <b>{formatKwh(summary.localRenewableKwh)}</b>
              </div>
            </article>

            <article className="local-share-card">
              <h2>Your local energy share</h2>
              <div className="local-share-body">
                <div
                  className="impact-share-ring"
                  style={{
                    background: `conic-gradient(#168243 0 ${summary.localEnergySharePercent}%,#dce9e5 ${summary.localEnergySharePercent}% 100%)`,
                  }}
                >
                  <strong>{summary.localEnergySharePercent}%</strong>
                </div>
                <div>
                  <p>of your household usage was matched with local renewable energy this month.</p>
                  <span>Goal: {summary.localEnergyGoalPercent}% local energy</span>
                </div>
              </div>
              <Link href="/renter/marketplace">Browse more local energy</Link>
            </article>
          </section>

          <section className="wollongong-impact-card">
            <h2>Together in Wollongong</h2>
            <div className="community-impact-row">
              <article>
                <span className="community-people-icon" />
                <strong>{summary.community.participatingHouseholds}</strong>
                <p>participating households</p>
              </article>
              <article>
                <span className="community-energy-icon" />
                <strong>{formatNumber(summary.community.sharedThisMonthKwh)} <small>kWh</small></strong>
                <p>shared this month</p>
              </article>
              <article>
                <span>$</span>
                <strong>{formatMoney(summary.community.communitySavingsCents)}</strong>
                <p>community savings</p>
              </article>
            </div>
            <p>Every local match keeps more energy value within the Wollongong community.</p>
          </section>

          <p className="impact-disclaimer">
            <span /> Environmental figures are estimates based on locally matched renewable energy.
            {status === 'demo' ? ' Demo data is shown until you have buyer transactions.' : ''}
          </p>
        </div>
      </section>
    </main>
  );
}

function formatKwh(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} kWh`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-AU').format(value);
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
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
        <span><UserInitials fallback="BL" /></span>
        <div>
          <strong><UserName fallback="Bob Lee" /></strong>
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
        <Link href="/renter/payment">
          <span>B</span> Bills & Savings
        </Link>
        <Link className="active" href="/renter/impact">
          <span>I</span> Impact
        </Link>
      </nav>

      <Link className="buyer-role-switch" href="/seller">
        Switch to seller
      </Link>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import UserName from '../user-identity';
import {useEffect, useMemo, useState} from 'react';
import LocationLabel from '../location-label';

type Dashboard = { profile: {full_name: string} | null; summary: {generatedKwh: number; usedAtHomeKwh: number; batteryKwh: number; sharedLocallyKwh: number; standardExportKwh: number; availableSurplusKwh: number; currentPricePerKwhCents: number; energySoldThisMonthKwh: number; earningsThisMonthCents: number}; activeOffer: {quantityKwh: number; soldKwh: number; pricePerKwhCents: number; status: string} | null; activity: Array<{id: string; date: string; buyerName: string; quantityKwh: number; amountCents: number; ratePerKwhCents: number; status: string}>};

export default function Seller() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    fetch('/api/seller/dashboard').then(async (response) => {
      if (!response.ok) throw new Error();
      return response.json() as Promise<Dashboard>;
    }).then((data) => { if (!disposed) setDashboard(data); }).catch(() => { if (!disposed) setError('Could not load your live seller data. Please sign in and try again.'); });
    return () => { disposed = true; };
  }, []);
  const summary = dashboard?.summary;
  const total = summary?.generatedKwh ?? 0;
  const stats = summary ? [
    {icon: 'bolt', label: 'Available surplus', value: number(summary.availableSurplusKwh), unit: 'kWh'},
    {icon: 'cash', label: 'Current selling price', value: rate(summary.currentPricePerKwhCents), unit: '/kWh'},
    {icon: 'bars', label: 'Energy sold this month', value: number(summary.energySoldThisMonthKwh), unit: 'kWh'},
    {icon: 'wallet', label: 'Earnings this month', value: money(summary.earningsThisMonthCents), unit: ''},
  ] : [];
  const energyBreakdown = useMemo(() => summary ? [
    {label: 'Used at home', amount: summary.usedAtHomeKwh, color: 'green'}, {label: 'Battery', amount: summary.batteryKwh, color: 'lime'},
    {label: 'Shared locally', amount: summary.sharedLocallyKwh, color: 'blue'}, {label: 'Standard export', amount: summary.standardExportKwh, color: 'grey'},
  ] : [], [summary]);
  return (
    <main className="seller-dashboard-page">
      <aside className="seller-sidebar">
        <Link href="/" className="seller-brand">
          <span className="brand-sun" />
          <span>
            <b>
              Fair<span>Share</span>
            </b>
            <small>Share more. Power local.</small>
          </span>
        </Link>

        <div className="seller-person">
          <span className="person-bolt" />
          <div>
            <strong><UserName fallback="Alice Chen" /></strong>
            <small>Solar Seller</small>
          </div>
        </div>

        <nav className="seller-dash-nav">
          <Link className="active" href="/seller">
            <span>H</span> Dashboard
          </Link>
          <Link href="/seller/marketplace/new">
            <span>+</span> Create Listing
          </Link>
          <Link href="/seller/marketplace">
            <span>L</span> My Listings
          </Link>
          <Link href="/seller/wallet">
            <span>E</span> Earnings
          </Link>
          <Link href="/seller/fairshare">
            <span>I</span> Impact
          </Link>
        </nav>

        <Link className="seller-role-switch" href="/renter">
          Switch to buyer
        </Link>

        <div className="sidebar-illustration" aria-hidden="true">
          <span className="cloud cloud-one" />
          <span className="cloud cloud-two" />
          <span className="house-line" />
          <span className="roof-line" />
          <span className="panel-line" />
          <span className="hill-line" />
        </div>
      </aside>

      <section className="seller-dashboard-main">
        <header className="seller-topbar">
          <div />
          <div className="seller-top-actions">
            <button className="location-button">
              <span aria-hidden="true" /> <LocationLabel />
            </button>
            <button className="bell-button" aria-label="Notifications">
              <span>3</span>
            </button>
          </div>
        </header>

        <div className="seller-dashboard-content">
          <div className="seller-greeting-row">
            <div>
              <span className="greeting-sun" />
              <h1>Hi, <UserName first fallback={dashboard?.profile?.full_name?.split(' ')[0] ?? 'there'} /></h1>
            </div>
            <Link className="offer-cta" href="/seller/marketplace/new">
              <span aria-hidden="true" /> Create new offer
            </Link>
          </div>

          <section className="seller-metric-grid" aria-label="Seller metrics">
            {stats.map((item) => (
              <article key={item.label}>
                <span className={`metric-icon ${item.icon}`} />
                <div>
                  <p>{item.label}</p>
                  <strong>
                    {item.value}
                    {item.unit && <small> {item.unit}</small>}
                  </strong>
                </div>
              </article>
            ))}
          </section>

          <section className="dashboard-panel-grid">
            <article className="solar-month-panel">
              <h2>
                Solar energy this month <span>i</span>
              </h2>
              <div className="solar-chart-row">
                <div className="donut-chart">
                  <div>
                    <small>Total</small>
                    <b>{number(total)} kWh</b>
                  </div>
                </div>
                <div className="energy-legend">
                  {energyBreakdown.map((item) => (
                    <div key={item.label}>
                      <span className={item.color} />
                      <p>{item.label}</p>
                      <strong>{number(item.amount)} kWh ({percent(item.amount, total)})</strong>
                    </div>
                  ))}
                  <div className="community-note">
                    <span />
                    <p>You are powering your community and reducing grid exports.</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="active-offer-panel">
              <div className="panel-title-row">
                <h2>Active offer</h2>
                {dashboard?.activeOffer && <span className="active-pill">{dashboard.activeOffer.status}</span>}
              </div>
              {dashboard?.activeOffer ? <><div className="offer-split"><div><b>{number(dashboard.activeOffer.quantityKwh)}</b><span>kWh</span><p>Offered</p></div><div><b>{number(dashboard.activeOffer.soldKwh)}</b><span>kWh</span><p>Sold</p></div></div><div className="community-rate"><span /><div><p>Community rate</p><strong>{rate(dashboard.activeOffer.pricePerKwhCents)}<small>/kWh</small></strong></div></div></> : <p>No active offer yet.</p>}
              <Link className="view-offer-button" href="/seller/marketplace">
                View offer <span>{'>'}</span>
              </Link>
            </article>
          </section>

          <section className="recent-activity-panel">
            <div className="panel-title-row">
              <h2>Recent activity</h2>
              <Link href="/seller/wallet">View all activity</Link>
            </div>
            <div className="activity-table">
              <div className="activity-heading">
                <span />
                <span>Date</span>
                <span>Matched with</span>
                <span>Energy</span>
                <span>Rate</span>
                <span>Earnings</span>
                <span>Status</span>
              </div>
              {dashboard?.activity.map((row) => (
                <div className="activity-row" key={row.id}>
                  <span className="match-icon" />
                  <span>{date(row.date)}</span>
                  <span>
                    <b>{row.buyerName}</b>
                    <small>Community buyer</small>
                  </span>
                  <span>{number(row.quantityKwh)} kWh</span>
                  <span>{rate(row.ratePerKwhCents)}/kWh</span>
                  <span>{money(row.amountCents)}</span>
                  <span className="matched-pill">{row.status === 'completed' ? 'Completed' : 'Matched'}</span>
                </div>
              ))}
              {!dashboard?.activity.length && !error && <p className="empty-state">No buyer matches yet.</p>}
            </div>
          </section>
          {error && <p className="listing-form-error">{error}</p>}
        </div>
      </section>
    </main>
  );
}

function number(value: number) { return new Intl.NumberFormat('en-AU', {maximumFractionDigits: 1}).format(value); }
function money(cents: number) { return new Intl.NumberFormat('en-AU', {style: 'currency', currency: 'AUD'}).format(cents / 100); }
function rate(cents: number) { return `${cents.toFixed(1)}c`; }
function percent(value: number, total: number) { return total ? `${Math.round((value / total) * 100)}%` : '0%'; }
function date(value: string) { return new Intl.DateTimeFormat('en-AU', {dateStyle: 'medium', timeStyle: 'short'}).format(new Date(value)); }

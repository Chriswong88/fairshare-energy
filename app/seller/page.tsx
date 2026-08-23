'use client';

import Link from 'next/link';
import LocationLabel from '../location-label';

const stats = [
  {icon: 'bolt', label: 'Available surplus', value: '86', unit: 'kWh'},
  {icon: 'cash', label: 'Current selling price', value: '12.0c', unit: '/kWh'},
  {icon: 'bars', label: 'Energy sold this month', value: '64', unit: 'kWh'},
  {icon: 'wallet', label: 'Earnings this month', value: 'AUD $7.68', unit: ''},
];

const energyBreakdown = [
  {label: 'Used at home', value: '107 kWh (42%)', color: 'green'},
  {label: 'Battery', value: '59 kWh (23%)', color: 'lime'},
  {label: 'Shared locally', value: '38 kWh (15%)', color: 'blue'},
  {label: 'Standard export', value: '52 kWh (20%)', color: 'grey'},
];

const recentActivity = [
  ['24 Aug 2026, 8:42 am', 'Thomas W.', '0.8 km away', '16 kWh', '12c/kWh', 'AUD $1.92'],
  ['23 Aug 2026, 6:15 pm', 'Sarah J.', '1.2 km away', '12 kWh', '12c/kWh', 'AUD $1.44'],
  ['22 Aug 2026, 11:03 am', 'Mike R.', '0.6 km away', '10 kWh', '12c/kWh', 'AUD $1.20'],
];

export default function Seller() {
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
            <strong>Alice Chen</strong>
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
              <h1>Good morning, Alice</h1>
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
                  <span className="donut-label top">42%</span>
                  <span className="donut-label right">23%</span>
                  <span className="donut-label left">15%</span>
                  <span className="donut-label grey">20%</span>
                  <div>
                    <small>Total</small>
                    <b>256 kWh</b>
                  </div>
                </div>
                <div className="energy-legend">
                  {energyBreakdown.map((item) => (
                    <div key={item.label}>
                      <span className={item.color} />
                      <p>{item.label}</p>
                      <strong>{item.value}</strong>
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
                <span className="active-pill">Active</span>
              </div>
              <div className="offer-split">
                <div>
                  <b>60</b>
                  <span>kWh</span>
                  <p>Offered</p>
                </div>
                <div>
                  <b>38</b>
                  <span>kWh</span>
                  <p>Sold</p>
                </div>
              </div>
              <div className="community-rate">
                <span />
                <div>
                  <p>Community rate</p>
                  <strong>
                    12c<small>/kWh</small>
                  </strong>
                </div>
              </div>
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
              {recentActivity.map((row) => (
                <div className="activity-row" key={row[0]}>
                  <span className="match-icon" />
                  <span>{row[0]}</span>
                  <span>
                    <b>{row[1]}</b>
                    <small>{row[2]}</small>
                  </span>
                  <span>{row[3]}</span>
                  <span>{row[4]}</span>
                  <span>{row[5]}</span>
                  <span className="matched-pill">Matched</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

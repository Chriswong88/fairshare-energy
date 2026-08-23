'use client';

import Link from 'next/link';

const impactStats = [
  {tone: 'green', icon: 'P', value: '8', label: 'households supported'},
  {tone: 'gold', icon: 'Z', value: '132', label: 'kWh shared locally'},
  {tone: 'green', icon: 'L', value: '96', label: 'kg CO2 avoided'},
  {tone: 'blue', icon: '$', value: 'AUD $15.84', label: 'earned'},
];

const supportGroups = [
  {tone: 'green', label: 'Renters', value: '62%', width: '62%'},
  {tone: 'gold', label: 'Low-income households', value: '25%', width: '25%'},
  {tone: 'blue', label: 'Apartment residents', value: '13%', width: '13%'},
];

const impactMonths = [
  {month: 'Mar', kwh: 14, households: 1},
  {month: 'Apr', kwh: 48, households: 2},
  {month: 'May', kwh: 78, households: 3},
  {month: 'Jun', kwh: 108, households: 5},
  {month: 'Jul', kwh: 132, households: 7},
  {month: 'Aug', kwh: 150, households: 8},
];

export default function SellerImpact() {
  return (
    <main className="seller-dashboard-page impact-page">
      <SellerSidebar />

      <section className="seller-dashboard-main">
        <header className="seller-topbar">
          <div />
          <div className="seller-top-actions">
            <button className="location-button">
              <span aria-hidden="true" /> Wollongong, NSW
            </button>
            <button className="bell-button" aria-label="Notifications">
              <span>2</span>
            </button>
          </div>
        </header>

        <div className="impact-layout">
          <header className="impact-head">
            <h1>Your Community Impact</h1>
            <p>See the difference your surplus solar is making across Wollongong.</p>
          </header>

          <section className="impact-metric-grid" aria-label="Community impact overview">
            {impactStats.map((item) => (
              <article key={item.label}>
                <span className={`impact-icon ${item.tone}`}>{item.icon}</span>
                <div>
                  <strong>{item.value}</strong>
                  <p>{item.label}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="impact-map-grid">
            <article className="impact-map-card">
              <div className="wollongong-map" aria-label="Suburb-level Wollongong impact map">
                <span className="map-road road-one" />
                <span className="map-road road-two" />
                <span className="map-road road-three" />
                <span className="map-water" />
                <MapPin className="dapto" label="Dapto" />
                <MapPin className="warrawong" label="Warrawong" />
                <MapPin className="wollongong" label="WOLLONGONG" />
              </div>
              <p className="privacy-note">
                <span /> We protect recipient privacy. Locations shown are at suburb level only.
              </p>
            </article>

            <article className="support-breakdown-card">
              <h2>Who you supported</h2>
              <div className="support-breakdown-list">
                {supportGroups.map((item) => (
                  <div className="support-breakdown-row" key={item.label}>
                    <span className={`support-icon ${item.tone}`}>P</span>
                    <div>
                      <div>
                        <b>{item.label}</b>
                        <strong>{item.value}</strong>
                      </div>
                      <i>
                        <span className={item.tone} style={{width: item.width}} />
                      </i>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="impact-over-time-card">
            <h2>Impact over time</h2>
            <div className="impact-chart-wrap">
              <span className="impact-y-label left">kWh</span>
              <span className="impact-y-label right">Households</span>
              <div className="impact-chart-grid">
                {[150, 100, 50, 0].map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
              <svg className="impact-chart-lines" viewBox="0 0 720 140" aria-hidden="true">
                <polyline className="impact-kwh-line" points="20,130 156,102 292,78 428,55 564,38 700,28" />
                <polyline className="impact-house-line" points="20,136 156,120 292,111 428,90 564,64 700,40" />
                {[
                  [20, 130],
                  [156, 102],
                  [292, 78],
                  [428, 55],
                  [564, 38],
                  [700, 28],
                ].map(([x, y]) => (
                  <circle className="impact-kwh-dot" cx={x} cy={y} r="5" key={`${x}-${y}`} />
                ))}
                {[
                  [20, 136],
                  [156, 120],
                  [292, 111],
                  [428, 90],
                  [564, 64],
                  [700, 40],
                ].map(([x, y]) => (
                  <circle className="impact-house-dot" cx={x} cy={y} r="5" key={`${x}-${y}`} />
                ))}
              </svg>
              <div className="impact-chart-legend">
                <span className="green" /> kWh shared
                <span className="blue" /> Households reached
              </div>
              <div className="impact-months">
                {impactMonths.map((item) => (
                  <span key={item.month}>{item.month}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="impact-awards-grid">
            <article className="impact-award green">
              <span>M</span>
              <div>
                <h3>Local Energy Champion</h3>
                <p>You are helping build a stronger, fairer energy future.</p>
              </div>
            </article>
            <article className="impact-award gold">
              <span>Z</span>
              <div>
                <h3>100 kWh shared</h3>
                <p>You have shared enough to power 5 days of average home use.</p>
              </div>
            </article>
            <article className="impact-award blue">
              <span>H</span>
              <div>
                <h3>5 neighbourhoods reached</h3>
                <p>Your solar is making an impact across Wollongong.</p>
              </div>
            </article>
            <button className="share-impact-button" type="button">
              <span aria-hidden="true" />
              <b>Share my impact</b>
              <small>Let others see the difference you are making.</small>
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}

function MapPin({className, label}: {className: string; label: string}) {
  return (
    <div className={`map-pin ${className}`}>
      <span>H</span>
      <b>{label}</b>
    </div>
  );
}

function SellerSidebar() {
  return (
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
        <Link href="/seller">
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
        <Link className="active" href="/seller/fairshare">
          <span>I</span> Impact
        </Link>
      </nav>

      <Link className="seller-role-switch" href="/renter">
        Switch to buyer
      </Link>
    </aside>
  );
}

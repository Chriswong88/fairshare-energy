'use client';

import Link from 'next/link';
import UserName from '../../user-identity';
import LocationLabel from '../../location-label';
import DownloadStatementButton from './download-statement-button';

const earningsStats = [
  {tone: 'green', icon: 'Z', label: 'Energy matched', value: '64', unit: 'kWh'},
  {tone: 'green', icon: 'P', label: 'Community earnings', value: 'AUD $7.68', unit: ''},
  {tone: 'blue', icon: 'B', label: 'Standard feed-in value', value: 'AUD $3.84', unit: ''},
  {tone: 'gold', icon: 'S', label: 'Extra earned', value: '+AUD $3.84', unit: ''},
];

const chartMonths = [
  {month: 'Mar', community: 3.1, feedIn: 1.6},
  {month: 'Apr', community: 4.1, feedIn: 2.0},
  {month: 'May', community: 7.1, feedIn: 2.8},
  {month: 'Jun', community: 9.0, feedIn: 3.2},
  {month: 'Jul', community: 11.1, feedIn: 3.9},
  {month: 'Aug', community: 8.0, feedIn: 3.4},
];

const recentMatches = [
  ['Warrawong renter', '28 Aug 2026', '22.1 kWh', 'AUD $0.12/kWh', 'AUD $2.65', 'AUD $1.33'],
  ['Dapto apartment household', '25 Aug 2026', '18.4 kWh', 'AUD $0.12/kWh', 'AUD $2.21', 'AUD $1.10'],
  ['Wollongong student household', '22 Aug 2026', '23.5 kWh', 'AUD $0.12/kWh', 'AUD $2.82', 'AUD $1.41'],
];

export default function SellerWallet() {
  return (
    <main className="seller-dashboard-page earnings-page">
      <style>{`
        .earnings-content-grid{display:grid!important;grid-template-columns:minmax(0,1fr) 300px!important;gap:20px;align-items:start}
        .earnings-content-grid,.earnings-main-column,.earnings-chart-card,.earnings-chart{min-width:0}
        .earnings-main-column{display:contents}
        .earnings-chart-card{width:100%;overflow:hidden}
        .earnings-chart-card{grid-column:1;grid-row:1}
        .bill-credit-card{grid-column:2;grid-row:1}
        .recent-matches-card{grid-column:1/-1;grid-row:2;width:100%;min-width:0}
        .earnings-footnote{grid-column:1/-1;grid-row:3}
        .earnings-chart-title{min-width:0}
        .earnings-chart-title>div{min-width:0;flex-wrap:wrap;justify-content:flex-end;row-gap:10px}
        .earnings-chart{width:100%;overflow:hidden}
        .chart-lines{display:block;max-width:100%}
        .bill-credit-card{min-width:0;width:100%;position:static}
        .earnings-metric-grid article,.earnings-metric-grid article>div{min-width:0}
        .earnings-metric-grid strong{display:block;font-size:clamp(21px,2vw,28px);white-space:nowrap}
        .download-statement-button,.bill-credits-button{display:flex;align-items:center;justify-content:center;text-decoration:none;box-sizing:border-box;cursor:pointer}
        .download-statement-button:disabled{cursor:wait;opacity:.72}.statement-download-error{display:block;color:#a43a2b;font-size:12px;line-height:1.35;margin:-4px 0 12px}
        @media(max-width:1080px){
          .earnings-content-grid{grid-template-columns:1fr!important}
          .earnings-chart-card{grid-column:1;grid-row:1}
          .bill-credit-card{grid-column:1;grid-row:2;max-width:none}
          .recent-matches-card{grid-column:1;grid-row:3}
          .earnings-footnote{grid-column:1;grid-row:4}
        }
        @media(max-width:760px){
          .earnings-chart-title>div{justify-content:flex-start}
          .earnings-chart{height:220px;padding-left:30px}
          .chart-lines,.chart-bars{left:40px;right:8px;width:calc(100% - 48px)}
          .chart-months{left:40px;right:8px}
        }
        @media(max-width:520px){
          .earnings-chart-card{overflow-x:auto}
          .earnings-chart{min-width:500px}
        }
      `}</style>
      <SellerSidebar />

      <section className="seller-dashboard-main">
        <header className="seller-topbar">
          <div />
          <div className="seller-top-actions">
            <button className="location-button">
              <span aria-hidden="true" /> <LocationLabel />
            </button>
            <button className="bell-button" aria-label="Notifications">
              <span>1</span>
            </button>
          </div>
        </header>

        <div className="earnings-layout">
          <header className="earnings-head">
            <h1>Earnings</h1>
            <p>See how your solar is powering your community and your earnings.</p>
          </header>

          <section className="earnings-metric-grid" aria-label="Earnings overview">
            {earningsStats.map((item) => (
              <article key={item.label}>
                <span className={`earnings-icon ${item.tone}`}>{item.icon}</span>
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

          <div className="earnings-content-grid">
            <section className="earnings-main-column">
              <article className="earnings-chart-card">
                <div className="earnings-chart-title">
                  <h2>Earnings history</h2>
                  <div>
                    <span className="legend community" /> Community earnings
                    <span className="legend feed" /> Standard feed-in value
                  </div>
                </div>
                <div className="earnings-chart">
                  <div className="chart-axis-label">Earnings (AUD)</div>
                  <div className="chart-grid">
                    {[12, 10, 8, 6, 4, 2, 0].map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </div>
                  <svg className="chart-lines" viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true">
                    <polyline
                      className="community-line"
                      points="34,133.5 141,118.5 248,73.5 355,45 462,13.5 569,60"
                    />
                    <polyline
                      className="feed-line"
                      points="34,156 141,150 248,138 355,132 462,121.5 569,129"
                    />
                    {[
                      [34, 133.5],
                      [141, 118.5],
                      [248, 73.5],
                      [355, 45],
                      [462, 13.5],
                      [569, 60],
                    ].map(([x, y]) => (
                      <circle className="community-dot" cx={x} cy={y} r="5" key={`${x}-${y}`} />
                    ))}
                    {[
                      [34, 156],
                      [141, 150],
                      [248, 138],
                      [355, 132],
                      [462, 121.5],
                      [569, 129],
                    ].map(([x, y]) => (
                      <circle className="feed-dot" cx={x} cy={y} r="5" key={`${x}-${y}`} />
                    ))}
                  </svg>
                  <div className="chart-bars">
                    {chartMonths.map((item) => (
                      <div key={item.month}>
                        <span
                          className="bar community"
                          style={{height: `${item.community * 15}px`}}
                        />
                        <span className="bar feed" style={{height: `${item.feedIn * 15}px`}} />
                      </div>
                    ))}
                  </div>
                  <div className="chart-months">
                    {chartMonths.map((item) => (
                      <span key={item.month}>{item.month}</span>
                    ))}
                  </div>
                </div>
              </article>

              <article className="recent-matches-card">
                <h2>Recent matches</h2>
                <div className="matches-table">
                  <div className="matches-heading">
                    <span />
                    <span />
                    <span>Date</span>
                    <span>Energy matched</span>
                    <span>Community rate</span>
                    <span>Earnings</span>
                    <span>Retailer credit</span>
                    <span>Status</span>
                  </div>
                  {recentMatches.map((row, index) => (
                    <div className="matches-row" key={row[0]}>
                      <span className={`match-avatar tone-${index + 1}`} />
                      <strong>{row[0]}</strong>
                      <span>{row[1]}</span>
                      <span>{row[2]}</span>
                      <span className="community-rate-text">{row[3]}</span>
                      <span className="earnings-text">{row[4]}</span>
                      <span>{row[5]}</span>
                      <span className="confirmed-pill">Confirmed</span>
                    </div>
                  ))}
                </div>
                <Link className="view-matches-link" href="/seller/marketplace/match">
                  View all matches <span>{'>'}</span>
                </Link>
              </article>

              <p className="earnings-footnote">
                All amounts are estimates. Final bill credits are confirmed by your retailer.
              </p>
            </section>

            <aside className="bill-credit-card">
              <h2>Next bill credit</h2>
              <div className="bill-credit-total">
                <span />
                <strong>AUD $7.68</strong>
              </div>
              <dl>
                <div>
                  <dt>Retailer statement date</dt>
                  <dd>4 September 2026</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd><span className="processing-pill">Processing</span></dd>
                </div>
              </dl>
              <DownloadStatementButton className="download-statement-button" />
              <Link className="bill-credits-button" href="/seller/wallet/bill-credits">
                View bill credits
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </main>
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
          <strong><UserName fallback="Alice Chen" /></strong>
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
        <Link className="active" href="/seller/wallet">
          <span>E</span> Earnings
        </Link>
        <Link href="/seller/fairshare">
          <span>I</span> Impact
        </Link>
      </nav>

      <Link className="seller-role-switch" href="/renter">
        Switch to buyer
      </Link>
    </aside>
  );
}

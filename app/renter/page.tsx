'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import LocationLabel from '../location-label';
import '../buyer-dashboard.css';

const buyerStats = [
  {tone: 'green', icon: 'W', label: 'Saved this month', value: 'AUD $12.80', note: 'vs. standard rate'},
  {tone: 'gold', icon: 'S', label: 'Local energy received', value: '96 kWh', note: 'this month'},
  {tone: 'green', icon: 'P', label: 'Community rate', value: '27c/kWh', note: 'incl. GST'},
  {tone: 'blue', icon: 'G', label: 'Standard rate', value: '35c/kWh', note: 'incl. GST'},
];

const recentActivity = [
  ['Matched energy credit', 'Warrawong Solar Circle', 'Today', '+8.6 kWh'],
  ['Matched energy credit', 'Warrawong Solar Circle', '18 May 2026', '+7.2 kWh'],
  ['Matched energy credit', 'Warrawong Solar Circle', '11 May 2026', '+6.4 kWh'],
  ['Matched energy credit', 'Warrawong Solar Circle', '4 May 2026', '+7.8 kWh'],
  ['Matched energy credit', 'Warrawong Solar Circle', '27 Apr 2026', '+6.1 kWh'],
];

const usageDays = [
  58, 60, 66, 62, 71, 82, 78, 58, 64, 68, 72, 80, 92, 100, 79, 76,
  91, 79, 68, 72, 66, 49, 62, 48, 57, 68, 73, 59, 58, 48, 59,
];

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
            <h1>Good morning, Bob</h1>
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
                    <strong>64%</strong>
                    <span>of your usage locally matched</span>
                  </div>
                  <p>Your usage is matched with local solar generation through your retailer, not delivered by a private cable.</p>
                  <Link href="/renter/fairshare">How energy matching works <span>i</span></Link>
                </article>

                <article className="active-energy-card">
                  <h2>Active energy offer</h2>
                  <div className="offer-title-row">
                    <span>S</span>
                    <strong>Warrawong Solar Circle</strong>
                  </div>
                  <dl>
                    <div>
                      <dt>Monthly limit</dt>
                      <dd>120 kWh</dd>
                    </div>
                    <div>
                      <dt>Matched this month</dt>
                      <dd>96 kWh</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd><span>Active</span></dd>
                    </div>
                  </dl>
                  <Link href="/renter/marketplace">View plan <span>{'>'}</span></Link>
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
                    <p>You have saved <strong>AUD $12.80</strong> this month</p>
                    <small>vs. standard rate</small>
                  </div>
                  <div>
                    <span className="solar-icon">S</span>
                    <p><strong>96 kWh</strong> matched with local solar</p>
                    <small>64% of your total usage</small>
                  </div>
                </div>
              </article>
            </div>

            <aside className="buyer-right-column">
              <article className="recent-activity-card">
                <h2>Recent activity</h2>
                <div className="buyer-activity-list">
                  {recentActivity.map((item) => (
                    <div key={`${item[0]}-${item[2]}`}>
                      <span>S</span>
                      <div>
                        <strong>{item[0]}</strong>
                        <small>{item[1]}</small>
                        <small>{item[2]}</small>
                      </div>
                      <b>{item[3]}</b>
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
        </div>
      </section>
    </main>
  );
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
        <Link href="/renter/fairshare">
          <span>I</span> Impact
        </Link>
      </nav>

      <Link className="buyer-role-switch" href="/seller">
        Switch to seller
      </Link>
    </aside>
  );
}

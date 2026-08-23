'use client';

import Link from 'next/link';
import LocationLabel from '../../location-label';
import '../../buyer-dashboard.css';
import '../../buyer-energy.css';

const purchases = [
  ['Nguyen Household', 'Figtree', '42 kWh', '27c/kWh'],
  ['Alice Chen', 'Warrawong', '28 kWh', '28c/kWh'],
  ['Priya K.', 'Dapto', '26 kWh', '29c/kWh'],
];

export default function BuyerEnergyPage() {
  return (
    <main className="buyer-dashboard-page buyer-energy-page">
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

        <div className="buyer-energy-content">
          <header className="buyer-energy-head">
            <h1>My Energy</h1>
            <p>Track the local solar you bought and how it was matched to your usage.</p>
          </header>

          <section className="energy-top-stats" aria-label="Energy totals">
            <article>
              <span className="energy-home-icon" />
              <div>
                <p>Local energy bought</p>
                <strong>96 kWh</strong>
              </div>
            </article>
            <article>
              <span className="energy-grid-icon">G</span>
              <div>
                <p>Standard grid energy</p>
                <strong className="blue">54 kWh</strong>
              </div>
            </article>
            <article>
              <span className="energy-people-icon">P</span>
              <div>
                <p>Local energy coverage</p>
                <strong>64%</strong>
              </div>
            </article>
          </section>

          <section className="energy-main-grid">
            <article className="energy-month-card">
              <div className="energy-card-title">
                <h2>Your energy this month</h2>
                <button type="button">August 2026 <span>v</span></button>
              </div>

              <div className="coverage-bar" aria-label="64 percent local solar and 36 percent standard grid">
                <span>64%</span>
                <span>36%</span>
              </div>

              <div className="coverage-legend">
                <span><i className="local" /> Local solar bought <b>96 kWh</b></span>
                <span><i className="grid" /> Standard grid <b>54 kWh</b></span>
              </div>

              <div className="usage-total-row">
                <div>
                  <p>Total household usage</p>
                  <strong>150 kWh</strong>
                </div>
                <div>
                  <p>Local energy bought</p>
                  <strong className="green">96 kWh</strong>
                </div>
                <div>
                  <p>Grid energy</p>
                  <strong className="blue">54 kWh</strong>
                </div>
              </div>

              <div className="energy-info-note">
                <span>i</span>
                <p>Your electricity still flows through the grid. Your retailer financially matches verified local solar purchases to your usage.</p>
              </div>
            </article>

            <aside className="purchase-summary-card">
              <h2>Purchase summary</h2>
              <dl>
                <div>
                  <dt><span>P</span> Individual solar sellers</dt>
                  <dd>3 households</dd>
                </div>
                <div>
                  <dt><span>T</span> Average local price</dt>
                  <dd className="green">27.8c/kWh</dd>
                </div>
                <div>
                  <dt><span>$</span> Standard rate</dt>
                  <dd>35c/kWh</dd>
                </div>
                <div>
                  <dt><span>S</span> Estimated saving</dt>
                  <dd className="green">AUD $6.88</dd>
                </div>
              </dl>
              <Link href="/renter/marketplace">Buy more local energy</Link>
            </aside>
          </section>

          <section className="individual-purchases-card">
            <h2>Your individual purchases</h2>
            <div className="purchase-table">
              <div className="purchase-heading">
                <span />
                <span>Seller</span>
                <span>Suburb</span>
                <span>Energy bought</span>
                <span>Price paid</span>
                <span>Status</span>
              </div>
              {purchases.map(([seller, suburb, energy, price]) => (
                <div className="purchase-row" key={seller}>
                  <span className="purchase-solar-icon" />
                  <strong>{seller}</strong>
                  <span>{suburb}</span>
                  <b>{energy}</b>
                  <b>{price}</b>
                  <em>Matched</em>
                </div>
              ))}
              <div className="purchase-total-row">
                <strong>Total local energy bought</strong>
                <b>96 kWh</b>
              </div>
            </div>
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
        <Link href="/renter">
          <span>H</span> Dashboard
        </Link>
        <Link href="/renter/marketplace">
          <span>M</span> Marketplace
        </Link>
        <Link className="active" href="/renter/fairshare">
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

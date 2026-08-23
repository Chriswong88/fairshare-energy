'use client';

import Link from 'next/link';
import {useState} from 'react';
import LocationLabel from '../../../location-label';

const supportOptions = [
  {
    id: 'renters',
    title: 'Prioritise renters',
    text: 'Help households who rent their home.',
    icon: 'H',
  },
  {
    id: 'low-income',
    title: 'Prioritise low-income households',
    text: 'Support households experiencing hardship.',
    icon: 'G',
  },
  {
    id: 'none',
    title: 'No preference',
    text: 'Support any participating household in the community.',
    icon: 'N',
  },
];

export default function NewListing() {
  const [amount, setAmount] = useState(60);
  const [support, setSupport] = useState('renters');
  const [donate, setDonate] = useState(true);
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const periodLabel = formatListingPeriod(startDate, endDate);
  const periodDays = getInclusiveDays(startDate, endDate);
  const sliderProgress = (amount / 86) * 100;

  const updateStartDate = (value: string) => {
    setStartDate(value);
    if (endDate < value) {
      setEndDate(value);
    }
  };

  const publish = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          quantityKwh: amount, pricePerKwhCents: 12, listingType: 'sale',
          availableFrom: startDate, availableUntil: endDate,
          supportPreference: support, donationPercentage: donate ? 10 : 0,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {error?: string} | null;
        setError(data?.error ?? 'Could not publish the listing. Please try again.');
        return;
      }
      setPublished(true);
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (published) {
    return (
      <SellerListingShell>
        <section className="listing-success-panel">
          <span />
          <p className="kicker">LISTING PUBLISHED</p>
          <h1>Your energy listing is live</h1>
          <p>{amount} kWh is now available to Wollongong households at 12.0c/kWh.</p>
          <Link href="/seller/marketplace">View your listing</Link>
        </section>
      </SellerListingShell>
    );
  }

  return (
    <SellerListingShell>
      <div className="create-listing-layout">
        <section className="create-listing-main">
          <header className="create-listing-head">
            <h1>Create an energy listing</h1>
            <p>Share your verified surplus with local households.</p>
          </header>

          <section className="energy-control">
            <h2>Energy amount</h2>
            <p>
              Available surplus: <strong>86 kWh</strong>
            </p>
            <div className="range-wrap">
              <output style={{left: `${sliderProgress}%`}}>{amount} kWh</output>
              <input
                type="range"
                min="0"
                max="86"
                value={amount}
                style={{background: `linear-gradient(90deg,#17803a 0 ${sliderProgress}%,#d7dde6 ${sliderProgress}% 100%)`}}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </div>
            <div className="range-labels">
              <span>0 kWh</span>
              <span>86 kWh</span>
            </div>
            <small>Choose how much of your surplus you want to share.</small>
          </section>

          <section className="price-control">
            <h2>
              Community selling price <span>i</span>
            </h2>
            <div>
              <span className="lock-icon" />
              <strong>12.0c</strong>
              <p>per kWh</p>
              <small>Set by participating retailer</small>
            </div>
            <small>This price is verified and cannot be changed.</small>
          </section>

          <section className="period-control">
            <h2>Listing period</h2>
            <div>
              <label>
                <span>Start date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => updateStartDate(event.target.value)}
                />
              </label>
              <label>
                <span>End date</span>
                <input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>
            <small>Choose when this listing is available to Wollongong households.</small>
          </section>

          <section className="support-control">
            <h2>
              Who would you like to support? <span>i</span>
            </h2>
            <div className="support-card-grid">
              {supportOptions.map((option) => (
                <button
                  className={support === option.id ? 'selected' : ''}
                  key={option.id}
                  type="button"
                  onClick={() => setSupport(option.id)}
                >
                  <span>{option.icon}</span>
                  <b>{option.title}</b>
                  <p>{option.text}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="donation-row">
            <div>
              <h2>
                Donate 10% to Energy Equity Fund <span>i</span>
              </h2>
              <p>Your donation helps expand access to affordable energy.</p>
            </div>
            <button
              className={donate ? 'toggle active' : 'toggle'}
              type="button"
              aria-pressed={donate}
              onClick={() => setDonate((current) => !current)}
            >
              <span />
            </button>
          </section>
        </section>

        <aside className="offer-summary-card">
          <h2>Listing summary</h2>
          <SummaryItem
            tone="green"
            icon="$"
            title="Expected earnings"
            value={`AUD $${((amount * 12) / 100).toFixed(2)}`}
            note={`Based on ${amount} kWh at 12.0c/kWh`}
          />
          <SummaryItem
            tone="blue"
            icon="G"
            title="Estimated households supported"
            value={String(Math.max(1, Math.round(amount / 12)))}
            note="Based on typical household usage."
          />
          <SummaryItem
            tone="gold"
            icon="D"
            title="Listing period"
            value={periodLabel}
            note={`${periodDays} ${periodDays === 1 ? 'day' : 'days'}`}
          />
          {error && <p className="listing-form-error">{error}</p>}
          <button className="publish-listing-button" type="button" onClick={publish} disabled={saving}>
            <span /> Publish listing
          </button>
          <div className="credit-note">
            <span />
            <p>Final credits are applied by your participating retailer.</p>
          </div>
        </aside>
      </div>
    </SellerListingShell>
  );
}

function formatListingPeriod(start: string, end: string) {
  const startParts = getDateParts(start);
  const endParts = getDateParts(end);

  if (!startParts || !endParts) {
    return 'Select dates';
  }

  const startMonth = monthName(startParts.month);
  const endMonth = monthName(endParts.month);

  if (startParts.year === endParts.year && startParts.month === endParts.month) {
    return `${startParts.day}-${endParts.day} ${startMonth}`;
  }

  if (startParts.year === endParts.year) {
    return `${startParts.day} ${startMonth} - ${endParts.day} ${endMonth}`;
  }

  return `${startParts.day} ${startMonth} ${startParts.year} - ${endParts.day} ${endMonth} ${endParts.year}`;
}

function getInclusiveDays(start: string, end: string) {
  const startParts = getDateParts(start);
  const endParts = getDateParts(end);

  if (!startParts || !endParts) {
    return 0;
  }

  const startTime = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
  const endTime = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
  const diff = Math.floor((endTime - startTime) / 86400000) + 1;

  return Math.max(diff, 1);
}

function getDateParts(value: string) {
  const parts = value.split('-').map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }

  return {year: parts[0], month: parts[1], day: parts[2]};
}

function monthName(month: number) {
  return new Intl.DateTimeFormat('en-AU', {month: 'long'}).format(
    new Date(Date.UTC(2026, month - 1, 1)),
  );
}

function SellerListingShell({children}: {children: React.ReactNode}) {
  return (
    <main className="seller-dashboard-page create-listing-page">
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
          <Link className="active" href="/seller/marketplace/new">
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
      </aside>

      <section className="seller-dashboard-main">
        <header className="seller-topbar">
          <div />
          <div className="seller-top-actions">
            <button className="location-button">
              <span aria-hidden="true" /> <LocationLabel />
            </button>
            <button className="bell-button" aria-label="Notifications">
              <span>2</span>
            </button>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

function SummaryItem({
  tone,
  icon,
  title,
  value,
  note,
}: {
  tone: string;
  icon: string;
  title: string;
  value: string;
  note: string;
}) {
  return (
    <article className={`summary-item ${tone}`}>
      <span>{icon}</span>
      <div>
        <h3>{title} <small>i</small></h3>
        <b>{value}</b>
        <p>{note}</p>
      </div>
    </article>
  );
}

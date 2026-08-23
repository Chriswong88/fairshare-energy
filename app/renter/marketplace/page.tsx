'use client';

import Link from 'next/link';
import {useMemo, useState} from 'react';
import LocationLabel from '../../location-label';
import '../../buyer-dashboard.css';
import '../../buyer-marketplace.css';

type Offer = {
  id: string;
  name: string;
  suburb: string;
  availableKwh: number;
  distanceKm: number;
  households: number;
  offerRate: number;
  standardRate: number;
  monthlySaving: number;
  mapClass: string;
};

const offers: Offer[] = [
  {
    id: 'warrawong',
    name: 'Emily Carter',
    suburb: 'Warrawong',
    availableKwh: 42,
    distanceKm: 0.8,
    households: 1,
    offerRate: 27,
    standardRate: 35,
    monthlySaving: 33,
    mapClass: 'warrawong',
  },
  {
    id: 'dapto',
    name: 'Jack Thompson',
    suburb: 'Dapto',
    availableKwh: 68,
    distanceKm: 3.2,
    households: 1,
    offerRate: 28,
    standardRate: 35,
    monthlySaving: 29,
    mapClass: 'dapto',
  },
  {
    id: 'wollongong',
    name: 'Sophie Nguyen',
    suburb: 'Wollongong',
    availableKwh: 120,
    distanceKm: 1.5,
    households: 1,
    offerRate: 29,
    standardRate: 35,
    monthlySaving: 25,
    mapClass: 'wollongong',
  },
];

export default function RenterMarketplace() {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [search, setSearch] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState(100);
  const [agreed, setAgreed] = useState(false);

  const visibleOffers = useMemo(
    () =>
      offers.filter((offer) =>
        `${offer.name} ${offer.suburb}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  if (selectedOffer) {
    return (
      <BuyerMarketplaceShell>
        <OfferDetail
          agreed={agreed}
          monthlyLimit={monthlyLimit}
          offer={selectedOffer}
          onAgree={() => setAgreed((current) => !current)}
          onBack={() => setSelectedOffer(null)}
          onLimitChange={setMonthlyLimit}
        />
      </BuyerMarketplaceShell>
    );
  }

  return (
    <BuyerMarketplaceShell>
      <section className="buyer-marketplace-layout">
        <div className="marketplace-list-pane">
          <header className="marketplace-head">
            <h1>Local Energy Marketplace</h1>
            <p>Choose affordable surplus solar from households in your community.</p>
          </header>

          <label className="marketplace-search">
            <span aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search suburb or postcode"
            />
          </label>

          <div className="marketplace-filter-row">
            <button className="active" type="button">Best value</button>
            <button type="button">Closest</button>
            <button type="button">Most available</button>
            <button type="button">Equity priority</button>
            <div>
              <button className="active" type="button">List</button>
              <button type="button">Map</button>
            </div>
          </div>

          <div className="local-offer-stack">
            {visibleOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onSelect={() => setSelectedOffer(offer)} />
            ))}
            {!visibleOffers.length && (
              <section className="empty-marketplace-panel">
                <b>No local listings found</b>
                <p>Try searching another Wollongong suburb or clearing the search field.</p>
              </section>
            )}
          </div>

          <p className="verified-prices-note">
            <span /> Prices and credits are verified by the participating retailer.
          </p>
        </div>

        <aside className="marketplace-map-pane">
          <WollongongOfferMap offers={offers} onSelect={setSelectedOffer} />
        </aside>
      </section>
    </BuyerMarketplaceShell>
  );
}

function OfferCard({offer, onSelect}: {offer: Offer; onSelect: () => void}) {
  return (
    <article className="local-offer-card">
      <span className="offer-house-icon" />
      <div className="offer-card-main">
        <h2>{offer.name}</h2>
        <div className="offer-meta-row">
          <span>{offer.availableKwh} kWh available</span>
          <span>{offer.distanceKm} km away</span>
          <span>Local solar from {offer.households} household</span>
        </div>
        <div className="offer-price-row">
          <div>
            <strong>{offer.offerRate}c</strong><small>/kWh</small>
            <p>Offer price</p>
          </div>
          <span>vs</span>
          <div>
            <strong>{offer.standardRate}c</strong><small>/kWh</small>
            <p>Standard rate</p>
          </div>
        </div>
      </div>
      <aside className="offer-saving-panel">
        <p>Estimated saving</p>
        <strong>{offer.standardRate - offer.offerRate}c<small>/kWh</small></strong>
        <span>about AUD ${offer.monthlySaving} / month</span>
        <button type="button" onClick={onSelect}>View details</button>
      </aside>
    </article>
  );
}

function WollongongOfferMap({
  offers: mapOffers,
  onSelect,
}: {
  offers: Offer[];
  onSelect: (offer: Offer) => void;
}) {
  return (
    <div className="marketplace-map">
      <span className="map-sea" />
      <span className="map-road main" />
      <span className="map-road cross" />
      <span className="map-road lower" />
      <b className="map-label wollongong">Wollongong</b>
      <b className="map-label north">North Wollongong</b>
      <b className="map-label cbd">Wollongong CBD</b>
      <b className="map-label warrawong">Warrawong</b>
      <b className="map-label dapto">Dapto</b>
      {mapOffers.map((offer) => (
        <button
          className={`map-offer-pin ${offer.mapClass}`}
          key={offer.id}
          type="button"
          onClick={() => onSelect(offer)}
          aria-label={`View ${offer.name}`}
        >
          H
        </button>
      ))}
    </div>
  );
}

function OfferDetail({
  agreed,
  monthlyLimit,
  offer,
  onAgree,
  onBack,
  onLimitChange,
}: {
  agreed: boolean;
  monthlyLimit: number;
  offer: Offer;
  onAgree: () => void;
  onBack: () => void;
  onLimitChange: (value: number) => void;
}) {
  const sliderProgress = ((monthlyLimit - 0) / 500) * 100;
  const matchedEnergy = Math.round(monthlyLimit * 0.8);
  const monthlySaving = ((matchedEnergy * (offer.standardRate - offer.offerRate)) / 100).toFixed(2);
  const annualSaving = (Number(monthlySaving) * 12).toFixed(2);

  return (
    <section className="offer-detail-layout">
      <div className="offer-detail-main">
        <nav className="offer-breadcrumb">
          <button type="button" onClick={onBack}>Marketplace</button>
          <span>/</span>
          <b>{offer.name}</b>
        </nav>

        <h1>Buy energy from {offer.name}</h1>

        <article className="offer-detail-summary">
          <div>
            <span className="detail-icon green">T</span>
            <p>Community rate</p>
            <strong>{offer.offerRate}c<small>/kWh</small></strong>
          </div>
          <div>
            <span className="detail-icon grey">T</span>
            <p>Standard rate</p>
            <strong>{offer.standardRate}c<small>/kWh</small></strong>
          </div>
          <div>
            <span className="detail-icon gold">S</span>
            <strong>{offer.availableKwh} kWh</strong>
            <p>currently available</p>
          </div>
          <div>
            <span className="detail-icon green">L</span>
            <strong>{offer.distanceKm} km away</strong>
          </div>
          <div>
            <span className="detail-icon green">P</span>
            <strong>{offer.households}</strong>
            <p>local solar household</p>
          </div>
        </article>

        <article className="limit-card">
          <div className="limit-title-row">
            <h2>Choose how much energy to buy</h2>
            <output>{monthlyLimit} kWh</output>
          </div>
          <div className="limit-slider-row">
            <button type="button" onClick={() => onLimitChange(Math.max(0, monthlyLimit - 10))}>
              -
            </button>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={monthlyLimit}
              style={{background: `linear-gradient(90deg,#17803a 0 ${sliderProgress}%,#d7dde6 ${sliderProgress}% 100%)`}}
              onChange={(event) => onLimitChange(Number(event.target.value))}
            />
            <button type="button" onClick={() => onLimitChange(Math.min(500, monthlyLimit + 10))}>
              +
            </button>
          </div>
          <div className="limit-labels">
            <span>0 kWh</span>
            <span>{monthlyLimit} kWh</span>
            <span>500 kWh</span>
          </div>
        </article>

        <article className="savings-calculator-card">
          <h2>Savings calculator</h2>
          <div>
            <CalculatorItem tone="green" icon="G" label="Estimated matched energy" value={`${matchedEnergy} kWh`} note="per month" />
            <CalculatorItem tone="gold" icon="$" label="Estimated monthly saving" value={`AUD $${monthlySaving}`} />
            <CalculatorItem tone="blue" icon="D" label="Estimated annual saving" value={`AUD $${annualSaving}`} />
          </div>
        </article>

        <div className="supply-note">
          <span />
          <div>
            <strong>Your electricity supply remains uninterrupted when local solar is unavailable.</strong>
            <p>Your retailer continues to supply your electricity as usual.</p>
          </div>
        </div>
      </div>

      <aside className="offer-detail-side">
        <article className="matching-card">
          <h2>How matching works</h2>
          <MatchingStep number="1" title="Choose a limit" text="Pick how much local solar you would like matched each month." />
          <MatchingStep number="2" title="We match verified local exports" text="We match your usage with excess solar from a nearby household." />
          <MatchingStep number="3" title="Retailer applies your bill credit" text="Your retailer applies the community rate to your matched energy." />
        </article>

        <article className="eligibility-card">
          <h2>You are eligible to join</h2>
          <div>
            <span>Address verified</span>
            <span>Smart meter connected</span>
            <span>Renter priority applied</span>
          </div>
        </article>

        <article className="join-offer-card">
          <label>
            <input type="checkbox" checked={agreed} onChange={onAgree} />
            I agree to the <a href="#">community energy terms</a>
          </label>
          <button type="button" disabled={!agreed}>
            <span /> Change purchase
          </button>
          <button type="button" onClick={onBack}>Back to marketplace</button>
        </article>
      </aside>
    </section>
  );
}

function CalculatorItem({
  tone,
  icon,
  label,
  value,
  note,
}: {
  tone: string;
  icon: string;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <article>
      <span className={tone}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </div>
    </article>
  );
}

function MatchingStep({number, title, text}: {number: string; title: string; text: string}) {
  return (
    <div className="matching-step">
      <span>{number}</span>
      <i />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function BuyerMarketplaceShell({children}: {children: React.ReactNode}) {
  return (
    <main className="buyer-dashboard-page buyer-marketplace-page">
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
        {children}
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
        <Link className="active" href="/renter/marketplace">
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

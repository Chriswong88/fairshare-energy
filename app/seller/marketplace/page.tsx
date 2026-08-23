'use client';

import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import type {SellerListing} from '@/lib/supabase/database.types';
import {DEFAULT_LISTINGS, loadListings, saveListings, type Listing} from './listing-store';

type ListingCard = {
  id: number | string;
  title: string;
  status: 'Active' | 'Completed';
  offered: number;
  sold: number;
  remaining: number | string;
  price: string;
  earned: string;
  progress: number;
  icon: 'sun' | 'cloud' | 'check';
  source?: 'database' | 'local';
  sourceId?: number | string;
};

const completedListings: ListingCard[] = [
  {
    id: 'july-community',
    title: 'July Community Listing',
    status: 'Completed',
    offered: 80,
    sold: 80,
    remaining: '-',
    price: '12.0c/kWh',
    earned: 'AUD $9.60',
    progress: 100,
    icon: 'check',
  },
];

export default function SellerMarketplace() {
  const [listings, setListings] = useState(DEFAULT_LISTINGS);
  const [databaseListings, setDatabaseListings] = useState<SellerListing[] | null>(null);
  const [confirmId, setConfirmId] = useState<number | string | null>(null);
  const [notice, setNotice] = useState('');
  const [currentTab, setCurrentTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    let cancelled = false;

    setListings(loadListings());

    fetch('/api/listings')
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {listings?: SellerListing[]};
        if (!cancelled) {
          setDatabaseListings(data.listings ?? []);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const allCards = useMemo(
    () => (databaseListings ? buildDatabaseCards(databaseListings) : buildActiveCards(listings)),
    [databaseListings, listings],
  );
  const activeCards = useMemo(
    () => allCards.filter((card) => card.status === 'Active'),
    [allCards],
  );
  const completedCards = useMemo(
    () =>
      databaseListings
        ? allCards.filter((card) => card.status === 'Completed')
        : completedListings,
    [allCards, databaseListings],
  );
  const visibleCards = currentTab === 'active' ? activeCards : completedCards;
  const performanceCards = useMemo(
    () => (databaseListings ? allCards : [...activeCards, ...completedListings]),
    [activeCards, allCards, databaseListings],
  );
  const performance = useMemo(() => {
    const offered = performanceCards.reduce((total, item) => total + item.offered, 0);
    const sold = performanceCards.reduce((total, item) => total + item.sold, 0);
    const matchRate = offered > 0 ? Math.round((sold / offered) * 100) : 0;

    return {offered, sold, matchRate};
  }, [performanceCards]);

  const confirmCancel = async () => {
    const item = activeCards.find((card) => card.sourceId === confirmId);

    if (databaseListings) {
      const response = await fetch(`/api/listings?id=${confirmId}`, {method: 'DELETE'});

      if (!response.ok) {
        setNotice('Could not cancel this listing. Please try again.');
        setConfirmId(null);
        return;
      }

      setDatabaseListings((current) =>
        current ? current.filter((listing) => listing.id !== confirmId) : current,
      );
      setConfirmId(null);
      setNotice(`${item?.title || 'Listing'} was cancelled and removed from My Listings.`);
      return;
    }

    const localId = Number(confirmId);
    const localItem = listings.find((listing) => listing.id === localId);
    const next = listings.filter((listing) => listing.id !== localId);

    setListings(next);
    saveListings(next);
    setConfirmId(null);
    setNotice(`${localItem?.title || 'Listing'} was cancelled and removed from My Listings.`);
  };

  return (
    <SellerListingsShell>
      <div className="my-listings-layout">
        <section className="my-listings-main">
          <header className="my-listings-head">
            <h1>My Listings</h1>
            <Link className="create-listing-button" href="/seller/marketplace/new">
              <span aria-hidden="true">+</span> Create new listing
            </Link>
          </header>

          <nav className="listing-tabs" aria-label="Listing status">
            <button
              className={currentTab === 'active' ? 'active' : ''}
              type="button"
              onClick={() => setCurrentTab('active')}
            >
              Active
            </button>
            <button
              className={currentTab === 'completed' ? 'active' : ''}
              type="button"
              onClick={() => setCurrentTab('completed')}
            >
              Completed
            </button>
          </nav>

          {notice && (
            <div className="listing-notice">
              <span>OK</span>
              {notice}
              <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notice">
                x
              </button>
            </div>
          )}

          <div className="listing-card-stack">
            {visibleCards.map((card) => (
              <ListingCardView
                key={card.id}
                card={card}
                onCancel={card.sourceId !== undefined ? () => setConfirmId(card.sourceId ?? null) : undefined}
              />
            ))}

            {!visibleCards.length && (
              <section className="empty-listing-panel">
                <b>No {currentTab} listings</b>
                <p>
                  {currentTab === 'active'
                    ? 'Create a listing when you have surplus solar energy to share in Wollongong.'
                    : 'Completed listings will appear here after their energy has been matched and sold.'}
                </p>
                {currentTab === 'active' && <Link href="/seller/marketplace/new">Create listing</Link>}
              </section>
            )}
          </div>
        </section>

        <aside className="listing-performance-card">
          <div className="performance-title">
            <h2>Listing performance</h2>
            <span className="performance-bars" />
          </div>

          <PerformanceStat
            tone="solar"
            icon="kW"
            label="Total offered"
            value={String(performance.offered)}
            unit="kWh"
          />
          <PerformanceStat
            tone="people"
            icon="P"
            label="Total sold"
            value={String(performance.sold)}
            unit="kWh"
          />
          <PerformanceStat
            tone="target"
            icon="%"
            label="Match rate"
            value={`${performance.matchRate}%`}
          />

          <p className="performance-note">
            The percentage of listed energy that has been matched and sold.
          </p>
        </aside>
      </div>

      {confirmId !== null && (
        <div className="modal-backdrop" onMouseDown={() => setConfirmId(null)}>
          <div className="confirm-card" onMouseDown={(event) => event.stopPropagation()}>
            <span className="warning-icon">!</span>
            <p className="kicker">CANCEL LISTING</p>
            <h2>Remove this energy listing?</h2>
            <p>
              The listing will immediately disappear from My Listings. Completed transfers
              will remain in your ledger.
            </p>
            <div>
              <button className="secondary-action" type="button" onClick={() => setConfirmId(null)}>
                Keep listing
              </button>
              <button className="danger-action" type="button" onClick={confirmCancel}>
                Yes, cancel listing
              </button>
            </div>
          </div>
        </div>
      )}
    </SellerListingsShell>
  );
}

function buildActiveCards(listings: Listing[]): ListingCard[] {
  return listings.map((listing, index) => {
    const templates = [
      {
        title: 'August Community Listing',
        offered: 60,
        sold: 38,
        remaining: 22,
        earned: 'AUD $4.56',
        progress: 63,
        icon: 'sun' as const,
      },
      {
        title: 'Weekend Solar Share',
        offered: 25,
        sold: 14,
        remaining: 11,
        earned: 'AUD $1.68',
        progress: 56,
        icon: 'cloud' as const,
      },
    ];
    const template = templates[index];
    const offered = extractKwh(listing.title) || template?.offered || 20;
    const sold = template?.sold || 0;
    const remaining = Math.max(offered - sold, 0);

    return {
      id: listing.id,
      source: 'local',
      sourceId: listing.id,
      title: template?.title || listing.title.replace('for sale', 'Listing'),
      status: 'Active',
      offered,
      sold,
      remaining,
      price: '12.0c/kWh',
      earned: template?.earned || `AUD $${((sold * 12) / 100).toFixed(2)}`,
      progress: template?.progress || 0,
      icon: template?.icon || 'sun',
    };
  });
}

function buildDatabaseCards(listings: SellerListing[]): ListingCard[] {
  return listings.map((listing, index) => {
    const offered = Number(listing.quantity_kwh);
    const sold = listing.status === 'completed' ? offered : 0;
    const price = listing.price_per_kwh_cents ?? 12;
    const remaining = listing.status === 'completed' ? '-' : Math.max(offered - sold, 0);
    const progress = offered > 0 ? Math.round((sold / offered) * 100) : 0;
    const title = `${getListingMonth(listing.available_from ?? listing.created_at)} Community Listing`;

    return {
      id: listing.id,
      source: 'database',
      sourceId: listing.id,
      title,
      status: listing.status === 'completed' ? 'Completed' : 'Active',
      offered,
      sold,
      remaining,
      price: `${price.toFixed(1)}c/kWh`,
      earned: `AUD $${((sold * price) / 100).toFixed(2)}`,
      progress,
      icon: index % 2 === 0 ? 'sun' : 'cloud',
    };
  });
}

function getListingMonth(value: string) {
  return new Intl.DateTimeFormat('en-AU', {month: 'long'}).format(new Date(value));
}

function extractKwh(text: string) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*kWh/i);
  return match ? Number(match[1]) : 0;
}

function ListingCardView({
  card,
  onCancel,
}: {
  card: ListingCard;
  onCancel?: () => void;
}) {
  const isCompleted = card.status === 'Completed';

  return (
    <article className={`listing-card ${isCompleted ? 'completed' : ''}`}>
      <div className={`listing-card-icon ${card.icon}`} />

      <div className="listing-title-block">
        <h2>{card.title}</h2>
        <span className={`status-pill ${isCompleted ? 'completed' : 'active'}`}>
          {card.status}
        </span>
      </div>

      <div className="listing-card-body">
        <div className="listing-stat-row">
          <MiniStat value={`${card.offered} kWh`} label="Offered" />
          <MiniStat value={`${card.sold} kWh`} label="Sold" />
          <MiniStat value={`${card.remaining} ${card.remaining === '-' ? '' : 'kWh'}`} label="Remaining" />
          <MiniStat value={card.price} label="Price" />
        </div>

        {!isCompleted && (
          <div className="listing-progress-row">
            <div className="listing-progress">
              <span style={{width: `${card.progress}%`}} />
            </div>
            <p>
              <strong>{card.progress}% sold</strong>
              <span>{card.remaining} kWh remaining</span>
            </p>
          </div>
        )}

        <div className="listing-earned-row">
          <div>
            <b>{card.earned}</b>
            <span>Earned</span>
          </div>
        </div>

        <div className="listing-actions">
          {isCompleted ? (
            <button className="outline-action summary" type="button">
              View summary
            </button>
          ) : (
            <>
              <button className="outline-action" type="button">
                Edit
              </button>
              <button className="outline-action" type="button">
                <span aria-hidden="true">II</span> Pause
              </button>
              <button className="outline-action danger" type="button" onClick={onCancel}>
                <span aria-hidden="true">x</span> Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function MiniStat({value, label}: {value: string; label: string}) {
  return (
    <div>
      <b>{value.trim()}</b>
      <span>{label}</span>
    </div>
  );
}

function PerformanceStat({
  tone,
  icon,
  label,
  value,
  unit,
}: {
  tone: string;
  icon: string;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <article className="performance-stat">
      <span className={`performance-icon ${tone}`}>{icon}</span>
      <div>
        <p>{label}</p>
        <b>
          {value}
          {unit && <small> {unit}</small>}
        </b>
      </div>
    </article>
  );
}

function SellerListingsShell({children}: {children: React.ReactNode}) {
  return (
    <main className="seller-dashboard-page my-listings-page">
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
          <Link className="active" href="/seller/marketplace">
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
              <span aria-hidden="true" /> Wollongong, NSW
            </button>
            <button className="bell-button" aria-label="Notifications">
              <span>3</span>
            </button>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

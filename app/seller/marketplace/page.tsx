'use client';

import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import type {SellerListing} from '@/lib/supabase/database.types';
import {loadListings, saveListings, type Listing} from './listing-store';

type ListingCard = {
  id: number | string;
  title: string;
  status: 'Active' | 'Paused' | 'Completed';
  offered: number;
  sold: number;
  remaining: number | string;
  price: string;
  earned: string;
  progress: number;
  icon: 'sun' | 'cloud' | 'check';
  source?: 'database' | 'local';
  sourceId?: number | string;
  availableFrom?: string;
  availableUntil?: string;
};

type EditForm = {id: number | string; quantityKwh: number | ''; pricePerKwhCents: number; availableFrom: string; availableUntil: string};

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
  // Keep the server render and the browser's first render identical. Browser-only
  // localStorage data is loaded after hydration in the effect below.
  const [listings, setListings] = useState<Listing[]>([]);
  const [databaseListings, setDatabaseListings] = useState<SellerListing[] | null>(null);
  const [confirmId, setConfirmId] = useState<number | string | null>(null);
  const [notice, setNotice] = useState('');
  const [currentTab, setCurrentTab] = useState<'active' | 'completed'>('active');
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [summaryCard, setSummaryCard] = useState<ListingCard | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) setListings(loadListings());
    });

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
    () => allCards.filter((card) => card.status === 'Active' || card.status === 'Paused'),
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
      const response = await fetch(`/api/listings/${confirmId}`, {method: 'DELETE'});

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

  const togglePause = async (card: ListingCard) => {
    if (card.source === 'local') {
      const next = listings.map((item) => item.id === Number(card.sourceId)
        ? {...item, status: item.status === 'paused' ? 'active' as const : 'paused' as const}
        : item);
      setListings(next);
      saveListings(next);
      setNotice(`Listing ${card.status === 'Paused' ? 'resumed' : 'paused'}.`);
      return;
    }
    if (!databaseListings || card.source !== 'database') return;
    const listing = databaseListings.find((item) => item.id === card.sourceId);
    if (!listing) return;
    const status = listing.status === 'paused' ? 'active' : 'paused';
    const response = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status}),
    });
    const data = (await response.json().catch(() => null)) as {listing?: SellerListing; error?: string} | null;
    if (!response.ok || !data?.listing) {
      setNotice(data?.error ?? 'Could not update this listing.');
      return;
    }
    setDatabaseListings((current) => current?.map((item) => item.id === listing.id ? data.listing! : item) ?? null);
    setNotice(`Listing ${status === 'paused' ? 'paused' : 'resumed'}.`);
  };

  const beginEdit = (card: ListingCard) => setEditForm({
    id: card.sourceId ?? card.id,
    quantityKwh: card.offered,
    pricePerKwhCents: Number.parseFloat(card.price) || 12,
    availableFrom: card.availableFrom?.slice(0, 10) ?? '',
    availableUntil: card.availableUntil?.slice(0, 10) ?? '',
  });

  const saveEdit = async () => {
    const quantityKwh = Number(editForm?.quantityKwh);
    if (!editForm || !Number.isFinite(quantityKwh) || quantityKwh <= 0 || !editForm.availableFrom || !editForm.availableUntil) {
      setNotice('Enter a valid quantity and listing dates.');
      return;
    }
    if (editForm.availableUntil < editForm.availableFrom) {
      setNotice('The end date must be on or after the start date.');
      return;
    }
    setActionPending(true);
    if (databaseListings) {
      const response = await fetch(`/api/listings/${editForm.id}`, {
        method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...editForm, quantityKwh}),
      });
      const data = (await response.json().catch(() => null)) as {listing?: SellerListing; error?: string} | null;
      if (!response.ok || !data?.listing) {
        setNotice(data?.error ?? 'Could not save the listing.');
        setActionPending(false);
        return;
      }
      setDatabaseListings((current) => current?.map((item) => item.id === editForm.id ? data.listing! : item) ?? null);
    } else {
      const next = listings.map((item) => item.id === Number(editForm.id) ? {
        ...item, quantityKwh, pricePerKwhCents: editForm.pricePerKwhCents,
        availableFrom: editForm.availableFrom, availableUntil: editForm.availableUntil,
        title: `${quantityKwh.toFixed(1)} kWh for sale`, detail: `${editForm.pricePerKwhCents.toFixed(1)}c/kWh`,
      } : item);
      setListings(next);
      saveListings(next);
    }
    setActionPending(false);
    setEditForm(null);
    setNotice('Listing changes saved.');
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
                onPause={() => togglePause(card)}
                onEdit={() => beginEdit(card)}
                onSummary={() => setSummaryCard(card)}
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

      {editForm && (
        <div className="modal-backdrop" onMouseDown={() => setEditForm(null)}>
          <div className="confirm-card listing-edit-card" onMouseDown={(event) => event.stopPropagation()}>
            <p className="kicker">EDIT LISTING</p>
            <h2>Update energy listing</h2>
            <label>Energy amount (kWh)<input type="number" min="0.01" step="0.01" placeholder="0" value={editForm.quantityKwh} onChange={(event) => setEditForm({...editForm, quantityKwh: event.target.value === '' ? '' : Number(event.target.value)})} /></label>
            <label>Price (cents/kWh)<input type="number" min="0" step="1" value={editForm.pricePerKwhCents} onChange={(event) => setEditForm({...editForm, pricePerKwhCents: Number(event.target.value)})} /></label>
            <label>Start date<input type="date" value={editForm.availableFrom} onChange={(event) => setEditForm({...editForm, availableFrom: event.target.value})} /></label>
            <label>End date<input type="date" min={editForm.availableFrom} value={editForm.availableUntil} onChange={(event) => setEditForm({...editForm, availableUntil: event.target.value})} /></label>
            <div>
              <button className="secondary-action" type="button" onClick={() => setEditForm(null)}>Cancel</button>
              <button className="danger-action save-action" type="button" onClick={saveEdit} disabled={actionPending}>{actionPending ? 'Saving...' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}

      {summaryCard && (
        <div className="modal-backdrop" onMouseDown={() => setSummaryCard(null)}>
          <div className="confirm-card listing-summary-card" onMouseDown={(event) => event.stopPropagation()}>
            <span className="summary-check" aria-hidden="true">✓</span>
            <p className="kicker">COMPLETED LISTING</p>
            <h2>{summaryCard.title}</h2>
            <div className="summary-detail-grid">
              <SummaryDetail label="Energy offered" value={`${summaryCard.offered} kWh`} />
              <SummaryDetail label="Energy sold" value={`${summaryCard.sold} kWh`} />
              <SummaryDetail label="Community rate" value={summaryCard.price} />
              <SummaryDetail label="Total earned" value={summaryCard.earned} />
              <SummaryDetail label="Match rate" value={`${summaryCard.progress}%`} />
              <SummaryDetail label="Remaining" value={summaryCard.remaining === '-' ? 'None' : `${summaryCard.remaining} kWh`} />
            </div>
            <div>
              <button className="secondary-action" type="button" onClick={() => setSummaryCard(null)}>Close</button>
              <Link className="summary-earnings-link" href="/seller/wallet">View earnings</Link>
            </div>
          </div>
        </div>
      )}
    </SellerListingsShell>
  );
}

function buildActiveCards(listings: Listing[]): ListingCard[] {
  return listings.map((listing, index) => {
    const offered = listing.quantityKwh || extractKwh(listing.title) || 0;
    const sold = extractKwh(listing.result);
    const price = listing.pricePerKwhCents ?? 12;
    const remaining = Math.max(offered - sold, 0);
    const progress = offered > 0 ? Math.round((sold / offered) * 100) : 0;

    return {
      id: listing.id,
      source: 'local',
      sourceId: listing.id,
      title: buildListingTitle(offered, listing.availableFrom, listing.availableUntil),
      status: listing.status === 'paused' ? 'Paused' : 'Active',
      offered,
      sold,
      remaining,
      price: `${price.toFixed(1)}c/kWh`,
      earned: `AUD $${((sold * price) / 100).toFixed(2)}`,
      progress,
      icon: index % 2 === 0 ? 'sun' : 'cloud',
      availableFrom: listing.availableFrom,
      availableUntil: listing.availableUntil,
    };
  });
}

function buildDatabaseCards(listings: SellerListing[]): ListingCard[] {
  return listings.map((listing, index) => {
    const offered = Number(listing.quantity_kwh);
    const sold = Number(listing.sold_quantity_kwh ?? (listing.status === 'completed' ? offered : 0));
    const price = listing.price_per_kwh_cents ?? 12;
    const remaining = listing.status === 'completed' ? '-' : Math.max(offered - sold, 0);
    const progress = offered > 0 ? Math.round((sold / offered) * 100) : 0;
    const title = buildListingTitle(offered, listing.available_from, listing.available_until);

    return {
      id: listing.id,
      source: 'database',
      sourceId: listing.id,
      title,
      status: listing.status === 'completed' ? 'Completed' : listing.status === 'paused' ? 'Paused' : 'Active',
      offered,
      sold,
      remaining,
      price: `${price.toFixed(1)}c/kWh`,
      earned: `AUD $${((sold * price) / 100).toFixed(2)}`,
      progress,
      icon: index % 2 === 0 ? 'sun' : 'cloud',
      availableFrom: listing.available_from ?? undefined,
      availableUntil: listing.available_until ?? undefined,
    };
  });
}

function buildListingTitle(offered: number, from?: string | null, until?: string | null) {
  const amount = Number.isInteger(offered) ? String(offered) : offered.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  if (!from || !until) return `${amount} kWh Energy Listing`;
  const formatter = new Intl.DateTimeFormat('en-AU', {day: 'numeric', month: 'short', timeZone: 'UTC'});
  return `${amount} kWh · ${formatter.format(new Date(from))}–${formatter.format(new Date(until))}`;
}

function extractKwh(text: string) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*kWh/i);
  return match ? Number(match[1]) : 0;
}

function ListingCardView({
  card,
  onCancel,
  onPause,
  onEdit,
  onSummary,
}: {
  card: ListingCard;
  onCancel?: () => void;
  onPause?: () => void;
  onEdit?: () => void;
  onSummary?: () => void;
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
            <button className="outline-action summary" type="button" onClick={onSummary}>
              View summary
            </button>
          ) : (
            <>
              <button className="outline-action" type="button" onClick={onEdit}>
                Edit
              </button>
              <button className="outline-action" type="button" onClick={onPause} disabled={!onPause}>
                <span aria-hidden="true">{card.status === 'Paused' ? '▶' : '❚❚'}</span>
                {card.status === 'Paused' ? 'Resume' : 'Pause'}
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

function SummaryDetail({label, value}: {label: string; value: string}) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
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

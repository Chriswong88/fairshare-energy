'use client';

import Link from 'next/link';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
  postcode: string;
  equityPriority: number;
  coordinates: [number, number];
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
    postcode: '2502',
    equityPriority: 3,
    coordinates: [-34.485, 150.889],
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
    postcode: '2530',
    equityPriority: 2,
    coordinates: [-34.494, 150.791],
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
    postcode: '2500',
    equityPriority: 1,
    coordinates: [-34.4278, 150.8931],
  },
];

export default function RenterMarketplace() {
  const [marketOffers, setMarketOffers] = useState<Offer[]>(offers);
  const [purchaseOffer, setPurchaseOffer] = useState<Offer | null>(null);
  const [search, setSearch] = useState('');
  const [purchaseKwh, setPurchaseKwh] = useState(10);
  const [purchaseAgreed, setPurchaseAgreed] = useState(false);
  const [purchaseNotice, setPurchaseNotice] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'closest' | 'available' | 'equity'>('value');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    let restoredOffers: Offer[] | null = null;
    try {
      const storedRemaining = JSON.parse(window.localStorage.getItem('fairshare-marketplace-remaining') ?? 'null');
      if (storedRemaining && typeof storedRemaining === 'object' && !Array.isArray(storedRemaining)) {
        restoredOffers = offers.map((offer) => ({
          ...offer,
          availableKwh: Math.max(0, Number(storedRemaining[offer.id] ?? offer.availableKwh)),
        }));
      } else {
        const storedPurchases = JSON.parse(window.localStorage.getItem('fairshare-renter-purchases') ?? '[]');
        if (Array.isArray(storedPurchases)) {
          const purchasedByOffer = storedPurchases.reduce<Record<string, number>>((totals, purchase) => {
            if (purchase && typeof purchase.offerId === 'string' && Number.isFinite(Number(purchase.quantityKwh))) {
              totals[purchase.offerId] = (totals[purchase.offerId] ?? 0) + Number(purchase.quantityKwh);
            }
            return totals;
          }, {});
          if (Object.keys(purchasedByOffer).length) {
            restoredOffers = offers.map((offer) => ({...offer, availableKwh: Math.max(0, offer.availableKwh - (purchasedByOffer[offer.id] ?? 0))}));
            window.localStorage.setItem('fairshare-marketplace-remaining', JSON.stringify(Object.fromEntries(restoredOffers.map((offer) => [offer.id, offer.availableKwh]))));
          }
        }
      }
    } catch {
      // Keep the original listing amounts if browser storage is unavailable.
    }
    if (restoredOffers) Promise.resolve().then(() => setMarketOffers(restoredOffers!));
  }, []);

  const visibleOffers = useMemo(
    () => {
      const filtered = marketOffers.filter((offer) =>
        `${offer.name} ${offer.suburb} ${offer.postcode}`.toLowerCase().includes(search.toLowerCase()),
      );

      return filtered.toSorted((left, right) => {
        if (sortBy === 'closest') return left.distanceKm - right.distanceKm;
        if (sortBy === 'available') return right.availableKwh - left.availableKwh;
        if (sortBy === 'equity') return right.equityPriority - left.equityPriority;
        return left.offerRate - right.offerRate;
      });
    },
    [marketOffers, search, sortBy],
  );

  const openPurchase = useCallback((offer: Offer) => {
    setPurchaseOffer(offer);
    setPurchaseKwh(Math.min(10, offer.availableKwh));
    setPurchaseAgreed(false);
  }, []);

  const confirmPurchase = async () => {
    if (!purchaseOffer || !purchaseAgreed) return;

    const purchase = {
      id: `${purchaseOffer.id}-${Date.now()}`,
      offerId: purchaseOffer.id,
      seller: purchaseOffer.name,
      quantityKwh: purchaseKwh,
      pricePerKwhCents: purchaseOffer.offerRate,
      totalCents: Math.round(purchaseKwh * purchaseOffer.offerRate),
      createdAt: new Date().toISOString(),
    };

    try {
      const saved = JSON.parse(window.localStorage.getItem('fairshare-renter-purchases') ?? '[]');
      const purchases = Array.isArray(saved) ? saved : [];
      window.localStorage.setItem('fairshare-renter-purchases', JSON.stringify([...purchases, purchase]));
    } catch {
      window.localStorage.setItem('fairshare-renter-purchases', JSON.stringify([purchase]));
    }

    try {
      await fetch('/api/buyer/energy', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({offerId: purchaseOffer.id, sellerName: purchaseOffer.name,
          sellerSuburb: purchaseOffer.suburb, quantityKwh: purchaseKwh,
          pricePerKwhCents: purchaseOffer.offerRate, standardRateCents: purchaseOffer.standardRate}),
      });
    } catch {
      // The local record above keeps the purchase available when the backend is offline.
    }

    const remainingKwh = Math.max(0, purchaseOffer.availableKwh - purchaseKwh);
    setMarketOffers((current) => {
      const updatedOffers = current.map((offer) => (
        offer.id === purchaseOffer.id ? {...offer, availableKwh: remainingKwh} : offer
      ));

      try {
        window.localStorage.setItem(
          'fairshare-marketplace-remaining',
          JSON.stringify(Object.fromEntries(updatedOffers.map((offer) => [offer.id, offer.availableKwh]))),
        );
      } catch {
        // The visible amount still updates for this session if storage is unavailable.
      }

      return updatedOffers;
    });
    setPurchaseNotice(`Purchase confirmed: ${purchaseKwh} kWh from ${purchaseOffer.name}. ${remainingKwh} kWh remaining.`);
    setPurchaseOffer(null);
    setPurchaseAgreed(false);
  };

  return (
    <BuyerMarketplaceShell>
      <section className={`buyer-marketplace-layout ${viewMode === 'map' ? 'map-focus' : ''}`}>
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
            <button className={sortBy === 'value' ? 'active' : ''} type="button" onClick={() => setSortBy('value')}>Best value</button>
            <button className={sortBy === 'closest' ? 'active' : ''} type="button" onClick={() => setSortBy('closest')}>Closest</button>
            <button className={sortBy === 'available' ? 'active' : ''} type="button" onClick={() => setSortBy('available')}>Most available</button>
            <button className={sortBy === 'equity' ? 'active' : ''} type="button" onClick={() => setSortBy('equity')}>Equity priority</button>
            <div>
              <button className={viewMode === 'list' ? 'active' : ''} type="button" onClick={() => setViewMode('list')}>List</button>
              <button className={viewMode === 'map' ? 'active' : ''} type="button" onClick={() => setViewMode('map')}>Map</button>
            </div>
          </div>

          {purchaseNotice && (
            <div className="purchase-success-notice" role="status">
              <span>{purchaseNotice}</span>
              <button type="button" aria-label="Dismiss purchase confirmation" onClick={() => setPurchaseNotice('')}>×</button>
            </div>
          )}

          <div className="local-offer-stack">
            {visibleOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onSelect={() => openPurchase(offer)} />
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
          {viewMode === 'map' && <button className="map-return-list" type="button" onClick={() => setViewMode('list')}>← Show list</button>}
          <WollongongOfferMap offers={visibleOffers.filter((offer) => offer.availableKwh > 0)} onSelect={openPurchase} />
        </aside>
      </section>

      {purchaseOffer && (
        <div className="quick-purchase-backdrop" onMouseDown={() => setPurchaseOffer(null)}>
          <section
            className="quick-purchase-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-purchase-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="quick-purchase-close" type="button" aria-label="Close purchase" onClick={() => setPurchaseOffer(null)}>×</button>
            <p className="kicker">LOCAL SOLAR PURCHASE</p>
            <h2 id="quick-purchase-title">Purchase from {purchaseOffer.name}</h2>

            <div className="quick-purchase-summary">
              <div><span>Available</span><strong>{purchaseOffer.availableKwh} kWh</strong></div>
              <div><span>Community rate</span><strong>{purchaseOffer.offerRate}c/kWh</strong></div>
              <div><span>Location</span><strong>{purchaseOffer.suburb}</strong></div>
            </div>

            <div className="quick-purchase-amount">
              <div>
                <label htmlFor="purchase-amount">Choose energy amount</label>
                <output>{purchaseKwh} kWh</output>
              </div>
              <div className="quick-purchase-counter">
                <button type="button" aria-label="Decrease energy amount" onClick={() => setPurchaseKwh((current) => Math.max(1, current - 1))}>−</button>
                <input
                  id="purchase-amount"
                  className="quick-purchase-range"
                  type="range"
                  min="1"
                  max={purchaseOffer.availableKwh}
                  step="1"
                  value={purchaseKwh}
                  onChange={(event) => setPurchaseKwh(Number(event.target.value))}
                />
                <button type="button" aria-label="Increase energy amount" onClick={() => setPurchaseKwh((current) => Math.min(purchaseOffer.availableKwh, current + 1))}>+</button>
              </div>
            </div>

            <div className="quick-purchase-total">
              <span>Purchase total</span>
              <strong>AUD ${((purchaseKwh * purchaseOffer.offerRate) / 100).toFixed(2)}</strong>
            </div>

            <label className="quick-purchase-terms">
              <input type="checkbox" checked={purchaseAgreed} onChange={() => setPurchaseAgreed((current) => !current)} />
              <span>I agree to the community energy terms.</span>
            </label>

            <div className="quick-purchase-actions">
              <button className="quick-purchase-cancel" type="button" onClick={() => setPurchaseOffer(null)}>Cancel</button>
              <button className="quick-purchase-confirm" type="button" disabled={!purchaseAgreed} onClick={confirmPurchase}>Confirm purchase</button>
            </div>
          </section>
        </div>
      )}
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
        <button type="button" disabled={offer.availableKwh <= 0} onClick={onSelect}>
          {offer.availableKwh > 0 ? 'Purchase' : 'Sold out'}
        </button>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MarketplaceLeafletMap | null>(null);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadMarketplaceLeaflet()
      .then((leaflet) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = leaflet.map(containerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
          touchZoom: true,
          dragging: true,
        }).setView([-34.459, 150.857], 11);
        mapRef.current = map;

        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        mapOffers.forEach((offer) => {
          const icon = leaflet.divIcon({
            className: 'marketplace-map-marker-wrap',
            html: '<span class="live-map-offer-pin">H</span>',
            iconSize: [52, 64],
            iconAnchor: [26, 58],
          });
          const tooltip = document.createElement('span');
          tooltip.textContent = `${offer.name} - ${offer.availableKwh} kWh at ${offer.offerRate}c/kWh`;

          leaflet.marker(offer.coordinates, {icon, keyboard: true, title: `Purchase from ${offer.name}`})
            .addTo(map)
            .bindTooltip(tooltip, {direction: 'top', offset: [0, -45], className: 'marketplace-map-tooltip'})
            .on('click', () => onSelect(offer));
        });
      })
      .catch(() => {
        if (!cancelled) setMapError('The live map could not load. Check your internet connection and refresh.');
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapOffers, onSelect]);

  return (
    <div className="marketplace-map live-marketplace-map" aria-label="Interactive map of local energy offers">
      <div ref={containerRef} className="marketplace-leaflet-map" />
      {mapError && <span className="market-map-loading" role="alert">{mapError}</span>}
    </div>
  );
}

type MarketplaceLeafletMap = {
  remove: () => void;
  setView: (centre: [number, number], zoom: number) => MarketplaceLeafletMap;
};

type MarketplaceLeafletLayer = {
  addTo: (map: MarketplaceLeafletMap) => MarketplaceLeafletLayer;
  bindTooltip: (content: HTMLElement, options: Record<string, unknown>) => MarketplaceLeafletLayer;
  on: (event: string, handler: () => void) => MarketplaceLeafletLayer;
};

type MarketplaceLeafletApi = {
  map: (element: HTMLElement, options: Record<string, unknown>) => MarketplaceLeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => MarketplaceLeafletLayer;
  divIcon: (options: Record<string, unknown>) => unknown;
  marker: (point: [number, number], options: Record<string, unknown>) => MarketplaceLeafletLayer;
};

function getMarketplaceLeaflet() {
  return (window as unknown as {L?: MarketplaceLeafletApi}).L;
}

function loadMarketplaceLeaflet(): Promise<MarketplaceLeafletApi> {
  const loaded = getMarketplaceLeaflet();
  if (loaded) return Promise.resolve(loaded);

  if (!document.getElementById('fairshare-leaflet-css')) {
    const stylesheet = document.createElement('link');
    stylesheet.id = 'fairshare-leaflet-css';
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    stylesheet.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    stylesheet.crossOrigin = '';
    document.head.appendChild(stylesheet);
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('fairshare-leaflet-js') as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');
    const finish = () => {
      const leaflet = getMarketplaceLeaflet();
      if (leaflet) resolve(leaflet);
      else reject(new Error('Leaflet did not load.'));
    };

    script.addEventListener('load', finish, {once: true});
    script.addEventListener('error', () => reject(new Error('Leaflet could not load.')), {once: true});

    if (!existing) {
      script.id = 'fairshare-leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      document.head.appendChild(script);
    } else if (getMarketplaceLeaflet()) {
      finish();
    }
  });
}

function BuyerMarketplaceShell({children}: {children: React.ReactNode}) {
  return (
    <main className="buyer-dashboard-page buyer-marketplace-page">
      <style>{`
        .live-marketplace-map:before{display:none}.marketplace-leaflet-map{position:absolute;inset:0;z-index:1;background:#eaf1ec}.marketplace-map-marker-wrap{background:transparent!important;border:0!important}.live-map-offer-pin{display:grid;place-items:center;width:50px;height:50px;border-radius:50%;background:#0d7e3f;color:#fff;font-weight:900;font-size:16px;border:3px solid #fff;box-shadow:0 5px 13px #052c1a40;position:relative}.live-map-offer-pin:after{content:'';position:absolute;left:50%;bottom:-9px;width:10px;height:10px;background:#0d7e3f;border:2px solid #fff;border-radius:50%;transform:translateX(-50%)}.marketplace-map-tooltip{background:#fff!important;border:1px solid #cbd7d1!important;color:#123d33!important;border-radius:8px!important;padding:7px 10px!important;font-size:11px!important;font-weight:800!important;box-shadow:0 5px 16px #0719362b!important}.marketplace-map-tooltip:before{display:none!important}.market-map-loading{position:absolute;inset:0;z-index:3;background:#f4f7f5;display:grid;place-items:center;padding:30px;text-align:center;color:#52617a;font-weight:700}.marketplace-map-pane{position:relative}.map-return-list{position:absolute;left:14px;top:14px;z-index:600;border:1px solid #087a46;border-radius:8px;background:#fff;color:#087a46;padding:9px 13px;font-weight:800;box-shadow:0 5px 16px #0719362b}.buyer-marketplace-layout.map-focus{grid-template-columns:1fr}.buyer-marketplace-layout.map-focus .marketplace-list-pane{display:none}.buyer-marketplace-layout.map-focus .marketplace-map-pane{display:block}.buyer-marketplace-layout.map-focus .marketplace-map{position:relative;top:0;height:calc(100vh - 72px);min-height:640px}.offer-saving-panel button:hover,.limit-slider-row button:hover,.join-offer-card>button:hover{filter:brightness(.96);transform:translateY(-1px)}.terms-agreement{display:flex;align-items:center;gap:5px;flex-wrap:wrap;font-size:12px;margin-bottom:18px}.terms-agreement label{display:flex;align-items:center;gap:9px}.terms-agreement button{width:auto!important;height:auto!important;border:0!important;background:transparent!important;color:#075bd7!important;margin:0!important;padding:2px!important;font-size:12px!important;text-decoration:underline}.purchase-confirmation{min-height:18px;margin:13px 0 0;color:#087a46;font-size:12px;font-weight:800;line-height:1.4}.market-terms-backdrop{position:fixed;inset:0;z-index:1000;background:#061d17b8;display:grid;place-items:center;padding:20px}.market-terms-dialog{width:min(500px,100%);background:#fff;border-radius:16px;padding:29px;box-shadow:0 24px 70px #03130e66;position:relative;color:#081936}.market-terms-dialog h2{font-size:26px;margin:0 35px 16px 0}.market-terms-dialog ul{padding-left:22px;color:#52617a;line-height:1.55;display:grid;gap:11px}.market-terms-close{position:absolute;right:15px;top:13px;width:36px;height:36px;border:0;border-radius:50%;background:#eef4f1;font-size:21px}.market-terms-accept{width:100%;border:0;border-radius:8px;background:#087a46;color:#fff;padding:13px;font-weight:800;margin-top:12px}@media(max-width:1180px){.buyer-marketplace-layout.map-focus .marketplace-map-pane{min-height:calc(100vh - 72px)}}
      `}</style>
      <style>{`
        .offer-saving-panel button:disabled{background:#dfe6e2!important;color:#78847e!important;cursor:not-allowed}.purchase-success-notice{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:14px 0;padding:12px 14px;border:1px solid #a9d9bc;border-radius:10px;background:#eaf8ef;color:#096a3d;font-size:13px;font-weight:800}.purchase-success-notice button{display:grid;place-items:center;width:27px;height:27px;border:0;border-radius:50%;background:#d7efdf;color:#096a3d;font-size:18px;cursor:pointer}.quick-purchase-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:20px;background:#061d17b8}.quick-purchase-dialog{position:relative;width:min(560px,100%);max-height:calc(100vh - 40px);overflow:auto;padding:30px;border:1px solid #cbdad3;border-radius:18px;background:#fff;color:#081936;box-shadow:0 24px 70px #03130e66}.quick-purchase-dialog .kicker{margin:0 45px 8px 0;color:#087a46;font-size:12px;font-weight:900;letter-spacing:.12em}.quick-purchase-dialog h2{margin:0 44px 22px 0;font-size:28px;line-height:1.15}.quick-purchase-close{position:absolute;right:16px;top:15px;display:grid;place-items:center;width:38px;height:38px;border:0;border-radius:50%;background:#edf5f1;color:#153d32;font-size:23px;cursor:pointer}.quick-purchase-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:22px}.quick-purchase-summary div{display:flex;flex-direction:column;gap:5px;padding:13px;border:1px solid #d7e0dc;border-radius:10px;background:#fafcfb}.quick-purchase-summary span{color:#627168;font-size:11px}.quick-purchase-summary strong{color:#0a663d;font-size:15px}.quick-purchase-amount{padding:18px;border:1px solid #d7e0dc;border-radius:12px}.quick-purchase-amount>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:15px}.quick-purchase-amount label{font-size:14px;font-weight:800}.quick-purchase-amount output{color:#087a46;font-size:20px;font-weight:900}.quick-purchase-counter{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;gap:12px}.quick-purchase-counter button{width:40px;height:40px;border:1px solid #9ec5b1;border-radius:8px;background:#fff;color:#087a46;font-size:21px;font-weight:900;cursor:pointer}.quick-purchase-range{width:100%;accent-color:#087a46;cursor:pointer}.quick-purchase-total{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:16px 0;padding:16px;border-radius:11px;background:#eef8f2}.quick-purchase-total span{color:#4e6259;font-size:13px}.quick-purchase-total strong{color:#087a46;font-size:24px}.quick-purchase-terms{display:flex;align-items:flex-start;gap:10px;margin:5px 0 20px;color:#41544c;font-size:13px;line-height:1.4;cursor:pointer}.quick-purchase-terms input{width:17px;height:17px;margin:1px 0 0;accent-color:#087a46}.quick-purchase-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:12px}.quick-purchase-actions button{min-height:48px;border-radius:9px;font-size:14px;font-weight:900;cursor:pointer}.quick-purchase-cancel{border:1px solid #087a46;background:#fff;color:#087a46}.quick-purchase-confirm{border:1px solid #087a46;background:#087a46;color:#fff}.quick-purchase-confirm:disabled{border-color:#cad3cf;background:#e5eae7;color:#87918c;cursor:not-allowed}.quick-purchase-actions button:not(:disabled):hover,.quick-purchase-close:hover,.quick-purchase-counter button:hover{filter:brightness(.96);transform:translateY(-1px)}@media(max-width:560px){.quick-purchase-dialog{padding:24px 18px}.quick-purchase-dialog h2{font-size:23px}.quick-purchase-summary{grid-template-columns:1fr}.quick-purchase-actions{grid-template-columns:1fr}.quick-purchase-total strong{font-size:20px}}
      `}</style>
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

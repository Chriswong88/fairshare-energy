'use client';

import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';

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
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const impactText = 'I have shared 132 kWh of local solar energy, supported 8 Wollongong households and helped avoid 96 kg of CO2 with FairShare Energy.';

  const shareImpact = async () => {
    try {
      if (navigator.share) {
        await navigator.share({title: 'My FairShare Energy impact', text: impactText, url: window.location.href});
        setShareMessage('Impact shared successfully.');
      } else {
        await copyText(`${impactText} ${window.location.href}`);
        setShareMessage('Impact summary copied to your clipboard.');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setShareMessage('Sharing was not available. Try copying the summary instead.');
    }
  };

  const copyImpact = async () => {
    try {
      await copyText(`${impactText} ${window.location.href}`);
      setShareMessage('Impact summary copied to your clipboard.');
    } catch {
      setShareMessage('Clipboard access was blocked. Use Share on my device instead.');
    }
  };

  return (
    <main className="seller-dashboard-page impact-page">
      <style>{`
        .real-impact-map:before,.real-impact-map:after{display:none}.real-impact-map iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.impact-map-locations{position:absolute;left:14px;bottom:13px;z-index:2;display:flex;flex-wrap:wrap;gap:7px;pointer-events:none}.impact-map-locations a{pointer-events:auto;background:#fff;color:#075c36;text-decoration:none;border:1px solid #cfdad5;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:800;box-shadow:0 3px 10px #07193628}.impact-map-locations a:hover{background:#087a46;color:#fff}.share-impact-button{cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}.share-impact-button:hover{transform:translateY(-2px);box-shadow:0 12px 24px #087a4630}.impact-share-backdrop{position:fixed;inset:0;z-index:1000;background:#061d17b8;display:grid;place-items:center;padding:20px}.impact-share-dialog{width:min(480px,100%);background:#fff;border-radius:16px;padding:28px;box-shadow:0 24px 70px #03130e66;position:relative;color:#081936}.impact-share-close{position:absolute;right:16px;top:13px;width:36px;height:36px;border:0;border-radius:50%;background:#eef4f1;color:#153d32;font-size:21px}.impact-share-dialog .kicker{margin-bottom:8px}.impact-share-dialog h2{font-size:27px;margin:0 35px 9px 0}.impact-share-dialog>p:not(.kicker):not(.impact-share-status){color:#52617a;line-height:1.5;margin:0 0 20px}.impact-share-preview{background:linear-gradient(135deg,#0b7b45,#07552f);color:#fff;border-radius:12px;padding:20px;margin-bottom:20px}.impact-share-preview strong{display:block;font-size:20px;margin-bottom:14px}.impact-share-preview div{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.impact-share-preview span{background:#ffffff18;border-radius:8px;padding:10px 7px;text-align:center;font-size:11px}.impact-share-preview b{display:block;font-size:18px;margin-bottom:3px}.impact-share-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.impact-share-actions button{border-radius:8px;padding:12px;font-weight:800}.impact-share-primary{background:#087a46;color:#fff;border:1px solid #087a46}.impact-share-secondary{background:#fff;color:#087a46;border:1px solid #087a46}.impact-share-status{min-height:18px;color:#087a46;font-size:12px;font-weight:700;margin:13px 0 0}@media(max-width:520px){.impact-map-locations{right:10px}.impact-map-locations a{font-size:10px;padding:6px 9px}.impact-share-actions{grid-template-columns:1fr}.impact-share-preview div{grid-template-columns:1fr}}
      `}</style>
      <style>{`
        .live-impact-map:before,.live-impact-map:after{display:none}.leaflet-impact-map{position:absolute;inset:0;z-index:1;background:#eaf1ec}.map-loading{position:absolute;inset:0;display:grid;place-items:center;color:#52617a;font-size:12px;font-weight:700}.impact-map-tooltip{background:#fff!important;border:1px solid #b9c9c2!important;border-radius:8px!important;color:#123d33!important;box-shadow:0 5px 16px #0719362b!important;padding:7px 10px!important;font-size:11px!important;font-weight:800!important}.impact-map-tooltip:before{display:none!important}.impact-arrow-icon{background:transparent!important;border:0!important}.impact-arrow-tip{display:block;width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:13px solid #075c36;filter:drop-shadow(0 1px 1px #fff)}.impact-arrow-tip.dapto{transform:rotate(215deg)}.impact-arrow-tip.warrawong{transform:rotate(18deg)}.impact-arrow-tip.wollongong{transform:rotate(24deg)}.leaflet-control-attribution{font-size:9px!important}.impact-map-key{position:absolute;left:46px;top:10px;z-index:500;background:#fffffff2;color:#263551;border:1px solid #d9e0ea;border-radius:8px;padding:7px 10px;font-size:10px;font-weight:800;box-shadow:0 4px 12px #07193620;pointer-events:none}@media(max-width:520px){.impact-map-key{left:40px;right:8px;width:max-content;max-width:calc(100% - 48px)}}
      `}</style>
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
              <LiveImpactMap />
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
            <button className="share-impact-button" type="button" onClick={() => {setShareMessage(''); setShareOpen(true);}}>
              <span aria-hidden="true" />
              <b>Share my impact</b>
              <small>Let others see the difference you are making.</small>
            </button>
          </section>
        </div>
      </section>

      {shareOpen && (
        <div className="impact-share-backdrop" onMouseDown={() => setShareOpen(false)}>
          <section className="impact-share-dialog" role="dialog" aria-modal="true" aria-labelledby="impact-share-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="impact-share-close" type="button" aria-label="Close sharing panel" onClick={() => setShareOpen(false)}>×</button>
            <p className="kicker">SHARE YOUR PROGRESS</p>
            <h2 id="impact-share-title">Your community impact</h2>
            <p>Share a privacy-safe summary. Individual recipient names and exact locations are never included.</p>
            <div className="impact-share-preview">
              <strong>Powering a fairer Wollongong</strong>
              <div><span><b>132</b>kWh shared</span><span><b>8</b>households</span><span><b>96 kg</b>CO2 avoided</span></div>
            </div>
            <div className="impact-share-actions">
              <button className="impact-share-primary" type="button" onClick={shareImpact}>Share on my device</button>
              <button className="impact-share-secondary" type="button" onClick={copyImpact}>Copy impact summary</button>
            </div>
            <p className="impact-share-status" aria-live="polite">{shareMessage}</p>
          </section>
        </div>
      )}
    </main>
  );
}

async function copyText(value: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
}

type LeafletMap = {
  remove: () => void;
  setView: (centre: [number, number], zoom: number) => LeafletMap;
};

type LeafletLayer = {
  addTo: (map: LeafletMap) => LeafletLayer;
  bindTooltip: (content: HTMLElement, options: Record<string, unknown>) => LeafletLayer;
};

type LeafletApi = {
  map: (element: HTMLElement, options: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => LeafletLayer;
  circle: (centre: [number, number], options: Record<string, unknown>) => LeafletLayer;
  polyline: (points: [number, number][], options: Record<string, unknown>) => LeafletLayer;
  divIcon: (options: Record<string, unknown>) => unknown;
  marker: (point: [number, number], options: Record<string, unknown>) => LeafletLayer;
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

const impactZones = [
  {id: 'dapto', name: 'Dapto', households: 3, centre: [-34.494, 150.791] as [number, number], pointer: [-34.516, 150.757] as [number, number], radius: 2500},
  {id: 'warrawong', name: 'Warrawong', households: 2, centre: [-34.485, 150.889] as [number, number], pointer: [-34.472, 150.921] as [number, number], radius: 1600},
  {id: 'wollongong', name: 'Wollongong', households: 3, centre: [-34.4278, 150.8931] as [number, number], pointer: [-34.407, 150.927] as [number, number], radius: 2200},
];

function LiveImpactMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((leaflet) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = leaflet.map(containerRef.current, {zoomControl: true, scrollWheelZoom: true}).setView([-34.459, 150.857], 11);
        mapRef.current = map;

        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        impactZones.forEach((zone) => {
          leaflet.circle(zone.centre, {
            radius: zone.radius,
            color: '#075c36',
            weight: 3,
            opacity: 0.95,
            fill: false,
            dashArray: '10 9',
          }).addTo(map);

          leaflet.polyline([zone.centre, zone.pointer], {
            color: '#075c36',
            weight: 3,
            opacity: 0.95,
            dashArray: '7 8',
          }).addTo(map);

          const label = document.createElement('span');
          label.textContent = `${zone.name} - ${zone.households} households supported`;
          const arrowIcon = leaflet.divIcon({
            className: 'impact-arrow-icon',
            html: `<span class="impact-arrow-tip ${zone.id}"></span>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          leaflet.marker(zone.pointer, {icon: arrowIcon, keyboard: true, title: label.textContent})
            .addTo(map)
            .bindTooltip(label, {permanent: true, direction: 'top', offset: [0, -9], className: 'impact-map-tooltip'});
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
  }, []);

  return (
    <div className="wollongong-map live-impact-map" aria-label="Live map showing supported households in Dapto, Warrawong and Wollongong">
      <div ref={containerRef} className="leaflet-impact-map" />
      <span className="impact-map-key">Dashed zones show suburb-level support</span>
      {mapError && <span className="map-loading" role="alert">{mapError}</span>}
    </div>
  );
}

function loadLeaflet(): Promise<LeafletApi> {
  if (window.L) return Promise.resolve(window.L);

  const stylesheetId = 'fairshare-leaflet-css';
  if (!document.getElementById(stylesheetId)) {
    const stylesheet = document.createElement('link');
    stylesheet.id = stylesheetId;
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    stylesheet.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    stylesheet.crossOrigin = '';
    document.head.appendChild(stylesheet);
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('fairshare-leaflet-js') as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    const finish = () => window.L ? resolve(window.L) : reject(new Error('Leaflet did not load.'));
    script.addEventListener('load', finish, {once: true});
    script.addEventListener('error', () => reject(new Error('Leaflet could not load.')), {once: true});

    if (!existing) {
      script.id = 'fairshare-leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      document.head.appendChild(script);
    } else if (window.L) {
      finish();
    }
  });
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

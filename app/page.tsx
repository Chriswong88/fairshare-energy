'use client';

import Link from 'next/link';
import {useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {getDisplayLocationFromAddress} from './location-label';

type Role = 'buyer' | 'seller';
type Mode = 'signup' | 'login';

type AuthResponse = {
  error?: string;
  profile?: {
    full_name?: string;
    suburb?: string;
    postcode?: string;
    active_role?: Role;
    electricity_provider?: string;
    electricity_plan?: string;
  } | null;
};

const defaultForm = {
  fullName: '',
  email: '',
  password: '',
  addressLine: '',
  suburb: 'Wollongong',
  postcode: '2500',
  electricityProvider: '',
  electricityPlan: '',
};

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('buyer');
  const [mode, setMode] = useState<Mode>('signup');
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const displayLocation = useMemo(
    () => getDisplayLocationFromAddress(form.suburb, form.postcode),
    [form.suburb, form.postcode],
  );

  function updateField(field: keyof typeof defaultForm, value: string) {
    setForm((current) => ({...current, [field]: value}));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const body =
      mode === 'signup'
        ? {...form, activeRole: role}
        : {email: form.email, password: form.password};

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as AuthResponse;

      if (!response.ok) {
        throw new Error(data.error ?? 'Could not complete request.');
      }

      const profile = data.profile;
      const location = getDisplayLocationFromAddress(profile?.suburb ?? form.suburb, profile?.postcode ?? form.postcode);
      window.localStorage.setItem('fairshare.location', location);
      window.dispatchEvent(new Event('fairshare-location-change'));
      window.localStorage.setItem('fairshare.activeRole', role);

      if (profile?.full_name ?? form.fullName) {
        window.localStorage.setItem('fairshare.fullName', profile?.full_name ?? form.fullName);
      }

      if (profile?.electricity_provider ?? form.electricityProvider) {
        window.localStorage.setItem('fairshare.electricityProvider', profile?.electricity_provider ?? form.electricityProvider);
      }

      if (profile?.electricity_plan ?? form.electricityPlan) {
        window.localStorage.setItem('fairshare.electricityPlan', profile?.electricity_plan ?? form.electricityPlan);
      }

      router.push(role === 'buyer' ? '/renter' : '/seller');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link href="/" className="landing-brand">
          <span className="landing-brand-mark" />
          <span>
            <b>
              Fair<span>Share</span>
            </b>
            <small>Local energy. Shared future.</small>
          </span>
        </Link>
        <div className="landing-location">
          <span aria-hidden="true" /> {displayLocation}
        </div>
      </header>

      <section className="landing-shell">
        <div className="landing-copy">
          <p className="landing-kicker">Wollongong community energy</p>
          <h1>Buy or share local solar with FairShare.</h1>
          <p>
            Create one account, then switch between buyer and seller views whenever you need.
            Your address helps match nearby local energy and update your dashboard location.
          </p>

          <div className="landing-benefits">
            <article>
              <span>B</span>
              <strong>Energy buyer</strong>
              <p>Buy matched local solar, track savings, and manage bills.</p>
            </article>
            <article>
              <span>S</span>
              <strong>Solar seller</strong>
              <p>List surplus energy, view matches, and follow earnings.</p>
            </article>
          </div>
        </div>

        <section className="account-panel">
          <div className="account-role-tabs">
            <button className={role === 'buyer' ? 'active' : ''} type="button" onClick={() => setRole('buyer')}>
              Buyer account
            </button>
            <button className={role === 'seller' ? 'active' : ''} type="button" onClick={() => setRole('seller')}>
              Seller account
            </button>
          </div>

          <div className="account-mode-tabs">
            <button className={mode === 'signup' ? 'active' : ''} type="button" onClick={() => setMode('signup')}>
              Create account
            </button>
            <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
              Log in
            </button>
          </div>

          <form className="account-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <label>
                  Full name
                  <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} required />
                </label>
                <label>
                  Street address
                  <input value={form.addressLine} onChange={(event) => updateField('addressLine', event.target.value)} required />
                </label>
                <div className="form-grid">
                  <label>
                    Suburb
                    <input value={form.suburb} onChange={(event) => updateField('suburb', event.target.value)} required />
                  </label>
                  <label>
                    Postcode
                    <input value={form.postcode} onChange={(event) => updateField('postcode', event.target.value)} required />
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    Electricity provider
                    <select value={form.electricityProvider} onChange={(event) => updateField('electricityProvider', event.target.value)} required>
                      <option value="">Choose provider</option>
                      <option>EnergyAustralia</option>
                      <option>Origin Energy</option>
                      <option>AGL</option>
                      <option>Red Energy</option>
                      <option>Other retailer</option>
                    </select>
                  </label>
                  <label>
                    Electricity plan
                    <input
                      placeholder="e.g. Flexi Plan"
                      value={form.electricityPlan}
                      onChange={(event) => updateField('electricityPlan', event.target.value)}
                      required
                    />
                  </label>
                </div>
              </>
            )}

            <label>
              Email
              <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} required />
            </label>

            {message && <p className="account-message">{message}</p>}

            <button className="account-submit" type="submit" disabled={submitting}>
              {submitting ? 'Please wait...' : mode === 'signup' ? `Create ${role} account` : `Log in as ${role}`}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

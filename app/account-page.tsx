'use client';

import Link from 'next/link';
import {useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {apiFetch} from '@/lib/api-client';
import {getDisplayLocationFromAddress} from './location-label';
import BrandMark from './brand-mark';

type Role = 'buyer' | 'seller';
type Mode = 'signup' | 'login';
type AuthResponse = {error?: string; profile?: {full_name?: string; suburb?: string; postcode?: string; electricity_provider?: string; electricity_plan?: string} | null};

const defaultForm = {fullName: '', email: '', password: '', addressLine: '', suburb: 'Wollongong', postcode: '2500', electricityProvider: '', electricityPlan: ''};

export default function AccountPage({role, mode}: {role: Role; mode: Mode}) {
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const displayLocation = useMemo(() => getDisplayLocationFromAddress(form.suburb, form.postcode), [form.suburb, form.postcode]);
  const isSignup = mode === 'signup';
  const roleLabel = role === 'buyer' ? 'Buyer' : 'Seller';

  function updateField(field: keyof typeof defaultForm, value: string) {
    setForm((current) => ({...current, [field]: value}));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const response = await apiFetch(isSignup ? '/api/auth/signup' : '/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(isSignup ? {...form, activeRole: role} : {email: form.email, password: form.password, activeRole: role}),
      });
      const data = (await response.json().catch(() => ({}))) as AuthResponse;
      if (!response.ok) throw new Error(data.error ?? 'Could not complete request.');

      const profile = data.profile;
      const location = getDisplayLocationFromAddress(profile?.suburb ?? form.suburb, profile?.postcode ?? form.postcode);
      window.localStorage.setItem('fairshare.location', location);
      window.localStorage.setItem('fairshare.activeRole', role);
      window.dispatchEvent(new Event('fairshare-location-change'));
      if (profile?.full_name ?? form.fullName) window.localStorage.setItem('fairshare.fullName', profile?.full_name ?? form.fullName);
      if (profile?.electricity_provider ?? form.electricityProvider) window.localStorage.setItem('fairshare.electricityProvider', profile?.electricity_provider ?? form.electricityProvider);
      if (profile?.electricity_plan ?? form.electricityPlan) window.localStorage.setItem('fairshare.electricityPlan', profile?.electricity_plan ?? form.electricityPlan);
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
        <Link href="/" className="landing-brand"><BrandMark className="landing-brand-mark" /><span><b>Fair<span>Share</span></b><small>Local energy. Shared future.</small></span></Link>
        <div className="landing-location"><span aria-hidden="true" /> {displayLocation}</div>
      </header>
      <section className="landing-shell">
        <div className="landing-copy">
          <p className="landing-kicker">Wollongong community energy</p>
          <h1>Buy or share local solar with FairShare.</h1>
          <p>Connect with local energy, track your savings, and manage everything from one simple account.</p>
        </div>
        <section className="account-panel">
          <div className="account-heading"><p>{roleLabel} account</p><h2>{isSignup ? `Create your ${role} account` : `${roleLabel} log in`}</h2></div>
          <form className="account-form" onSubmit={handleSubmit}>
            {isSignup && <>
              <label>Full name<input autoComplete="name" value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} required /></label>
              <label>Street address<input autoComplete="street-address" value={form.addressLine} onChange={(event) => updateField('addressLine', event.target.value)} required /></label>
              <div className="form-grid"><label>Suburb<input value={form.suburb} onChange={(event) => updateField('suburb', event.target.value)} required /></label><label>Postcode<input inputMode="numeric" value={form.postcode} onChange={(event) => updateField('postcode', event.target.value)} required /></label></div>
              <div className="form-grid"><label>Electricity provider<select value={form.electricityProvider} onChange={(event) => updateField('electricityProvider', event.target.value)} required><option value="">Choose provider</option><option>EnergyAustralia</option><option>Origin Energy</option><option>AGL</option><option>Red Energy</option><option>Other retailer</option></select></label><label>Electricity plan<input placeholder="e.g. Flexi Plan" value={form.electricityPlan} onChange={(event) => updateField('electricityPlan', event.target.value)} required /></label></div>
            </>}
            <label>Email<input type="email" autoComplete="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required /></label>
            <label>Password<input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => updateField('password', event.target.value)} required /></label>
            {message && <p className="account-message">{message}</p>}
            <button className="account-submit" type="submit" disabled={submitting}>{submitting ? 'Please wait...' : isSignup ? `Create ${role} account` : `Log in as ${role}`}</button>
          </form>
          <nav className="account-links" aria-label="Account options">
            {role === 'buyer' && mode === 'login' && <><span>New to FairShare? <Link href="/create-account">Create a buyer account</Link></span><span>Have solar to share? <Link href="/seller-login">Seller log in</Link></span></>}
            {role === 'buyer' && mode === 'signup' && <><span>Already have an account? <Link href="/">Buyer log in</Link></span><span>Want to sell solar? <Link href="/seller-login">Seller log in</Link></span></>}
            {role === 'seller' && mode === 'login' && <><span>New seller? <Link href="/seller-create-account">Create a seller account</Link></span><span>Buying local energy? <Link href="/">Buyer log in</Link></span></>}
            {role === 'seller' && mode === 'signup' && <><span>Already registered? <Link href="/seller-login">Seller log in</Link></span><span>Buying local energy? <Link href="/">Buyer log in</Link></span></>}
          </nav>
        </section>
      </section>
    </main>
  );
}

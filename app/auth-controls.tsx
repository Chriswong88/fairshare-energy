'use client';

import {useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {apiFetch} from '@/lib/api-client';

export default function AuthControls() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const isDashboard = pathname.startsWith('/renter') || pathname.startsWith('/seller');

  if (!isDashboard) return null;

  async function handleLogout() {
    setSigningOut(true);
    try {
      await apiFetch('/api/auth/logout', {method: 'POST'});
    } finally {
      ['activeRole', 'fullName', 'location', 'electricityProvider', 'electricityPlan'].forEach((key) => {
        window.localStorage.removeItem(`fairshare.${key}`);
      });
      router.replace('/');
    }
  }

  return (
    <button className="global-logout-button" type="button" onClick={handleLogout} disabled={signingOut}>
      {signingOut ? 'Logging out...' : 'Log out'}
    </button>
  );
}

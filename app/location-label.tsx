'use client';

import {useSyncExternalStore} from 'react';

export function getDisplayLocationFromAddress(suburb?: string, postcode?: string) {
  const cleanSuburb = suburb?.trim();
  const cleanPostcode = postcode?.trim();

  if (cleanSuburb && cleanPostcode) {
    return `${cleanSuburb}, NSW ${cleanPostcode}`;
  }

  if (cleanSuburb) {
    return `${cleanSuburb}, NSW`;
  }

  return 'Wollongong, NSW';
}

export default function LocationLabel() {
  const location = useSyncExternalStore(
    subscribeToLocationChanges,
    getStoredLocation,
    getDefaultLocation,
  );

  return <>{location}</>;
}

function getDefaultLocation() {
  return 'Wollongong, NSW';
}

function getStoredLocation() {
  if (typeof window === 'undefined') {
    return getDefaultLocation();
  }

  return window.localStorage.getItem('fairshare.location') ?? getDefaultLocation();
}

function subscribeToLocationChanges(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener('fairshare-location-change', onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener('fairshare-location-change', onStoreChange);
  };
}

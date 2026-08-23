'use client';

import {useEffect, useState} from 'react';

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
  const [location, setLocation] = useState('Wollongong, NSW');

  useEffect(() => {
    setLocation(window.localStorage.getItem('fairshare.location') ?? 'Wollongong, NSW');
  }, []);

  return <>{location}</>;
}

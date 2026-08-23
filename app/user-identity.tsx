'use client';

import {useEffect, useState} from 'react';

let nameRequest: Promise<string | null> | null = null;

function requestName() {
  if (!nameRequest) {
    nameRequest = fetch('/api/me')
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json() as {profile?: {full_name?: string} | null};
        const name = data.profile?.full_name?.trim() || null;
        if (name) {
          window.localStorage.setItem('fairshare.fullName', name);
        }
        return name;
      })
      .catch(() => null)
      .finally(() => { nameRequest = null; });
  }
  return nameRequest;
}

export default function UserName({fallback = 'Account holder', first = false}: {fallback?: string; first?: boolean}) {
  const [name, setName] = useState(fallback);
  useEffect(() => {
    Promise.resolve().then(() => {
      const localName = window.localStorage.getItem('fairshare.fullName')?.trim();
      if (localName) setName(localName);
    });
    requestName().then((profileName) => { if (profileName) setName(profileName); });
  }, []);
  return <>{first ? name.split(/\s+/)[0] : name}</>;
}

export function UserInitials({fallback = 'U'}: {fallback?: string}) {
  const [name, setName] = useState('');
  useEffect(() => {
    Promise.resolve().then(() => setName(window.localStorage.getItem('fairshare.fullName')?.trim() ?? ''));
    requestName().then((profileName) => { if (profileName) setName(profileName); });
  }, []);
  if (!name) return <>{fallback}</>;
  return <>{name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}</>;
}

# FairShare Energy Backend

This folder contains the planned Supabase backend structure for FairShare Energy.

## Chosen Backend

- Supabase Auth for account creation, login, logout, and sessions.
- Supabase Postgres for app data.
- One account can use both roles: renter and seller.
- Role switching should change the active portal, not create a second account.

## Environment Variables

Create `.env.local` when backend integration begins:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not commit `.env.local`.

## Structure

```text
backend/
  README.md
  supabase/
    migrations/
      0001_initial_schema.sql

lib/
  backend/
    api-response.ts
    roles.ts
  supabase/
    database.types.ts
    env.ts

app/api/
  auth/
    signup/route.ts
    login/route.ts
    logout/route.ts
  me/route.ts
```

## Next Implementation Steps

1. Install Supabase client:

```powershell
npm install @supabase/supabase-js
```

2. Create the Supabase project.
3. Add `.env.local`.
4. Run the SQL in `backend/supabase/migrations/0001_initial_schema.sql`.
5. Replace placeholder API route responses with real Supabase calls.
6. Add `/signup` and `/login` pages.
7. Protect renter and seller pages using the logged-in session.

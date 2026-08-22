# FairShare Energy Backend

This folder contains the planned Supabase backend structure for FairShare Energy.

## Chosen Backend

- Supabase Auth for account creation, login, logout, and sessions.
- Supabase Postgres for app data.
- One account can use both roles: buyer and seller.
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

1. Create the Supabase project.
2. Add `.env.local` using `.env.example` as the template.
3. Run the SQL in `backend/supabase/migrations/0001_initial_schema.sql`.
4. Use the API routes in `app/api/auth/*` for signup, login, and logout.
5. Use `GET /api/me` to read the current logged-in user and profile.
6. Add `/signup` and `/login` pages.
7. Protect buyer/renter and seller pages using the logged-in session.

## API Routes

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/me
```

Signup creates one Supabase Auth user, one `profiles` row, and both buyer/seller role profile rows. The selected signup role becomes `active_role`, but the same account can use both portals.

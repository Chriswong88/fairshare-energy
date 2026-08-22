# FairShare Energy

FairShare Energy is a community energy marketplace for buyers and solar sellers. The frontend is built with Next/Vinext, and the backend is wired for Supabase Auth and Supabase Postgres.

## Requirements

- Node.js `>=22.13.0`
- npm or pnpm
- Supabase project

Check Node:

```powershell
node --version
```

## Install Dependencies

This repo has a `pnpm-lock.yaml`, so pnpm is preferred:

```powershell
pnpm install
```

You can also try npm:

```powershell
npm install
```

If npm fails because of workspace dependencies, use pnpm.

## Environment Variables

Create `.env.local` in the root folder:

```powershell
copy .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Find these in Supabase:

```text
Supabase Dashboard -> Project Settings -> API
```

Use:

- `Project URL` for `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key for `SUPABASE_SERVICE_ROLE_KEY`

Do not commit `.env.local`. It is ignored by Git. `.env.example` is safe to commit.

## Supabase Database Setup

Open Supabase SQL Editor and run the full schema from:

```text
backend/supabase/migrations/0001_initial_schema.sql
```

After running it, Supabase Table Editor should show:

```text
profiles
buyer_profiles
seller_profiles
seller_listings
transactions
payment_methods
```

The app uses one account with both buyer and seller access. The selected signup role is stored as `profiles.active_role`.

## Run Frontend And Backend Locally

Start the dev server:

```powershell
pnpm dev
```

Or:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

If the terminal prints a different port, use that port instead.

The API routes run on the same localhost server:

```text
POST http://localhost:3000/api/auth/signup
POST http://localhost:3000/api/auth/login
POST http://localhost:3000/api/auth/logout
GET  http://localhost:3000/api/me
```

Restart the dev server after editing `.env.local`.

## Test Backend Signup

Buyer test:

```powershell
Invoke-WebRequest -UseBasicParsing -Method POST "http://localhost:3000/api/auth/signup" -ContentType "application/json" -Body '{"email":"buyer.test1@example.com","password":"Password123!","fullName":"Mia Carter","addressLine":"18 Market Street","suburb":"Wollongong","postcode":"2500","activeRole":"buyer"}'
```

Seller test:

```powershell
Invoke-WebRequest -UseBasicParsing -Method POST "http://localhost:3000/api/auth/signup" -ContentType "application/json" -Body '{"email":"seller.test1@example.com","password":"Password123!","fullName":"Noah Singh","addressLine":"7 Harbour Road","suburb":"North Wollongong","postcode":"2500","activeRole":"seller"}'
```

After successful signup, check:

```text
Supabase Dashboard -> Authentication -> Users
Supabase Dashboard -> Table Editor -> profiles
Supabase Dashboard -> Table Editor -> buyer_profiles
Supabase Dashboard -> Table Editor -> seller_profiles
```

## Test Backend Login

```powershell
$response = Invoke-WebRequest -UseBasicParsing -Method POST "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body '{"email":"buyer.test1@example.com","password":"Password123!"}'
$response.StatusCode
$response.Content
```

## Useful Scripts

```powershell
pnpm dev      # run local app
pnpm build    # production build
pnpm start    # start built app
pnpm lint     # lint code
```

npm equivalents:

```powershell
npm run dev
npm run build
npm run start
npm run lint
```

## Stop Localhost

In the terminal running the app:

```text
Ctrl + C
```

If PowerShell asks `Terminate batch job (Y/N)?`, type `Y` and press Enter.

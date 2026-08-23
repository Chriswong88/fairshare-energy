import {NextRequest, NextResponse} from 'next/server';
import {badRequest, serverError, unauthorized} from '@/lib/backend/api-response';
import {getAccessToken} from '@/lib/backend/auth-cookies';
import {createSupabaseAnonClient, createSupabaseUserClient} from '@/lib/supabase/server';

type ListingPayload = {
  quantityKwh?: unknown;
  pricePerKwhCents?: unknown;
  listingType?: unknown;
  availableFrom?: unknown;
  availableUntil?: unknown;
};

const listingTypes = ['sale', 'donation', 'fairshare'];

export async function GET(request: NextRequest) {
  const session = await getSession(request);

  if ('response' in session) {
    return session.response;
  }

  const {data, error} = await session.userClient
    .from('seller_listings')
    .select('*')
    .eq('seller_id', session.userId)
    .neq('status', 'cancelled')
    .order('created_at', {ascending: false});

  if (error) {
    return serverError(error.message);
  }

  return NextResponse.json({listings: data ?? []});
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);

  if ('response' in session) {
    return session.response;
  }

  let payload: ReturnType<typeof parsePayload>;

  try {
    payload = parsePayload(await request.json());
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid listing request.');
  }

  const {data, error} = await session.userClient
    .from('seller_listings')
    .insert({
      seller_id: session.userId,
      quantity_kwh: payload.quantityKwh,
      price_per_kwh_cents: payload.pricePerKwhCents,
      listing_type: payload.listingType,
      status: 'active',
      available_from: payload.availableFrom,
      available_until: payload.availableUntil,
    })
    .select('*')
    .single();

  if (error) {
    return serverError(error.message);
  }

  return NextResponse.json({listing: data});
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request);

  if ('response' in session) {
    return session.response;
  }

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return badRequest('Listing id is required.');
  }

  const {error} = await session.userClient
    .from('seller_listings')
    .update({status: 'cancelled', updated_at: new Date().toISOString()})
    .eq('id', id)
    .eq('seller_id', session.userId);

  if (error) {
    return serverError(error.message);
  }

  return NextResponse.json({ok: true});
}

async function getSession(request: NextRequest) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return {response: unauthorized()};
  }

  const supabase = createSupabaseAnonClient();
  const {data, error} = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return {response: unauthorized(error?.message ?? 'Invalid session.')};
  }

  return {
    userId: data.user.id,
    userClient: createSupabaseUserClient(accessToken),
  };
}

function parsePayload(payload: ListingPayload) {
  const quantityKwh = Number(payload.quantityKwh);
  const pricePerKwhCents = Number(payload.pricePerKwhCents ?? 12);
  const listingType = typeof payload.listingType === 'string' ? payload.listingType : 'sale';
  const availableFrom = parseDate(payload.availableFrom, 'availableFrom');
  const availableUntil = parseDate(payload.availableUntil, 'availableUntil');

  if (!Number.isFinite(quantityKwh) || quantityKwh <= 0) {
    throw new Error('Quantity must be greater than 0 kWh.');
  }

  if (!Number.isInteger(pricePerKwhCents) || pricePerKwhCents < 0) {
    throw new Error('Price must be a whole number of cents per kWh.');
  }

  if (!listingTypes.includes(listingType)) {
    throw new Error('Listing type must be sale, donation, or fairshare.');
  }

  if (availableUntil < availableFrom) {
    throw new Error('End date must be after the start date.');
  }

  return {
    quantityKwh,
    pricePerKwhCents,
    listingType: listingType as 'sale' | 'donation' | 'fairshare',
    availableFrom,
    availableUntil,
  };
}

function parseDate(value: unknown, field: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must be a date in YYYY-MM-DD format.`);
  }

  return `${value}T00:00:00.000Z`;
}

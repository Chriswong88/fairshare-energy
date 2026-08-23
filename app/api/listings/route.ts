import {NextRequest, NextResponse} from 'next/server';
import {badRequest, serverError} from '@/lib/backend/api-response';
import {parseListingInput, type ListingInput} from '@/lib/backend/listing-validation';
import {requireSession} from '@/lib/backend/session';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);

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
  const session = await requireSession(request);

  if ('response' in session) {
    return session.response;
  }

  let values: ReturnType<typeof parseListingInput>;

  try {
    values = parseListingInput((await request.json()) as ListingInput);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid listing request.');
  }

  const {data, error} = await session.userClient
    .from('seller_listings')
    .insert({
      seller_id: session.userId,
      ...values,
      status: 'active',
    })
    .select('*')
    .single();

  if (error) {
    return serverError(error.message);
  }

  return NextResponse.json({listing: data});
}

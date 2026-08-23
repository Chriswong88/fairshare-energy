import {NextRequest, NextResponse} from 'next/server';
import {badRequest, notFound, serverError} from '@/lib/backend/api-response';
import {parseListingInput, type ListingInput} from '@/lib/backend/listing-validation';
import {requireSession} from '@/lib/backend/session';

type Context = {params: Promise<{id: string}>};

export async function GET(request: NextRequest, context: Context) {
  const session = await requireSession(request);
  if ('response' in session) return session.response;
  const {id} = await context.params;
  const {data, error} = await session.userClient.from('seller_listings').select('*')
    .eq('id', id).eq('seller_id', session.userId).maybeSingle();
  if (error) return serverError(error.message);
  return data ? NextResponse.json({listing: data}) : notFound('Listing not found.');
}

export async function PATCH(request: NextRequest, context: Context) {
  const session = await requireSession(request);
  if ('response' in session) return session.response;
  const {id} = await context.params;
  let values: ReturnType<typeof parseListingInput>;
  try {
    values = parseListingInput((await request.json()) as ListingInput, true);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid listing request.');
  }
  const {data, error} = await session.userClient.from('seller_listings')
    .update({...values, updated_at: new Date().toISOString()})
    .eq('id', id).eq('seller_id', session.userId)
    .not('status', 'in', '(cancelled,completed)').select('*').maybeSingle();
  if (error) return serverError(error.message);
  return data ? NextResponse.json({listing: data}) : notFound('Editable listing not found.');
}

export async function DELETE(request: NextRequest, context: Context) {
  const session = await requireSession(request);
  if ('response' in session) return session.response;
  const {id} = await context.params;
  const {data, error} = await session.userClient.from('seller_listings')
    .update({status: 'cancelled', updated_at: new Date().toISOString()})
    .eq('id', id).eq('seller_id', session.userId)
    .not('status', 'eq', 'completed').select('id').maybeSingle();
  if (error) return serverError(error.message);
  return data ? NextResponse.json({ok: true}) : notFound('Cancellable listing not found.');
}

import {NextResponse} from 'next/server';

export function notImplemented(feature: string) {
  return NextResponse.json(
    {
      error: 'Not implemented',
      feature,
      nextStep: 'Wire this route to Supabase Auth and Supabase Postgres.',
    },
    {status: 501},
  );
}

export function badRequest(message: string) {
  return NextResponse.json({error: message}, {status: 400});
}

export function unauthorized(message = 'Authentication required') {
  return NextResponse.json({error: message}, {status: 401});
}

export function serverError(message = 'Unexpected server error') {
  return NextResponse.json({error: message}, {status: 500});
}

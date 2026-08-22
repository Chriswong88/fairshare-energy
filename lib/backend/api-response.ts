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

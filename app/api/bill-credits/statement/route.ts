import {NextRequest, NextResponse} from 'next/server';
import {getAccessToken} from '@/lib/backend/auth-cookies';
import {buildBillCredits} from '@/lib/bill-credits';
import {createStatementPdf} from '@/lib/pdf-statement';
import {createSupabaseAnonClient, createSupabaseUserClient} from '@/lib/supabase/server';
import type {EnergyTransaction} from '@/lib/supabase/database.types';

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);
  if (!accessToken) return NextResponse.json({error: 'Sign in to download your statement.'}, {status: 401});

  const authClient = createSupabaseAnonClient();
  const {data: authData, error: authError} = await authClient.auth.getUser(accessToken);
  if (authError || !authData.user) return NextResponse.json({error: 'Your session has expired. Please sign in again.'}, {status: 401});

  const {data, error} = await createSupabaseUserClient(accessToken)
    .from('transactions')
    .select('*')
    .eq('seller_id', authData.user.id)
    .in('status', ['pending', 'completed'])
    .order('created_at', {ascending: false});

  if (error) return NextResponse.json({error: error.message}, {status: 500});

  const credits = buildBillCredits((data ?? []) as EnergyTransaction[]);
  const pdf = createStatementPdf(credits);
  const filename = `fairshare-statement-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new NextResponse(pdf, {headers: {'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store'}});
}

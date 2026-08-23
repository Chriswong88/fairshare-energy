import {NextRequest,NextResponse} from 'next/server';
import {badRequest,serverError} from '@/lib/backend/api-response';
import {requireSession} from '@/lib/backend/session';

export async function GET(request:NextRequest){
  const session=await requireSession(request);if('response'in session)return session.response;
  const month=request.nextUrl.searchParams.get('month')??new Date().toISOString().slice(0,7);
  if(!/^\d{4}-\d{2}$/.test(month))return badRequest('Month must use YYYY-MM format.');
  const start=`${month}-01`,next=new Date(`${start}T00:00:00Z`);next.setUTCMonth(next.getUTCMonth()+1);const end=next.toISOString().slice(0,10);
  const [p,u]=await Promise.all([
    session.userClient.from('buyer_energy_purchases').select('*').eq('buyer_id',session.userId).gte('purchased_at',`${start}T00:00:00Z`).lt('purchased_at',`${end}T00:00:00Z`).neq('status','cancelled').order('purchased_at',{ascending:false}),
    session.userClient.from('buyer_energy_usage').select('*').eq('buyer_id',session.userId).gte('usage_date',start).lt('usage_date',end).order('usage_date',{ascending:true})]);
  const error=p.error??u.error;if(error)return serverError(error.message);return NextResponse.json(summarize(month,p.data??[],u.data??[]));
}
export async function POST(request:NextRequest){
  const session=await requireSession(request);if('response'in session)return session.response;
  const b=await request.json().catch(()=>null) as Record<string,unknown>|null;if(!b)return badRequest('Invalid purchase request.');
  const quantity=Number(b.quantityKwh),price=Number(b.pricePerKwhCents),standard=Number(b.standardRateCents);
  if(!String(b.sellerName??'').trim()||!String(b.sellerSuburb??'').trim()||!Number.isFinite(quantity)||quantity<=0)return badRequest('Purchase details are invalid.');
  const {data,error}=await session.userClient.from('buyer_energy_purchases').insert({buyer_id:session.userId,offer_id:String(b.offerId??''),seller_name:String(b.sellerName),seller_suburb:String(b.sellerSuburb),quantity_kwh:quantity,price_per_kwh_cents:price,standard_rate_cents:standard,status:'matched'}).select('*').single();
  if(error)return serverError(error.message);return NextResponse.json({purchase:data},{status:201});
}
function summarize(month:string,purchases:Record<string,unknown>[],usage:Record<string,unknown>[]){
  const local=purchases.reduce((s,r)=>s+Number(r.quantity_kwh),0),metered=usage.reduce((s,r)=>s+Number(r.total_kwh),0),total=Math.max(local,metered),grid=Math.max(total-local,0);
  const savings=Math.round(purchases.reduce((s,r)=>s+Number(r.quantity_kwh)*(Number(r.standard_rate_cents)-Number(r.price_per_kwh_cents)),0));
  const avg=local?purchases.reduce((s,r)=>s+Number(r.quantity_kwh)*Number(r.price_per_kwh_cents),0)/local:0;
  return{month,purchases,usage,summary:{localEnergyKwh:local,gridEnergyKwh:grid,totalUsageKwh:total,savingsCents:savings,sellerCount:new Set(purchases.map(r=>`${r.seller_name}|${r.seller_suburb}`)).size,averageLocalRateCents:Math.round(avg*10)/10,coveragePercent:total?Math.round(local/total*100):0}};
}

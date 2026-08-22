export type Listing={id:number;title:string;detail:string;result:string;kind:'sale'|'donation'};
export const LISTINGS_KEY='fairshare-seller-listings';
export const DEFAULT_LISTINGS:Listing[]=[
  {id:1,title:'8.0 kWh for sale',detail:'14¢/kWh · Live until 5pm',result:'3.6 kWh sold',kind:'sale'},
  {id:2,title:'4.0 kWh donation',detail:'FairShare allocation · Matching',result:'4 requests',kind:'donation'}
];
export function loadListings():Listing[]{
  if(typeof window==='undefined')return DEFAULT_LISTINGS;
  const saved=window.localStorage.getItem(LISTINGS_KEY);
  if(!saved)return DEFAULT_LISTINGS;
  try{return JSON.parse(saved) as Listing[]}catch{return DEFAULT_LISTINGS}
}
export function saveListings(listings:Listing[]){
  window.localStorage.setItem(LISTINGS_KEY,JSON.stringify(listings));
}

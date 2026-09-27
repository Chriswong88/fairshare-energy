export default function BrandMark({className = ''}: {className?: string}) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="FairShare Energy logo">
      <defs>
        <linearGradient id="fairshare-leaf" x1="10" y1="52" x2="51" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0b7440" />
          <stop offset="1" stopColor="#58bd55" />
        </linearGradient>
      </defs>
      <circle cx="42" cy="20" r="11" fill="#ffc629" />
      <path d="M9 48c7-18 23-27 43-24-3 20-17 31-39 29L9 48Z" fill="url(#fairshare-leaf)" />
      <path d="M15 49c11-4 20-11 29-20" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 38 43 49H27l5-11Z" fill="#0a57c9" />
    </svg>
  );
}

'use client';

interface NavButtonsProps {
  address: string;
  label?: string;
  compact?: boolean;
}

export default function NavButtons({ address, label, compact = false }: NavButtonsProps) {
  const encoded  = encodeURIComponent(address);
  const wazeUrl  = `https://waze.com/ul?q=${encoded}&navigate=yes`;
  const gmapsUrl = `https://maps.google.com/?q=${encoded}`;

  if (compact) {
    return (
      <div className="flex gap-1.5">
        <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
           className="flex h-9 w-9 items-center justify-center rounded-full text-sm transition active:opacity-70"
           style={{ backgroundColor: '#E0F5FF', color: '#00A0DC' }}
           title="Waze">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 2.8.97 5.38 2.58 7.4L1.2 22.8l3.7-1.2C6.8 22.9 9.3 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0zm-3 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-6.3 5c.26 1.38 1.47 2.4 2.9 2.4h.8c1.43 0 2.64-1.02 2.9-2.4H8.7z"/>
          </svg>
        </a>
        <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
           className="flex h-9 w-9 items-center justify-center rounded-full text-sm transition active:opacity-70"
           style={{ backgroundColor: '#EEF2FF', color: '#1A73E8' }}
           title="Google Maps">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-2">
      <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
         className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition active:opacity-70"
         style={{ borderColor: '#B3E5F8', color: '#00A0DC', backgroundColor: '#F0FAFF' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 2.8.97 5.38 2.58 7.4L1.2 22.8l3.7-1.2C6.8 22.9 9.3 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0zm-3 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-6.3 5c.26 1.38 1.47 2.4 2.9 2.4h.8c1.43 0 2.64-1.02 2.9-2.4H8.7z"/>
        </svg>
        Waze
      </a>
      <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
         className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition active:opacity-70"
         style={{ borderColor: '#C5D8FC', color: '#1A73E8', backgroundColor: '#F0F4FF' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        {label ?? 'מפות'}
      </a>
    </div>
  );
}

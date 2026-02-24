'use client';

interface NavButtonsProps {
  address: string;
  label?: string;
}

export default function NavButtons({ address, label }: NavButtonsProps) {
  const encoded = encodeURIComponent(address);
  const wazeUrl = `https://waze.com/ul?q=${encoded}&navigate=yes`;
  const gmapsUrl = `https://maps.google.com/?q=${encoded}`;

  return (
    <div className="mt-2 flex gap-2">
      <a
        href={wazeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition active:opacity-70"
        style={{ borderColor: '#60C0E8', color: '#00A0DC', backgroundColor: '#F0FAFF' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 2.8.97 5.38 2.58 7.4L1.2 22.8l3.7-1.2C6.8 22.9 9.3 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0zm0 2c5.5 0 10 4.5 10 10S17.5 22 12 22c-2.4 0-4.6-.85-6.32-2.25l-.28-.22-2.2.72.7-2.1-.25-.3A9.93 9.93 0 0 1 2 12C2 6.5 6.5 2 12 2zm-3 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-6.3 5c.26 1.38 1.47 2.4 2.9 2.4h.8c1.43 0 2.64-1.02 2.9-2.4H8.7z"/>
        </svg>
        Waze
      </a>
      <a
        href={gmapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition active:opacity-70"
        style={{ borderColor: '#AECBFA', color: '#1A73E8', backgroundColor: '#F0F4FF' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        {label ?? 'Google Maps'}
      </a>
    </div>
  );
}

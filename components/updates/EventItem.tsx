type Event = {
  id: string;
  type: string;
  message_he: string;
  created_at: string;
};

type Props = {
  event: Event;
};

export default function EventItem({ event }: Props) {
  const d = new Date(event.created_at);
  const dateLabel = d.toLocaleString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{dateLabel}</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FBE4F0] text-[#91006A] font-medium">
          {event.type}
        </span>
      </div>
      <p className="text-sm text-slate-800 text-right leading-relaxed whitespace-pre-line">
        {event.message_he}
      </p>
    </div>
  );
}


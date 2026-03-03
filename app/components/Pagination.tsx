type PaginationProps = {
  page: number;
  total: number;
  perPage: number;
  makeHref: (page: number) => string;
};

export default function Pagination({ page, total, perPage, makeHref }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-1" dir="rtl">
      {page > 1 && (
        <a
          href={makeHref(page - 1)}
          className="rounded-full px-4 py-2 text-sm font-medium transition"
          style={{ backgroundColor: '#FBE4F0', color: 'var(--brand)' }}
        >
          ← הקודם
        </a>
      )}
      <span className="text-sm" style={{ color: '#7C365F' }}>
        עמוד {page} מתוך {totalPages}
      </span>
      {page < totalPages && (
        <a
          href={makeHref(page + 1)}
          className="rounded-full px-4 py-2 text-sm font-medium transition"
          style={{ backgroundColor: '#FBE4F0', color: 'var(--brand)' }}
        >
          הבא →
        </a>
      )}
    </div>
  );
}


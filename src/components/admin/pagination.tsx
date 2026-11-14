"use client";

import { cn } from "@/lib/format";

export function Pagination({
  page,
  lastPage,
  total,
  onPage,
  busy,
}: {
  page: number;
  lastPage: number;
  total: number;
  onPage: (page: number) => void;
  busy?: boolean;
}) {
  if (lastPage <= 1) {
    return <p className="text-xs text-ink-600">{total} item{total === 1 ? "" : "s"}</p>;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-warm pt-4">
      <p className="text-xs text-ink-600">
        {total} item{total === 1 ? "" : "s"} · page {page} of {lastPage}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1 || busy}
          onClick={() => onPage(page - 1)}
          className={cn(
            "inline-flex h-9 items-center rounded-full border border-border-warm px-4 text-xs font-semibold transition hover:border-ink-900/30 disabled:opacity-40",
          )}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= lastPage || busy}
          onClick={() => onPage(page + 1)}
          className="inline-flex h-9 items-center rounded-full border border-border-warm px-4 text-xs font-semibold transition hover:border-ink-900/30 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

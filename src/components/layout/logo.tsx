"use client";

import Link from "next/link";
import { cn } from "@/lib/format";
import { useSettings } from "@/providers/settings-provider";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { settings } = useSettings();
  const name = settings.restaurant_name || "Vanilla & Strawberry";

  return (
    <Link href="/" className={cn("group inline-flex flex-col leading-none text-ink-900", className)} aria-label={`${name} home`}>
      <span className="font-display text-[1.35rem] tracking-[-0.03em] sm:text-2xl">
        {name.split(/(&)/).map((part, index) =>
          part === "&" ? (
            <span key={`${part}-${index}`} className="text-strawberry-500">
              &amp;
            </span>
          ) : (
            <span key={`${part}-${index}`}>{part}</span>
          ),
        )}
      </span>
      {!compact ? (
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-ink-600">
          Gelateria · Brooklyn
        </span>
      ) : null}
    </Link>
  );
}

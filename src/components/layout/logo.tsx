import Link from "next/link";
import { cn } from "@/lib/format";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex flex-col leading-none text-ink-900", className)}
      aria-label="Vanilla & Strawberry home"
    >
      <span className="font-display text-[1.35rem] tracking-[-0.03em] sm:text-2xl">
        Vanilla <span className="text-strawberry-500">&amp;</span> Strawberry
      </span>
      {!compact ? (
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-ink-600">
          Gelateria · Brooklyn
        </span>
      ) : null}
    </Link>
  );
}

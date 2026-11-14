"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/format";

export function CentsInput({
  id,
  value,
  onChange,
  className,
  disabled,
}: {
  id?: string;
  value: number;
  onChange: (cents: number) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState((value / 100).toFixed(2));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setText((value / 100).toFixed(2));
    }
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-600">$</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        disabled={disabled}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          const parsed = Number.parseFloat(text || "0");
          const cents = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0;
          onChange(cents);
          setText((cents / 100).toFixed(2));
        }}
        onChange={(event) => {
          const next = event.target.value.replace(/[^0-9.]/g, "");
          setText(next);
          const parsed = Number.parseFloat(next);
          if (Number.isFinite(parsed)) {
            onChange(Math.max(0, Math.round(parsed * 100)));
          }
        }}
        className="w-full rounded-xl border border-border-warm bg-vanilla-0 py-2.5 pl-8 pr-4 text-sm text-ink-900 transition focus:border-strawberry-500 focus:outline-none focus:ring-2 focus:ring-strawberry-500/20 disabled:opacity-60"
      />
    </div>
  );
}

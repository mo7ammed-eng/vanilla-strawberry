import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-warm bg-vanilla-0/60 px-6 py-16 text-center",
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-strawberry-50 text-strawberry-600">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-xl">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-600">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

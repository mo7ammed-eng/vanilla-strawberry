import { cn } from "@/lib/format";

export function AdminThumb({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "h-12 w-12 shrink-0 rounded-lg border border-border-warm bg-vanilla-100 bg-cover bg-center",
        className,
      )}
      style={src ? { backgroundImage: `url("${src.replace(/"/g, "%22")}")` } : undefined}
    />
  );
}

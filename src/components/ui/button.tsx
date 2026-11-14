import { Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-strawberry-500 text-vanilla-0 hover:bg-strawberry-700 active:bg-strawberry-700 shadow-soft",
  secondary:
    "border border-ink-900/15 bg-transparent text-ink-900 hover:border-ink-900/35 hover:bg-vanilla-100",
  ghost: "text-ink-700 hover:bg-vanilla-100 hover:text-ink-900",
  danger: "bg-danger text-vanilla-0 hover:bg-strawberry-700",
  soft: "bg-strawberry-100 text-strawberry-700 hover:bg-strawberry-100/70",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-sm",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[0.01em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

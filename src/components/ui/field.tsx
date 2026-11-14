import { cn } from "@/lib/format";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-700">
        {label}
        {required ? <span className="ml-1 text-strawberry-600">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink-600">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-xl border border-border-warm bg-vanilla-0 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/70 transition focus:border-strawberry-500 focus:outline-none focus:ring-2 focus:ring-strawberry-500/20 disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "appearance-none pr-10", className)} {...props}>
      {children}
    </select>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-danger/25 bg-strawberry-50 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}

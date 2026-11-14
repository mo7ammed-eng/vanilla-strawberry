import Image from "next/image";
import { Logo } from "@/components/layout/logo";

export function AuthShell({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="grid overflow-hidden rounded-[2rem] border border-border-warm bg-vanilla-0 lg:grid-cols-2">
        <div className="relative hidden min-h-[42rem] lg:block">
          <Image src={image} alt={imageAlt} fill priority sizes="50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-vanilla-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-vanilla-200">
              Small batch · Brooklyn
            </p>
            <p className="mt-3 max-w-sm font-display text-3xl leading-tight text-vanilla-0">
              A little sweetness, made slowly and shared often.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
          <Logo />
          <div className="mt-10">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-3 text-h2">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{description}</p>
          </div>
          <div className="mt-7">{children}</div>
          <div className="mt-6 text-sm text-ink-600">{footer}</div>
        </div>
      </div>
    </div>
  );
}

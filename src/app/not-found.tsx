import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-strawberry-50 text-strawberry-700">
        <UtensilsCrossed className="h-6 w-6" />
      </span>
      <p className="eyebrow mt-6">404</p>
      <h1 className="mt-2 text-h2">This scoop has melted away.</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-600">
        The page you were looking for is not on the menu. Head back to the parlour, or start with
        something sweet.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClasses("primary", "md")}>
          Back to the restaurant
        </Link>
        <Link href="/menu" className={buttonClasses("secondary", "md")}>
          Browse the menu
        </Link>
      </div>
    </div>
  );
}

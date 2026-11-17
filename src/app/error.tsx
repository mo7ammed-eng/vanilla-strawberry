"use client";

import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-strawberry-50 text-danger">
        <TriangleAlert className="h-6 w-6" />
      </span>
      <p className="eyebrow mt-6">Something went wrong</p>
      <h1 className="mt-2 text-h2">We dropped the scoop.</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-600">
        This page could not finish loading. Try again, or head back to the restaurant while we tidy
        up.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
        <Link href="/" className={buttonClasses("secondary", "md")}>
          Back to the restaurant
        </Link>
      </div>
    </div>
  );
}

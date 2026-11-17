import { Skeleton } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="container-page py-16 sm:py-24" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-12 w-2/3 max-w-xl" />
      <Skeleton className="mt-3 h-4 w-1/2 max-w-md" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
        <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
        <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      </div>
    </div>
  );
}

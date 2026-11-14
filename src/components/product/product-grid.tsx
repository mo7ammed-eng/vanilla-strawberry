import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/format";

export function ProductGrid({
  products,
  className,
  columns = "four",
}: {
  products: Product[];
  className?: string;
  columns?: "three" | "four";
}) {
  return (
    <div
      className={cn(
        "grid gap-x-5 gap-y-10 sm:grid-cols-2",
        columns === "four" ? "lg:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 2} />
      ))}
    </div>
  );
}

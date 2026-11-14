"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/format";
import type { GalleryItem } from "@/lib/types";

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  useEffect(() => {
    api
      .get<GalleryItem[]>("/gallery")
      .then((response) => setItems(response.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category).filter((value): value is string => Boolean(value)))),
    [items],
  );

  const filtered = category === "all" ? items : items.filter((item) => item.category === category);

  if (loading) {
    return <PageLoader label="Opening the album" />;
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">The room</p>
        <h1 className="mt-4 text-h1">Warm light, cold spoons.</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
          A look at the counter, the courtyard, and the small details that make the ritual. Every
          image was taken in the restaurant.
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="mt-7 flex flex-wrap gap-2 border-y border-border-warm py-4">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition",
              category === "all" ? "bg-ink-900 text-vanilla-0" : "bg-vanilla-100 text-ink-600 hover:text-ink-900",
            )}
          >
            All
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition",
                category === item ? "bg-ink-900 text-vanilla-0" : "bg-vanilla-100 text-ink-600 hover:text-ink-900",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-8 rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={ImageIcon}
            title="No photographs here yet"
            description="We are still arranging this part of the album. Try another category."
          />
        </div>
      ) : (
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl bg-vanilla-100 text-left"
            >
              <div
                className={cn(
                  "relative w-full",
                  item.id % 3 === 0 ? "aspect-[3/4]" : item.id % 3 === 1 ? "aspect-square" : "aspect-[4/3]",
                )}
              >
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 48vw, 92vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-3 py-3">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.caption ? <p className="mt-0.5 text-xs text-ink-600">{item.caption}</p> : null}
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? "Gallery"}
        description={selected?.caption ?? undefined}
        size="lg"
      >
        {selected ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-vanilla-100">
            <Image
              src={selected.image_url}
              alt={selected.title}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

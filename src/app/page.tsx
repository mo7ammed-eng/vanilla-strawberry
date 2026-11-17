"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  MapPin,
  Sparkles,
  Sprout,
  ThermometerSnowflake,
} from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { buttonClasses } from "@/components/ui/button";
import { CardSkeleton, Skeleton } from "@/components/ui/spinner";
import { SectionHeading } from "@/components/ui/section-heading";
import { api, errorMessage } from "@/lib/api";
import { formatMoney, formatTime } from "@/lib/format";
import { useSettings } from "@/providers/settings-provider";
import type { HomePayload } from "@/lib/types";

export default function HomePage() {
  const [data, setData] = useState<HomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<HomePayload>("/home");
      setData(response.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayHours = settings.hours.find((entry) => entry.day === today);
  const featured = data?.collections.best.length ? data.collections.best : (data?.products.slice(0, 4) ?? []);
  const seasonal = data?.collections.new[0] ?? data?.products[0] ?? null;
  const gallery = data?.gallery.slice(0, 4) ?? [];
  const heroProduct =
    data?.products.find((product) => product.slug === "strawberry-cloud") ??
    data?.collections.best[0] ??
    data?.products[0] ??
    null;

  return (
    <>
      <section className="paper-grain relative overflow-hidden">
        <div className="container-page grid items-center gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="max-w-xl">
            <p className="eyebrow flex items-center gap-2">
              <span className="h-px w-8 bg-strawberry-500" />
              Brooklyn · Small batch since {settings.established_year}
            </p>
            <h1 className="mt-5 text-display">
              Gelato, made
              <br />
              <span className="italic text-strawberry-600">slowly.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-600 sm:text-lg">
              Fruit folded by hand, vanilla steeped overnight, and every batch churned in the
              morning. Come for a scoop; stay for the ritual.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/menu" className={buttonClasses("primary", "lg")}>
                Explore the menu
                <ArrowRight className="h-4 w-4" />
              </Link>
              {settings.reservations_enabled ? (
                <Link href="/reservations" className={buttonClasses("secondary", "lg")}>
                  Reserve a table
                </Link>
              ) : null}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-ink-600">
              <span className="inline-flex items-center gap-1.5">
                <Sprout className="h-3.5 w-3.5 text-strawberry-600" />
                Seasonal fruit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ThermometerSnowflake className="h-3.5 w-3.5 text-strawberry-600" />
                Churned daily
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-strawberry-600" />
                No shortcuts
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-vanilla-200">
              <Image
                src="/images/strawberry-cloud.jpg"
                alt="A scoop of strawberry gelato with fresh berries"
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 92vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/25 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-5 left-4 right-4 rounded-2xl border border-border-warm bg-vanilla-0/95 p-4 shadow-soft backdrop-blur sm:-left-6 sm:right-auto sm:w-72">
              <p className="eyebrow">Today at the counter</p>
              {heroProduct ? (
                <Link href={`/menu/${heroProduct.slug}`} className="group mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-lg leading-tight">{heroProduct.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-ink-600">{heroProduct.short_description}</p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{formatMoney(heroProduct.price_cents)}</span>
                </Link>
              ) : loading ? (
                <Skeleton className="mt-2 h-10 w-full" />
              ) : (
                <p className="mt-2 text-sm text-ink-600">Ask about today&apos;s batch.</p>
              )}
            </div>
            <div className="absolute -right-3 top-6 hidden rotate-3 rounded-full bg-vanilla-200 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-700 shadow-soft sm:block">
              Batch no. 114
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-border-warm bg-vanilla-0">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-600 sm:justify-between">
          <span>Churned every morning</span>
          <span className="hidden h-1 w-1 rounded-full bg-strawberry-500 sm:block" />
          <span>Real fruit, never concentrate</span>
          <span className="hidden h-1 w-1 rounded-full bg-strawberry-500 sm:block" />
          <span>Made in Brooklyn</span>
          <span className="hidden h-1 w-1 rounded-full bg-strawberry-500 sm:block" />
          <span>Dairy-free options daily</span>
        </div>
      </div>

      {error ? (
        <div className="container-page mt-10">
          <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-danger/20 bg-strawberry-50 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-danger">{error}</p>
            <button type="button" onClick={load} className={buttonClasses("secondary", "sm")}>
              Try again
            </button>
          </div>
        </div>
      ) : null}

      <section className="container-page py-20 sm:py-24">
        <SectionHeading
          eyebrow="The menu"
          title="Three ways to end the day"
          description="Our counter changes with the season. These are the families of desserts we return to, again and again."
          action={
            <Link href="/menu" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 hover:text-strawberry-600">
              See the full menu <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {loading && !data
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/5] w-full rounded-2xl" />
              ))
            : data?.categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/menu?category=${category.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-vanilla-200"
                >
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      sizes="(min-width: 640px) 30vw, 92vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-vanilla-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-vanilla-200">
                      0{index + 1} — {category.products_count ?? 0} creations
                    </span>
                    <h3 className="mt-2 font-display text-2xl text-vanilla-0">{category.name}</h3>
                    <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-vanilla-0/80">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      <section className="border-y border-border-warm bg-vanilla-0/70">
        <div className="container-page py-20 sm:py-24">
          <SectionHeading
            eyebrow="Most loved"
            title="The ones people come back for"
            description="A short list, tested by the neighbourhood. Order ahead for pickup or delivery."
            action={
              <Link href="/menu?collection=best" className={buttonClasses("secondary", "sm")}>
                Browse all
              </Link>
            }
          />
          <div className="mt-10">
            {loading && !data ? (
              <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <ProductGrid products={featured} />
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-20 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-vanilla-200">
              <Image
                src="/images/pistachio-rose.jpg"
                alt="Pistachio and rose gelato in a ceramic dish"
                fill
                sizes="(min-width: 1024px) 46vw, 92vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-2 hidden w-40 overflow-hidden rounded-xl border-4 border-vanilla-50 bg-vanilla-100 sm:block lg:-right-8 lg:w-48">
              <div className="relative aspect-square">
                <Image
                  src="/images/fig-ricotta.jpg"
                  alt="Fig and ricotta gelato"
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div className="max-w-lg">
            <p className="eyebrow">Our way</p>
            <h2 className="mt-4 text-h2">A little patience, a lot of fruit.</h2>
            <p className="mt-5 text-sm leading-relaxed text-ink-600 sm:text-base">
              We make gelato the long way: steeping, roasting, macerating, then churning in small
              batches. Nothing is rushed and nothing is hidden. If it is in the case, it was made
              here this morning.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border-warm pt-6">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">Batch size</dt>
                <dd className="mt-1 font-display text-2xl">24 litres</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">Churn time</dt>
                <dd className="mt-1 font-display text-2xl">6 hours</dd>
              </div>
            </dl>
            <Link href="/story" className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 hover:text-strawberry-600">
              Read our story <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {seasonal ? (
        <section className="container-page">
          <div className="grid overflow-hidden rounded-[2rem] bg-ink-900 text-vanilla-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-72 lg:min-h-[30rem]">
              <Image
                src={seasonal.image_url}
                alt={seasonal.name}
                fill
                sizes="(min-width: 1024px) 40vw, 92vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-vanilla-200">
                {seasonal.is_new_arrival ? "New this week" : "From the counter"}
              </p>
              <h2 className="mt-4 font-display text-h2 text-vanilla-0">{seasonal.name}</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-vanilla-0/70 sm:text-base">
                {seasonal.description}
              </p>
              <p className="mt-6 font-display text-2xl text-vanilla-0">{formatMoney(seasonal.price_cents)}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={`/menu/${seasonal.slug}`} className={buttonClasses("primary", "md")}>
                  Try it today
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/menu?collection=new" className={buttonClasses("secondary", "md", "border-vanilla-0/25 text-vanilla-0 hover:bg-vanilla-0/10 hover:border-vanilla-0/50")}>
                  See what is new
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {gallery.length > 0 ? (
        <section className="container-page py-20 sm:py-24">
          <SectionHeading
            eyebrow="The room"
            title="Warm light, cold spoons"
            action={
              <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 hover:text-strawberry-600">
                View gallery <ArrowUpRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {gallery.map((item, index) => (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-xl bg-vanilla-100 ${
                  index % 3 === 0 ? "aspect-[3/4]" : "aspect-square"
                }`}
              >
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 24vw, 46vw"
                  className="object-cover transition duration-700 hover:scale-[1.04]"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-page pb-20 sm:pb-24">
        <div className="grid gap-10 border-y border-border-warm py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="eyebrow">Come sit with us</p>
            <h2 className="mt-4 text-h2">
              A table, a spoon,
              <br className="hidden sm:block" /> and nowhere else to be.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-600 sm:text-base">
              {settings.reservations_enabled
                ? "Reserve ahead for the courtyard, or walk in and take your chances at the marble counter."
                : "Walk in and take your chances at the marble counter. Our team will find you a seat."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {settings.reservations_enabled ? (
                <Link href="/reservations" className={buttonClasses("primary", "md")}>
                  Reserve a table
                </Link>
              ) : null}
              <a href={settings.map_url} target="_blank" rel="noreferrer" className={buttonClasses("secondary", "md")}>
                <MapPin className="h-4 w-4" />
                Find us
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-border-warm bg-vanilla-0 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Today</p>
                <p className="mt-2 font-display text-2xl">{today}</p>
              </div>
              <Clock3 className="h-5 w-5 text-strawberry-600" />
            </div>
            <p className="mt-5 border-t border-border-warm pt-4 text-sm text-ink-600">
              {todayHours ? (
                <>
                  Open {formatTime(todayHours.open)} — {formatTime(todayHours.close)}
                </>
              ) : (
                "Closed today"
              )}
            </p>
            <p className="mt-2 text-sm text-ink-600">{settings.address}</p>
            <a href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`} className="mt-4 inline-flex text-sm font-semibold text-strawberry-700 hover:underline">
              {settings.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

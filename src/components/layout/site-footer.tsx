"use client";

import Link from "next/link";
import { ArrowUpRight, Camera, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { useSettings } from "@/providers/settings-provider";
import { formatTime } from "@/lib/format";

export function SiteFooter() {
  const { settings } = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border-warm bg-vanilla-0">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.4fr_0.7fr_0.9fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-600">
            {settings.tagline} Churned in small batches, served with a little ceremony.
          </p>
          <div className="mt-6 flex gap-2">
            <a
              href={`https://instagram.com/${settings.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-warm text-ink-700 transition hover:border-strawberry-500 hover:text-strawberry-600"
              aria-label="Instagram"
            >
              <Camera className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-warm text-ink-700 transition hover:border-strawberry-500 hover:text-strawberry-600"
              aria-label="Email us"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h2 className="eyebrow mb-4">Explore</h2>
          <ul className="space-y-2.5 text-sm text-ink-600">
            {[
              ["Menu", "/menu"],
              ["Our story", "/story"],
              ["Gallery", "/gallery"],
              ["Reservations", "/reservations"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="transition hover:text-ink-900">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow mb-4">Visit</h2>
          <ul className="space-y-3 text-sm text-ink-600">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-strawberry-600" />
              <a href={settings.map_url} target="_blank" rel="noreferrer" className="hover:text-ink-900">
                {settings.address}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-strawberry-600" />
              <a href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`} className="hover:text-ink-900">
                {settings.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-strawberry-600" />
              <a href={`mailto:${settings.email}`} className="break-all hover:text-ink-900">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="eyebrow mb-4">Opening hours</h2>
          <dl className="space-y-1.5 text-sm text-ink-600">
            {settings.hours.slice(0, 7).map((entry) => (
              <div key={entry.day} className="flex justify-between gap-3">
                <dt>{entry.day.slice(0, 3)}</dt>
                <dd className="tabular-nums">
                  {formatTime(entry.open)} – {formatTime(entry.close)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border-t border-border-warm">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.restaurant_name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span>Small batch. Slow churn. Real fruit.</span>
            <Link href="/menu" className="inline-flex items-center gap-1 font-semibold text-ink-900 hover:text-strawberry-600">
              Order <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


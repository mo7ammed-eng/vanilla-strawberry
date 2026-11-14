import type { PublicSettings } from "@/lib/types";

export const defaultSettings: PublicSettings = {
  restaurant_name: "Vanilla & Strawberry",
  tagline: "Small-batch gelato, made slowly.",
  address: "14 Orchard Lane, Brooklyn, NY 11201",
  phone: "(718) 555-0142",
  email: "hello@vanillaandstrawberry.test",
  hours: [
    { day: "Monday", open: "12:00", close: "22:00" },
    { day: "Tuesday", open: "12:00", close: "22:00" },
    { day: "Wednesday", open: "12:00", close: "22:00" },
    { day: "Thursday", open: "12:00", close: "22:00" },
    { day: "Friday", open: "12:00", close: "23:00" },
    { day: "Saturday", open: "11:00", close: "23:00" },
    { day: "Sunday", open: "11:00", close: "21:00" },
  ],
  map_url: "https://maps.google.com/?q=14+Orchard+Lane+Brooklyn+NY",
  instagram: "@vanillaandstrawberry",
  currency: "USD",
  currency_symbol: "$",
  tax_rate_bps: 888,
  service_fee_bps: 0,
  delivery_fee_cents: 600,
  free_delivery_threshold_cents: 6000,
  reservations_enabled: true,
  coupons_enabled: true,
  reservation_capacity_per_slot: 24,
};

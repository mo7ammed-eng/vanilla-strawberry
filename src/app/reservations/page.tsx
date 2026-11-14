"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Check, Clock3, MapPin, Users } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, api, errorMessage } from "@/lib/api";
import { formatDateOnly, formatTime } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { useSettings } from "@/providers/settings-provider";
import type { Reservation, ReservationSlot } from "@/lib/types";

function isoDate(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export default function ReservationsPage() {
  const { user } = useAuth();
  const { settings } = useSettings();

  const today = isoDate(new Date());
  const maxDate = isoDate(new Date(new Date(`${today}T12:00:00`).getTime() + 60 * 86400000));

  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<ReservationSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);

  useEffect(() => {
    if (user) {
      setName((value) => value || user.name);
      setEmail((value) => value || user.email);
      setPhone((value) => value || (user.phone ?? ""));
    }
  }, [user]);

  const loadSlots = useCallback(async (value: string) => {
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const response = await api.get<ReservationSlot[]>(
        `/reservations/availability?date=${encodeURIComponent(value)}`,
      );
      setSlots(response.data);
      const firstAvailable = response.data.find((slot) => slot.remaining > 0);
      setTime((current) => (response.data.some((slot) => slot.time === current && slot.remaining > 0) ? current : firstAvailable?.time ?? ""));
    } catch (err) {
      setSlots([]);
      setSlotsError(errorMessage(err));
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!settings.reservations_enabled) return;
    loadSlots(date);
  }, [date, settings.reservations_enabled, loadSlots]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await api.post<Reservation>("/reservations", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        reservation_date: date,
        reservation_time: time,
        party_size: partySize,
        notes: notes.trim() || null,
      });
      setConfirmed(response.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors);
        setError(err.message);
      } else {
        setError(errorMessage(err));
      }
      setSubmitting(false);
    }
  };

  const fieldError = (key: string) => fieldErrors[key]?.[0];

  if (!settings.reservations_enabled) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow">Reservations</p>
          <h1 className="mt-4 text-h1">The book is closed for now.</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            We are not taking reservations at the moment. Walk-ins are welcome whenever the counter
            is open, and our team will find you a seat.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/menu" className={buttonClasses("primary", "md")}>
              Browse the menu
            </Link>
            <a href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`} className={buttonClasses("secondary", "md")}>
              Call the restaurant
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-border-warm bg-vanilla-0 p-8 text-center sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="h-6 w-6" />
          </span>
          <p className="eyebrow mt-5">Request received</p>
          <h1 className="mt-3 text-h2">We will save you a seat.</h1>
          <p className="mt-3 text-sm text-ink-600">
            Your reservation request is with our team. We will confirm by email or phone shortly.
          </p>

          <dl className="mx-auto mt-7 grid max-w-md gap-3 rounded-2xl bg-vanilla-100 p-5 text-left text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600">Reference</dt>
              <dd className="mt-1 font-semibold">{confirmed.reservation_code}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600">Guests</dt>
              <dd className="mt-1 font-semibold">{confirmed.party_size}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600">Date</dt>
              <dd className="mt-1 font-semibold">{formatDateOnly(confirmed.reservation_date)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600">Time</dt>
              <dd className="mt-1 font-semibold">{formatTime(confirmed.reservation_time)}</dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {user ? (
              <Link href="/account/reservations" className={buttonClasses("primary", "md")}>
                View my reservations
              </Link>
            ) : (
              <Link href="/login" className={buttonClasses("primary", "md")}>
                Sign in to track it
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setConfirmed(null);
                setSubmitting(false);
                setNotes("");
              }}
              className={buttonClasses("secondary", "md")}
            >
              Make another request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className="eyebrow">Reservations</p>
          <h1 className="mt-3 text-h1">A table for the slow part of the day.</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
            Request a seating in the courtyard or by the window. We hold tables for fifteen minutes;
            if plans change, just call and let us know.
          </p>

          <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl bg-vanilla-200">
            <Image
              src="/images/fig-ricotta.jpg"
              alt="Fig and ricotta gelato served at a table"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 92vw"
              className="object-cover"
            />
          </div>

          <dl className="mt-8 grid gap-4 border-t border-border-warm pt-6 text-sm sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-strawberry-600" />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600">Find us</dt>
                <dd className="mt-1">{settings.address}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 text-strawberry-600" />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600">Seatings</dt>
                <dd className="mt-1">Every 30 minutes</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 text-strawberry-600" />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600">Groups</dt>
                <dd className="mt-1">Up to 12 guests</dd>
              </div>
            </div>
          </dl>
        </div>

        <form onSubmit={submit} className="h-fit rounded-2xl border border-border-warm bg-vanilla-0 p-6 sm:p-8" noValidate>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-strawberry-600" />
            <h2 className="text-xl">Request a table</h2>
          </div>

          {error ? (
            <div className="mt-4">
              <FormError message={error} />
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="date" required error={fieldError("reservation_date")}>
              <Input
                id="date"
                type="date"
                value={date}
                min={today}
                max={maxDate}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </Field>
            <Field label="Guests" htmlFor="party" required error={fieldError("party_size")}>
              <Select
                id="party"
                value={partySize}
                onChange={(event) => setPartySize(Number(event.target.value))}
              >
                {Array.from({ length: 12 }).map((_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1} {index === 0 ? "guest" : "guests"}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-4">
            <Field
              label="Seating time"
              htmlFor="time"
              required
              error={fieldError("reservation_time")}
              hint="Times shown have space for your party."
            >
              {slotsLoading ? (
                <div className="flex h-11 items-center gap-2 rounded-xl border border-border-warm bg-vanilla-50 px-4 text-sm text-ink-600">
                  <Spinner className="h-4 w-4" /> Checking the book…
                </div>
              ) : slotsError ? (
                <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">
                  {slotsError}
                </p>
              ) : slots.length === 0 ? (
                <p className="rounded-xl border border-border-warm bg-vanilla-50 px-4 py-3 text-sm text-ink-600">
                  No seatings left on this date. Try another day.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => {
                    const disabled = slot.remaining <= 0;
                    return (
                      <label
                        key={slot.time}
                        className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs transition ${
                          time === slot.time
                            ? "border-strawberry-500 bg-strawberry-50 font-semibold"
                            : disabled
                              ? "cursor-not-allowed border-border-warm bg-vanilla-50 text-ink-600/50"
                              : "border-border-warm bg-vanilla-0 hover:border-ink-900/25"
                        }`}
                      >
                        <input
                          type="radio"
                          name="time"
                          value={slot.time}
                          checked={time === slot.time}
                          onChange={() => setTime(slot.time)}
                          disabled={disabled}
                          className="sr-only"
                        />
                        {formatTime(slot.time)}
                      </label>
                    );
                  })}
                </div>
              )}
            </Field>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="res-name" required error={fieldError("name")}>
              <Input
                id="res-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </Field>
            <Field label="Phone" htmlFor="res-phone" required error={fieldError("phone")}>
              <Input
                id="res-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                inputMode="tel"
                required
              />
            </Field>
            <Field label="Email" htmlFor="res-email" required error={fieldError("email")} className="sm:col-span-2">
              <Input
                id="res-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Anything we should know?" htmlFor="res-notes" error={fieldError("notes")} className="sm:col-span-2">
              <Textarea
                id="res-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, 500))}
                placeholder="Birthday, accessibility, high chair, quiet corner…"
              />
            </Field>
          </div>

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            disabled={!time || slotsLoading}
            className="mt-5 w-full"
          >
            Request reservation
          </Button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-600">
            This is a request, not a confirmed booking. Our team will confirm by email or phone.
          </p>
        </form>
      </div>
    </div>
  );
}

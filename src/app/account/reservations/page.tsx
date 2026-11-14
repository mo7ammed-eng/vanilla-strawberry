"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Clock3, Users } from "lucide-react";
import { ReservationStatusBadge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import { cn, formatDateOnly, formatTime } from "@/lib/format";
import { useToast } from "@/providers/toast-provider";
import type { Reservation } from "@/lib/types";

function isUpcoming(reservation: Reservation): boolean {
  const today = new Date().toLocaleDateString("en-CA");
  return (
    ["pending", "confirmed", "seated"].includes(reservation.status) &&
    reservation.reservation_date >= today
  );
}

export default function AccountReservationsPage() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<Reservation[]>("/account/reservations")
      .then((response) => setReservations(response.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = useMemo(() => reservations.filter(isUpcoming), [reservations]);
  const past = useMemo(() => reservations.filter((item) => !isUpcoming(item)), [reservations]);
  const visible = tab === "upcoming" ? upcoming : past;

  const confirmCancel = async () => {
    if (!cancelling) return;
    setCancelBusy(true);
    try {
      await api.patch(`/account/reservations/${cancelling.id}/cancel`);
      toast("Reservation cancelled. We hope to see you another time.", "success");
      setCancelling(null);
      load();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">The book</p>
          <h1 className="mt-2 text-h2">Your reservations</h1>
          <p className="mt-1 text-sm text-ink-600">Requested seatings and their confirmation status.</p>
        </div>
        <Link href="/reservations" className={buttonClasses("secondary", "sm")}>
          Request a table
        </Link>
      </div>

      <div className="flex gap-1 border-b border-border-warm" role="tablist" aria-label="Reservation filter">
        {(["upcoming", "past"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition",
              tab === value
                ? "border-strawberry-500 text-ink-900"
                : "border-transparent text-ink-600 hover:text-ink-900",
            )}
          >
            {value} ({value === "upcoming" ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={tab === "upcoming" ? "No upcoming tables" : "No past reservations"}
          description={
            tab === "upcoming"
              ? "Request a seating and we will hold a place for you."
              : "Your completed and cancelled reservations will appear here."
          }
          action={
            tab === "upcoming" ? (
              <Link href="/reservations" className={buttonClasses("primary", "md")}>
                Request a table
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((reservation) => (
            <li key={reservation.id} className="rounded-2xl border border-border-warm bg-vanilla-0 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl">{formatDateOnly(reservation.reservation_date)}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatTime(reservation.reservation_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {reservation.party_size} guests
                    </span>
                    <span>{reservation.reservation_code}</span>
                  </div>
                </div>
                <ReservationStatusBadge status={reservation.status} label={reservation.status_label} />
              </div>
              {reservation.notes ? (
                <p className="mt-3 border-t border-border-warm pt-3 text-xs italic text-ink-600">
                  “{reservation.notes}”
                </p>
              ) : null}
              {["pending", "confirmed"].includes(reservation.status) ? (
                <div className="mt-3">
                  <Button variant="ghost" size="sm" onClick={() => setCancelling(reservation)}>
                    Cancel reservation
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title="Cancel this reservation?"
        description={
          cancelling
            ? `${formatDateOnly(cancelling.reservation_date)} at ${formatTime(cancelling.reservation_time)}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelling(null)}>
              Keep reservation
            </Button>
            <Button variant="danger" loading={cancelBusy} onClick={confirmCancel}>
              Cancel reservation
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          The table will be released back to the book. You can always request another seating.
        </p>
      </Modal>
    </div>
  );
}

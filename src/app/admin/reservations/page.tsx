"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination } from "@/components/admin/pagination";
import { ReservationStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { api, errorMessage } from "@/lib/api";
import { formatDateOnly, formatTime } from "@/lib/format";
import type { PaginationMeta, Reservation, ReservationStatus } from "@/lib/types";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "seated", label: "Seated" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const transitions: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["seated", "cancelled"],
  seated: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export default function AdminReservationsPage() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), per_page: "30" });
    if (status) params.set("status", status);
    if (date) params.set("date", date);
    if (search) params.set("search", search);

    try {
      const response = await api.get<Reservation[]>(`/admin/reservations?${params.toString()}`);
      setReservations(response.data);
      setMeta(response.meta ?? null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, status, date, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(reservation: Reservation, next: ReservationStatus) {
    setBusyId(reservation.id);
    try {
      const response = await api.patch<Reservation>(`/admin/reservations/${reservation.id}/status`, { status: next });
      setReservations((current) =>
        current.map((item) => (item.id === reservation.id ? response.data : item)),
      );
      toast(`${reservation.name}'s booking is now ${next}.`, "success");
      setCancelTarget(null);
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Service"
        title="Reservations"
        description="Confirm, seat, and close table reservations. Capacity is enforced at booking time."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void load()} loading={loading}>
            Refresh
          </Button>
        }
      />

      <form
        className="grid gap-2 rounded-2xl border border-border-warm bg-vanilla-0 p-3 sm:grid-cols-2 xl:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
          <Input
            aria-label="Search reservations"
            placeholder="Name, email, booking code"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
        <Input aria-label="Filter by date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} />
        <div className="flex gap-2">
          <Button type="submit" size="sm">Search</Button>
          {status || date || search ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus("");
                setDate("");
                setSearch("");
                setSearchInput("");
                setPage(1);
              }}
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          ) : null}
        </div>
      </form>

      {error ? <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <CardSkeleton />
      ) : reservations.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-vanilla-0 px-5 py-12 text-center">
          <p className="font-medium">No reservations found.</p>
          <p className="mt-1 text-sm text-ink-600">New booking requests will appear here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-warm bg-vanilla-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[50rem] text-left text-sm">
              <thead className="bg-vanilla-50 text-[10px] uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Party</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="align-top hover:bg-vanilla-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium">{formatDateOnly(reservation.reservation_date)}</p>
                      <p className="text-[11px] text-ink-600">{formatTime(reservation.reservation_time)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{reservation.name}</p>
                      <p className="text-[11px] text-ink-600">{reservation.phone}</p>
                      <p className="text-[11px] text-ink-600">{reservation.email}</p>
                      {reservation.notes ? <p className="mt-1 max-w-[15rem] text-xs italic text-ink-600">“{reservation.notes}”</p> : null}
                    </td>
                    <td className="px-4 py-3">{reservation.party_size} guests</td>
                    <td className="px-4 py-3 font-mono text-xs">{reservation.reservation_code}</td>
                    <td className="px-4 py-3"><ReservationStatusBadge status={reservation.status} label={reservation.status_label} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {transitions[reservation.status].map((next) => (
                          <Button
                            key={next}
                            size="sm"
                            variant={next === "cancelled" ? "ghost" : "secondary"}
                            loading={busyId === reservation.id}
                            onClick={() => {
                              if (next === "cancelled") setCancelTarget(reservation);
                              else void updateStatus(reservation, next);
                            }}
                          >
                            {next === "confirmed" ? "Confirm" : next === "seated" ? "Seat" : next === "completed" ? "Complete" : "Cancel"}
                          </Button>
                        ))}
                        {transitions[reservation.status].length === 0 ? (
                          <span className="text-xs text-ink-600">No actions</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? (
            <div className="px-4 pb-4">
              <Pagination page={meta.current_page} lastPage={meta.last_page} total={meta.total} onPage={setPage} busy={loading} />
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        title={cancelTarget ? `Cancel ${cancelTarget.name}'s reservation?` : "Cancel reservation"}
        description="The customer will be notified. The slot becomes available again."
        confirmLabel="Cancel reservation"
        dangerous
        busy={busyId === cancelTarget?.id}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) void updateStatus(cancelTarget, "cancelled");
        }}
      />
    </div>
  );
}

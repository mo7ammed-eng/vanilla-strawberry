"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, MapPin, QrCode, Users, UtensilsCrossed } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useTableSession } from "@/providers/table-session-provider";
import type { QrTable } from "@/lib/types";

export default function QrTablePage() {
  const params = useParams<{ token: string }>();
  const tableToken = typeof params.token === "string" ? params.token : "";
  const router = useRouter();
  const { session: storedSession, hydrated, setSession } = useTableSession();

  const [data, setData] = useState<QrTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableToken) return;
    api
      .get<QrTable>(`/tables/${encodeURIComponent(tableToken)}`)
      .then((response) => setData(response.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [tableToken]);

  const openTable = async (start: boolean) => {
    if (!data) return;
    setStarting(true);
    setError(null);
    try {
      const response = start
        ? await api.post<QrTable>(`/tables/${encodeURIComponent(tableToken)}/session`)
        : null;
      const current = response?.data ?? data;
      if (!current.session) {
        setError("This table does not have an open session yet.");
        setStarting(false);
        return;
      }
      setSession({
        tableToken,
        tableName: current.table.name,
        zone: current.table.zone,
        sessionToken: current.session.token,
        openedAt: current.session.opened_at,
      });
      router.push("/menu?from=qr");
    } catch (err) {
      setError(errorMessage(err));
      setStarting(false);
    }
  };

  if (loading) {
    return <PageLoader label="Finding your table" />;
  }

  if (error || !data) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-strawberry-50 text-danger">
            <QrCode className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-h2">This QR code is not active.</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            {error ?? "Ask a member of the team for a fresh code, or order online instead."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/menu" className={buttonClasses("primary", "md")}>
              Order online
            </Link>
            <Link href="/" className={buttonClasses("secondary", "md")}>
              Back to the restaurant
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const openSession = data.session;
  const otherTable =
    storedSession && storedSession.tableToken !== tableToken ? storedSession : null;

  return (
    <div className="container-page py-12 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[2rem] border border-border-warm bg-vanilla-0 p-7 sm:p-10">
          <p className="eyebrow">Table ordering</p>
          <h1 className="mt-3 text-h1">{data.table.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-600">
            {data.table.zone ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {data.table.zone}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Seats {data.table.capacity}
            </span>
            <span className="flex items-center gap-1.5">
              <UtensilsCrossed className="h-4 w-4" /> Dine in
            </span>
          </div>

          <div className="mt-7 border-t border-border-warm pt-6">
            {openSession ? (
              <>
                <p className="text-sm font-semibold text-success">Your table is open.</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {openSession.opened_at
                    ? `Session opened ${formatDateTime(openSession.opened_at)}. `
                    : ""}
                  Add anything from the menu and the kitchen will bring it to {data.table.name}.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button size="lg" loading={starting} onClick={() => openTable(false)}>
                    Continue to the menu
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-ink-600">
                  Opening this page does not reserve the table. Start a table order when you are
                  seated, and we will open a session so the kitchen knows where to bring your order.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button size="lg" loading={starting} onClick={() => openTable(true)}>
                    Start table order
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Link href="/menu" className={buttonClasses("secondary", "lg")}>
                    Browse first
                  </Link>
                </div>
              </>
            )}
          </div>

          {otherTable ? (
            <p className="mt-5 rounded-xl border border-vanilla-200 bg-vanilla-100 px-4 py-3 text-xs leading-relaxed text-ink-600">
              You already have an open session at {otherTable.tableName}. Starting here will switch
              this browser to {data.table.name}.
            </p>
          ) : null}

          {error ? (
            <p className="mt-5 rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>

        <p className="mt-5 text-center text-xs text-ink-600">
          {hydrated ? "Ordering for a different table? Scan that table's QR code." : ""}
        </p>
      </div>
    </div>
  );
}

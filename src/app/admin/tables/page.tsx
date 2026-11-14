"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Plus, QrCode, RefreshCw, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { ApiError, api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { AdminTable } from "@/lib/types";

interface TableDraft {
  name: string;
  zone: string;
  capacity: number;
  is_active: boolean;
}

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function AdminTablesPage() {
  const { toast } = useToast();
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminTable | null>(null);
  const [draft, setDraft] = useState<TableDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [qrTable, setQrTable] = useState<AdminTable | null>(null);
  const [actionTable, setActionTable] = useState<{ table: AdminTable; action: "regenerate" | "close" | "delete" } | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AdminTable[]>("/admin/tables");
      setTables(response.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const zones = useMemo(() => {
    const unique = new Set(tables.map((table) => table.zone).filter((zone): zone is string => Boolean(zone)));
    return Array.from(unique).sort();
  }, [tables]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const payload = {
        name: draft.name.trim(),
        zone: draft.zone.trim() || null,
        capacity: draft.capacity,
        is_active: draft.is_active,
      };
      if (editing) {
        await api.patch<AdminTable>(`/admin/tables/${editing.id}`, payload);
        toast("Table updated.", "success");
      } else {
        await api.post<AdminTable>("/admin/tables", payload);
        toast("Table created with a fresh QR code.", "success");
      }
      setDraft(null);
      setEditing(null);
      void load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors);
        setFormError(Object.values(err.errors)[0]?.[0] ?? err.message);
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }

  async function runAction() {
    if (!actionTable) return;
    setActing(true);
    try {
      if (actionTable.action === "regenerate") {
        await api.post(`/admin/tables/${actionTable.table.id}/regenerate-token`);
      } else if (actionTable.action === "close") {
        await api.post(`/admin/tables/${actionTable.table.id}/close-session`);
      } else {
        await api.delete(`/admin/tables/${actionTable.table.id}`);
      }
      toast(
        actionTable.action === "regenerate"
          ? "QR token regenerated. Printing old codes will no longer work."
          : actionTable.action === "close"
            ? "Table session closed."
            : "Table removed.",
        "success",
      );
      setActionTable(null);
      setQrTable(null);
      void load();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setActing(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} copied.`, "success");
    } catch {
      toast("Copy failed. Select the link and copy it manually.", "error");
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Service"
        title="Tables & QR"
        description="Each table has a stable internal ID and a secure token. A QR visit only opens a session when the guest chooses to start."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDraft({ name: "", zone: zones[0] ?? "", capacity: 2, is_active: true });
              setFormError(null);
              setFieldErrors({});
            }}
          >
            <Plus className="h-4 w-4" /> New table
          </Button>
        }
      />

      {error ? <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <CardSkeleton />
      ) : tables.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-vanilla-0 px-5 py-12 text-center">
          <p className="font-medium">No tables yet.</p>
          <p className="mt-1 text-sm text-ink-600">Add a table to generate its QR code.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => {
            const url = `${siteUrl}${table.qr_url}`;
            return (
              <article key={table.id} className="rounded-2xl border border-border-warm bg-vanilla-0 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{table.name}</h2>
                    <p className="text-[11px] text-ink-600">
                      {table.zone || "No zone"} · seats {table.capacity} · {table.orders_count ?? 0} orders
                    </p>
                  </div>
                  <Badge tone={table.is_active ? "success" : "neutral"}>{table.is_active ? "Active" : "Archived"}</Badge>
                </div>

                <div className="mt-3 rounded-xl border border-dashed border-border-warm bg-vanilla-50 px-3 py-2">
                  {table.active_session ? (
                    <>
                      <p className="text-xs font-semibold text-success">Session open</p>
                      <p className="text-[11px] text-ink-600">Since {formatDateTime(table.active_session.opened_at)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-ink-600">No open session</p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => setQrTable(table)}>
                    <QrCode className="h-3.5 w-3.5" /> QR
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(table);
                      setDraft({
                        name: table.name,
                        zone: table.zone ?? "",
                        capacity: table.capacity,
                        is_active: table.is_active,
                      });
                      setFormError(null);
                      setFieldErrors({});
                    }}
                  >
                    Edit
                  </Button>
                  {table.active_session ? (
                    <Button size="sm" variant="ghost" onClick={() => setActionTable({ table, action: "close" })}>
                      Close session
                    </Button>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border-warm pt-2">
                  <Button size="sm" variant="ghost" onClick={() => void copy(url, "Table link")}>
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setActionTable({ table, action: "regenerate" })}>
                    <RefreshCw className="h-3.5 w-3.5" /> New token
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:bg-strawberry-50"
                    onClick={() => setActionTable({ table, action: "delete" })}
                    aria-label={`Delete ${table.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => { setDraft(null); setEditing(null); }}
        title={editing ? `Edit ${editing.name}` : "New table"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDraft(null); setEditing(null); }}>Cancel</Button>
            <Button type="submit" form="table-form" loading={saving}>{editing ? "Save changes" : "Create table"}</Button>
          </>
        }
      >
        {draft ? (
          <form
            id="table-form"
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <FormError message={formError} />
            <Field label="Table name" htmlFor="table-name" required error={fieldErrors.name?.[0]} hint="For example “Table 12” or “Window 3”.">
              <Input id="table-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
            </Field>
            <Field label="Zone" htmlFor="table-zone" error={fieldErrors.zone?.[0]}>
              <Input id="table-zone" value={draft.zone} onChange={(event) => setDraft({ ...draft, zone: event.target.value })} list="table-zones" />
              <datalist id="table-zones">
                {zones.map((zone) => <option key={zone} value={zone} />)}
              </datalist>
            </Field>
            <Field label="Capacity" htmlFor="table-capacity" required error={fieldErrors.capacity?.[0]}>
              <Input
                id="table-capacity"
                type="number"
                min={1}
                max={20}
                value={draft.capacity}
                onChange={(event) => setDraft({ ...draft, capacity: Number(event.target.value) })}
                required
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })}
                className="h-4 w-4 accent-strawberry-500"
              />
              QR ordering active
            </label>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={qrTable !== null}
        onClose={() => setQrTable(null)}
        title={qrTable ? `${qrTable.name} QR code` : "Table QR"}
        description="Print and place this code on the table. Guests scan it to view the menu for this table."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setQrTable(null)}>Close</Button>
            {qrTable ? (
              <Button variant="secondary" onClick={() => void copy(`${siteUrl}${qrTable.qr_url}`, "Table link")}>
                <Copy className="h-4 w-4" /> Copy link
              </Button>
            ) : null}
          </>
        }
      >
        {qrTable ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-fit rounded-2xl border border-border-warm bg-white p-4">
              <QRCodeSVG value={`${siteUrl}${qrTable.qr_url}`} size={196} level="M" marginSize={0} />
            </div>
            <div>
              <p className="text-sm font-medium">{qrTable.name}{qrTable.zone ? ` · ${qrTable.zone}` : ""}</p>
              <p className="mt-1 break-all font-mono text-[11px] text-ink-600">{siteUrl}{qrTable.qr_url}</p>
            </div>
            <Link href={qrTable.qr_url} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-strawberry-700 hover:underline">
              Test this QR link <ExternalLink className="h-3 w-3" />
            </Link>
            <p className="text-[11px] text-ink-600">Regenerating the token invalidates every printed copy of this QR.</p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={actionTable !== null}
        title={
          actionTable?.action === "regenerate"
            ? `Regenerate ${actionTable.table.name}'s QR token?`
            : actionTable?.action === "close"
              ? `Close ${actionTable.table.name}'s open session?`
              : actionTable
                ? `Delete ${actionTable.table.name}?`
                : "Table action"
        }
        description={
          actionTable?.action === "regenerate"
            ? "The old QR code stops working immediately. Reprint and replace the table card."
            : actionTable?.action === "close"
              ? "The table is released. Guests with the old session can start a new one by scanning again."
              : "Tables with order history are archived instead of deleted."
        }
        confirmLabel={
          actionTable?.action === "regenerate"
            ? "Regenerate token"
            : actionTable?.action === "close"
              ? "Close session"
              : "Delete table"
        }
        dangerous={actionTable?.action !== "close"}
        busy={acting}
        onClose={() => setActionTable(null)}
        onConfirm={() => void runAction()}
      />
    </div>
  );
}

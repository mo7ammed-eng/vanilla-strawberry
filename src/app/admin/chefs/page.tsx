"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { ApiError, api, errorMessage } from "@/lib/api";
import type { ChefSummary } from "@/lib/types";

interface ChefDraft {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  is_active: boolean;
}

const emptyDraft: ChefDraft = {
  name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  is_active: true,
};

export default function AdminChefsPage() {
  const { toast } = useToast();
  const [chefs, setChefs] = useState<ChefSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ChefSummary | null>(null);
  const [draft, setDraft] = useState<ChefDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ChefSummary[]>("/admin/chefs");
      setChefs(response.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    const payload: Record<string, unknown> = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim() || null,
      is_active: draft.is_active,
    };
    if (draft.password) {
      payload.password = draft.password;
      payload.password_confirmation = draft.password_confirmation;
    }

    try {
      if (editing) {
        await api.patch<ChefSummary>(`/admin/chefs/${editing.id}`, payload);
        toast("Chef account updated.", "success");
      } else {
        await api.post<ChefSummary>("/admin/chefs", payload);
        toast("Chef account created.", "success");
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

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="People"
        title="Chef accounts"
        description="Kitchen access only: live orders and preparation status. Chefs cannot access admin tools."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDraft({ ...emptyDraft });
              setFormError(null);
              setFieldErrors({});
            }}
          >
            <Plus className="h-4 w-4" /> New chef
          </Button>
        }
      />

      {error ? <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <CardSkeleton />
      ) : chefs.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-vanilla-0 px-5 py-12 text-center">
          <p className="font-medium">No chef accounts yet.</p>
          <p className="mt-1 text-sm text-ink-600">Create one to give the kitchen its own login.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {chefs.map((chef) => (
            <article key={chef.id} className="rounded-2xl border border-border-warm bg-vanilla-0 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{chef.name}</h2>
                  <p className="text-xs text-ink-600">{chef.email}</p>
                  <p className="text-xs text-ink-600">{chef.phone ?? "No phone"}</p>
                </div>
                <Badge tone={chef.is_active ? "success" : "danger"}>{chef.is_active ? "Active" : "Disabled"}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border-warm pt-3 text-xs text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-strawberry-600" />
                  Chef · {chef.orders_count ?? 0} tickets
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(chef);
                    setDraft({
                      name: chef.name,
                      email: chef.email,
                      phone: chef.phone ?? "",
                      password: "",
                      password_confirmation: "",
                      is_active: chef.is_active,
                    });
                    setFormError(null);
                    setFieldErrors({});
                  }}
                >
                  Edit
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => { setDraft(null); setEditing(null); }}
        title={editing ? `Edit ${editing.name}` : "New chef account"}
        description={editing ? "Leave password blank to keep the current one." : "Passwords need at least 8 characters with letters and numbers."}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDraft(null); setEditing(null); }}>Cancel</Button>
            <Button type="submit" form="chef-form" loading={saving}>{editing ? "Save changes" : "Create chef"}</Button>
          </>
        }
      >
        {draft ? (
          <form
            id="chef-form"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className="sm:col-span-2"><FormError message={formError} /></div>
            <Field label="Full name" htmlFor="chef-name" required error={fieldErrors.name?.[0]}>
              <Input id="chef-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
            </Field>
            <Field label="Email" htmlFor="chef-email" required error={fieldErrors.email?.[0]}>
              <Input id="chef-email" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} required />
            </Field>
            <Field label="Phone" htmlFor="chef-phone" error={fieldErrors.phone?.[0]}>
              <Input id="chef-phone" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
            </Field>
            <Field label="Password" htmlFor="chef-password" error={fieldErrors.password?.[0]} hint={editing ? "Leave blank to keep current password." : undefined}>
              <Input
                id="chef-password"
                type="password"
                value={draft.password}
                onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm password" htmlFor="chef-password-confirmation" error={fieldErrors.password_confirmation?.[0]}>
              <Input
                id="chef-password-confirmation"
                type="password"
                value={draft.password_confirmation}
                onChange={(event) => setDraft({ ...draft, password_confirmation: event.target.value })}
                autoComplete="new-password"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })}
                className="h-4 w-4 accent-strawberry-500"
              />
              Account active
            </label>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

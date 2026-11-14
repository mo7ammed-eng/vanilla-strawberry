"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { ApiError, api, errorMessage } from "@/lib/api";
import { formatDate, initials } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? "");
  }, [user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      await api.patch<User>("/auth/profile", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
      });
      await refresh();
      toast("Profile updated.", "success");
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors);
        setError(err.message);
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key: string) => fieldErrors[key]?.[0];

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Account details</p>
        <h1 className="mt-2 text-h2">Your profile</h1>
        <p className="mt-1 text-sm text-ink-600">Keep your contact details current so we can reach you about orders.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border-warm bg-vanilla-0 p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 font-display text-xl text-vanilla-0">
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-sm text-ink-600">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={user.role === "admin" ? "ink" : user.role === "chef" ? "strawberry" : "neutral"}>
              {user.role_label}
            </Badge>
            <Badge tone={user.is_active ? "success" : "danger"}>{user.is_active ? "Active" : "Inactive"}</Badge>
            <span className="text-[11px] text-ink-600">Member since {formatDate(user.created_at)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border-warm bg-vanilla-0 p-6" noValidate>
        {error ? <FormError message={error} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="profile-name" required error={fieldError("name")}>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </Field>
          <Field label="Phone" htmlFor="profile-phone" error={fieldError("phone")}>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              inputMode="tel"
              placeholder="Optional"
            />
          </Field>
          <Field label="Email" htmlFor="profile-email" required error={fieldError("email")} className="sm:col-span-2">
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-warm pt-4">
          <p className="flex items-center gap-1.5 text-xs text-ink-600">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Password changes are handled by the restaurant team for now.
          </p>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}

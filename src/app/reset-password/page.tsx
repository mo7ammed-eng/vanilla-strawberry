"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { ApiError, errorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    if (!token || !email) {
      setError("This reset link is incomplete. Request a new one.");
      setSubmitting(false);
      return;
    }

    try {
      await resetPassword(email, token, password, confirmation);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors);
      }
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 rounded-2xl border border-success/30 bg-success/5 p-5 text-sm text-ink-700">
        <p className="font-semibold text-success">Your password has been reset.</p>
        <Button onClick={() => router.replace("/login")} className="w-full">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? <FormError message={error} /> : null}
      <Field
        label="New password"
        htmlFor="reset-password"
        required
        hint="At least 8 characters, with letters and numbers."
        error={fieldErrors.password?.[0]}
      >
        <Input
          id="reset-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </Field>
      <Field
        label="Confirm new password"
        htmlFor="reset-confirmation"
        required
        error={fieldErrors.password?.[0]}
      >
        <Input
          id="reset-confirmation"
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="new-password"
          required
        />
      </Field>
      <Button type="submit" size="lg" loading={submitting} className="w-full">
        Reset password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password."
      description="Your new password needs at least eight characters, including letters and numbers."
      image="/images/berry-ripple.jpg"
      imageAlt="Berry ripple gelato with fresh berries"
      footer={
        <>
          Need a new link?{" "}
          <Link href="/forgot-password" className="font-semibold text-strawberry-700 hover:underline">
            Request another
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-ink-600">Loading reset form…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password."
      description="Enter the email address on your account and we will send you a secure reset link."
      image="/images/vanilla-bean.jpg"
      imageAlt="Vanilla bean gelato"
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-strawberry-700 hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-3 rounded-2xl border border-success/30 bg-success/5 p-5 text-sm text-ink-700">
          <p className="font-semibold text-success">Check your inbox.</p>
          <p>If that email address has an account, a reset link is on its way.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error ? <FormError message={error} /> : null}
          <Field label="Email" htmlFor="forgot-email" required>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

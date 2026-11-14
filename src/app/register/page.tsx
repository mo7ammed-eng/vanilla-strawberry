"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (password !== confirmation) {
      setError("Those passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      router.replace("/account");
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Join the table"
      title="Save your favourites."
      description="Create an account to order faster, keep your addresses, and follow every order from kitchen to table."
      image="/images/berry-ripple.jpg"
      imageAlt="Berry ripple gelato with fresh berries"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-strawberry-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? <FormError message={error} /> : null}
        <Field label="Full name" htmlFor="name" required>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              inputMode="tel"
              placeholder="Optional"
            />
          </Field>
        </div>
        <Field
          label="Password"
          htmlFor="password"
          required
          hint="At least 8 characters, with letters and numbers."
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-900"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm password" htmlFor="confirmation" required>
          <Input
            id="confirmation"
            type={showPassword ? "text" : "password"}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Create account
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-ink-600">
          Your details are only used to serve your order and keep your account secure.
        </p>
      </form>
    </AuthShell>
  );
}

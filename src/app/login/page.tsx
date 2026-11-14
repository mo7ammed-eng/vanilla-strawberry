"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type { User } from "@/lib/types";

function dashboardFor(role: User["role"]): string {
  return role === "admin" ? "/admin" : role === "chef" ? "/chef" : "/account";
}

function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, ready, login } = useAuth();
  const next = safeNext(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) {
      router.replace(next ?? dashboardFor(user.role));
    }
  }, [ready, user, router, next]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const signedIn = await login(email.trim(), password);
      router.replace(next ?? dashboardFor(signedIn.role));
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? <FormError message={error} /> : null}
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
      <Field label="Password" htmlFor="password" required>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
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
      <Button type="submit" size="lg" loading={submitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Your table is waiting."
      description="Sign in to reorder favourites, follow live orders, and keep your reservations in one place."
      image="/images/espresso-flake.jpg"
      imageAlt="Espresso gelato with chocolate flakes"
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-strawberry-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-ink-600">Loading sign in…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

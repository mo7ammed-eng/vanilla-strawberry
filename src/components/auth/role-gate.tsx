"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { PageLoader } from "@/components/ui/spinner";
import { useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/lib/types";

export function RoleGate({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [ready, user, router, pathname]);

  if (!ready) {
    return <PageLoader label="Checking your session" />;
  }

  if (!user) {
    return <PageLoader label="Redirecting to sign in" />;
  }

  if (!roles.includes(user.role)) {
    const href = user.role === "admin" ? "/admin" : user.role === "chef" ? "/chef" : "/account";
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-strawberry-50 text-danger">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="text-h2">This area is not available for your account</h1>
        <p className="mt-3 max-w-md text-sm text-ink-600">
          You are signed in as {user.role_label.toLowerCase()}. Head back to your own dashboard to continue.
        </p>
        <Link
          href={href}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-strawberry-500 px-5 text-sm font-semibold text-vanilla-0 transition hover:bg-strawberry-700"
        >
          Go to my dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

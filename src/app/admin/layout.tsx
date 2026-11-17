import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { AdminNav } from "@/components/admin/admin-nav";
import { StaffHeader } from "@/components/layout/staff-header";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={["admin"]}>
      <div className="min-h-screen bg-vanilla-50">
        <StaffHeader area="Admin" />
        <div className="container-page py-6 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-10">
            <AdminNav />
            <main id="main-content" className="min-w-0">
              {children}
            </main>
          </div>
        </div>
        <div className="container-page pb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-warm bg-vanilla-0 px-4 py-3 text-xs text-ink-600">
            <span>Signed in to the Vanilla &amp; Strawberry operations console.</span>
            <Link href="/" className="inline-flex items-center gap-1 font-semibold text-ink-700 hover:text-ink-900">
              View restaurant site <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}

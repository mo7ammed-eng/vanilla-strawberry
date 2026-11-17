import type { Metadata } from "next";
import { RoleGate } from "@/components/auth/role-gate";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={["customer", "chef", "admin"]}>
      <div className="container-page py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </RoleGate>
  );
}

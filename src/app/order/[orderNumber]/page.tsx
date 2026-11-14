"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ClipboardList, RefreshCw } from "lucide-react";
import { OrderDetail } from "@/components/order/order-detail";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type { Order } from "@/lib/types";

export default function OrderTrackingPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params.orderNumber;
  const { user, ready } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      setError(null);
      const token = window.localStorage.getItem(`vs_guest_token_${orderNumber}`);
      try {
        const response = await api.get<Order>(
          `/orders/${encodeURIComponent(orderNumber)}${token ? `?token=${encodeURIComponent(token)}` : ""}`,
        );
        setOrder(response.data);
      } catch (err) {
        if (!quiet) setError(errorMessage(err));
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [orderNumber],
  );

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      const token = window.localStorage.getItem(`vs_guest_token_${orderNumber}`);
      if (!token) {
        setLoading(false);
        setError("This order is only available on the device it was placed from. Sign in if you used your account.");
        return;
      }
    }
    load();
  }, [ready, user, load, orderNumber]);

  useEffect(() => {
    if (!order || ["completed", "cancelled"].includes(order.status)) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [order, load]);

  const refresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  if (!ready || loading) {
    return <PageLoader label="Finding your order" />;
  }

  if (error || !order) {
    return (
      <div className="container-page py-16 sm:py-24">
        <EmptyState
          icon={ClipboardList}
          title="We could not open this order"
          description={error ?? "The order may no longer be available on this device."}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/menu" className={buttonClasses("primary", "md")}>
                Back to the menu
              </Link>
              <Link href="/login" className={buttonClasses("secondary", "md")}>
                Sign in
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600">
          {user ? "Saved to your account." : "Guest order — keep this browser to follow along."}
        </p>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-700 hover:text-ink-900 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      <OrderDetail order={order} />
    </div>
  );
}

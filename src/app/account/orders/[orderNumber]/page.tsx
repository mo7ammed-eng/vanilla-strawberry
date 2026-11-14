"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderDetail } from "@/components/order/order-detail";
import { buttonClasses } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function AccountOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = typeof params.orderNumber === "string" ? params.orderNumber : "";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    let active = true;

    const load = () =>
      api
        .get<Order>(`/account/orders/${encodeURIComponent(orderNumber)}`)
        .then((response) => active && setOrder(response.data))
        .catch((err) => active && setError(errorMessage(err)))
        .finally(() => active && setLoading(false));

    load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 20000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [orderNumber]);

  if (loading) {
    return <PageLoader label="Loading your order" />;
  }

  if (error || !order) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-h2">Order not found</h1>
        <p className="mt-2 text-sm text-ink-600">{error ?? "This order is not attached to your account."}</p>
        <Link href="/account/orders" className={buttonClasses("secondary", "md", "mt-6")}>
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/account/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 transition hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All orders
      </Link>
      <OrderDetail order={order} />
    </div>
  );
}

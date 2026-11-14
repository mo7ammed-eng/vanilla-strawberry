"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { cn, relativeTime } from "@/lib/format";
import type { NotificationItem } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

export function NotificationBell() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (quiet = false) => {
    if (!user) return;
    if (!quiet) setLoading(true);
    try {
      const response = await api.get<NotificationItem[]>("/notifications");
      setItems(response.data);
      setUnread(response.meta?.unread_count ?? response.data.filter((item) => !item.read_at).length);
    } catch (error) {
      if (!quiet) toast(errorMessage(error), "error");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!ready || !user) {
      setItems([]);
      setUnread(0);
      return;
    }
    load(true);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [ready, user, load]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openPanel = () => {
    setOpen((value) => !value);
    if (!open) load();
  };

  const handleItem = async (item: NotificationItem) => {
    if (!item.read_at) {
      try {
        await api.patch(`/notifications/${item.id}/read`);
        setItems((current) =>
          current.map((entry) => (entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry)),
        );
        setUnread((value) => Math.max(0, value - 1));
      } catch {
        // Navigation still proceeds; the unread count reconciles on the next poll.
      }
    }
    setOpen(false);
    if (item.url) router.push(item.url);
  };

  const markAll = async () => {
    try {
      await api.post("/notifications/read-all");
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
      setUnread(0);
    } catch (error) {
      toast(errorMessage(error), "error");
    }
  };

  if (!ready || !user) return null;

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={openPanel}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition hover:bg-vanilla-100 hover:text-ink-900"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-strawberry-500 px-1 text-[9px] font-bold text-vanilla-0">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border-warm bg-vanilla-0 shadow-lift">
          <div className="flex items-center justify-between border-b border-border-warm px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-strawberry-700 hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-[26rem] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-600">Loading notifications…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-600">You are all caught up.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItem(item)}
                  className={cn(
                    "flex w-full flex-col gap-1 border-b border-border-warm/70 px-4 py-3 text-left transition last:border-0 hover:bg-vanilla-50",
                    !item.read_at && "bg-strawberry-50/50",
                  )}
                >
                  <span className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        item.read_at ? "bg-transparent" : "bg-strawberry-500",
                      )}
                    />
                    <span className="text-sm font-semibold text-ink-900">{item.title}</span>
                  </span>
                  <span className="pl-3.5 text-xs leading-relaxed text-ink-600">{item.body}</span>
                  <span className="pl-3.5 text-[10px] uppercase tracking-[0.12em] text-ink-600/80">
                    {relativeTime(item.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

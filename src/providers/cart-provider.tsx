"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AddOn, CartLine, Product, ProductVariant } from "@/lib/types";

const CART_KEY = "vs_cart_v1";

interface AddToCartInput {
  product: Product;
  variant: ProductVariant | null;
  addOns: AddOn[];
  quantity: number;
  notes?: string;
}

interface CartContextValue {
  lines: CartLine[];
  hydrated: boolean;
  itemCount: number;
  subtotalCents: number;
  addItem: (input: AddToCartInput) => void;
  updateQuantity: (key: string, quantity: number) => void;
  updateNotes: (key: string, notes: string) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function buildKey(input: AddToCartInput): string {
  const addOnIds = input.addOns
    .map((addOn) => addOn.id)
    .sort((a, b) => a - b)
    .join("-");
  return [
    input.product.id,
    input.variant?.id ?? 0,
    addOnIds || "0",
    (input.notes ?? "").trim().toLowerCase(),
  ].join(":");
}

function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line): line is CartLine => {
      if (!line || typeof line !== "object") return false;
      const candidate = line as Partial<CartLine>;
      return (
        typeof candidate.key === "string" &&
        typeof candidate.productId === "number" &&
        typeof candidate.quantity === "number" &&
        typeof candidate.basePriceCents === "number"
      );
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback((input: AddToCartInput) => {
    const quantity = Math.min(99, Math.max(1, Math.round(input.quantity)));
    const key = buildKey(input);

    setLines((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key
            ? { ...line, quantity: Math.min(99, line.quantity + quantity) }
            : line,
        );
      }

      const newLine: CartLine = {
        key,
        productId: input.product.id,
        slug: input.product.slug,
        name: input.product.name,
        imageUrl: input.product.image_url,
        variantId: input.variant?.id ?? null,
        variantName: input.variant?.name ?? null,
        basePriceCents: input.product.price_cents,
        variantDeltaCents: input.variant?.price_delta_cents ?? 0,
        addOns: input.addOns.map((addOn) => ({
          id: addOn.id,
          name: addOn.name,
          price_cents: addOn.price_cents,
        })),
        quantity,
        notes: (input.notes ?? "").trim(),
      };

      return [...current, newLine];
    });
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setLines((current) => {
      if (quantity <= 0) return current.filter((line) => line.key !== key);
      return current.map((line) =>
        line.key === key
          ? { ...line, quantity: Math.min(99, Math.max(1, Math.round(quantity))) }
          : line,
      );
    });
  }, []);

  const updateNotes = useCallback((key: string, notes: string) => {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, notes: notes.slice(0, 500) } : line)),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setLines((current) => current.filter((line) => line.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const itemCount = useMemo(() => lines.reduce((total, line) => total + line.quantity, 0), [lines]);
  const subtotalCents = useMemo(
    () =>
      lines.reduce(
        (total, line) =>
          total +
          (line.basePriceCents + line.variantDeltaCents + line.addOns.reduce((sum, addOn) => sum + addOn.price_cents, 0)) *
            line.quantity,
        0,
      ),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      hydrated,
      itemCount,
      subtotalCents,
      addItem,
      updateQuantity,
      updateNotes,
      removeItem,
      clearCart,
    }),
    [lines, hydrated, itemCount, subtotalCents, addItem, updateQuantity, updateNotes, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}

export function cartLineUnitPrice(line: CartLine): number {
  return (
    line.basePriceCents +
    line.variantDeltaCents +
    line.addOns.reduce((total, addOn) => total + addOn.price_cents, 0)
  );
}

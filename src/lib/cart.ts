"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductVersion } from "./types";
import type { Size } from "./constants";
import { CUSTOMIZATION_FEE, SHIPPING } from "./constants";

export type CartItem = {
  id: string; // unique per line
  productId: string;
  slug: string;
  nameHe: string;
  nameEn: string;
  team: string;
  image: string;
  version: ProductVersion;
  size: Size;
  unitPrice: number; // base price for the version
  customization?: { name: string; number: string } | null;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => string;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

function lineKey(i: {
  productId: string;
  version: ProductVersion;
  size: Size;
  customization?: CartItem["customization"];
}): string {
  const cust =
    i.customization && (i.customization.name || i.customization.number)
      ? `${i.customization.name}:${i.customization.number}`
      : "none";
  return `${i.productId}|${i.version}|${i.size}|${cust}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setOpen: (open) => set({ isOpen: open }),
      addItem: (payload) => {
        const key = lineKey(payload);
        const existing = get().items.find((i) => i.id === key);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === key
                ? { ...i, quantity: i.quantity + (payload.quantity ?? 1) }
                : i,
            ),
          });
          return key;
        }
        const newItem: CartItem = {
          ...payload,
          id: key,
          quantity: payload.quantity ?? 1,
        };
        set({ items: [...get().items, newItem] });
        return key;
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i,
          ),
        });
      },
      removeItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "jerseydrop-cart-v1",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function lineTotal(item: CartItem): number {
  const customFee =
    item.customization && (item.customization.name || item.customization.number)
      ? CUSTOMIZATION_FEE
      : 0;
  return (item.unitPrice + customFee) * item.quantity;
}

export function computeTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const shipping =
    subtotal === 0
      ? 0
      : subtotal >= SHIPPING.freeThreshold
        ? 0
        : SHIPPING.standardFee;
  return { subtotal, count, shipping, total: subtotal + shipping };
}

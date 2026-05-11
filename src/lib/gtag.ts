/**
 * Thin GA4 wrapper used across the site for e-commerce events.
 *
 * The actual gtag script is injected by <GoogleAnalytics /> from
 * @next/third-parties — we just push events into the queue. Safe to
 * call from server components too (will no-op on the server).
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Params = Record<string, any>;

/** Generic event push. */
export function trackEvent(action: string, params?: Params) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", action, params || {});
}

// Minimal product shape used by the e-commerce helpers below. Loose on
// purpose — we accept either Product (catalog) or CartItem (cart).
type AnalyticsItem = {
  slug: string;
  nameHe: string;
  category?: string;
  team?: string;
  price?: number;
  quantity?: number;
};

const ILS = "ILS";

/** view_item — fired on the product detail page. */
export function trackViewItem(product: AnalyticsItem & { price: number }) {
  trackEvent("view_item", {
    currency: ILS,
    value: product.price,
    items: [
      {
        item_id: product.slug,
        item_name: product.nameHe,
        item_category: product.category,
        item_brand: product.team,
        price: product.price,
        quantity: 1,
      },
    ],
  });
}

/** add_to_cart — fired when a customer clicks "הוסף לסל". */
export function trackAddToCart(
  product: AnalyticsItem & { price: number },
  quantity = 1,
) {
  trackEvent("add_to_cart", {
    currency: ILS,
    value: product.price * quantity,
    items: [
      {
        item_id: product.slug,
        item_name: product.nameHe,
        item_category: product.category,
        item_brand: product.team,
        price: product.price,
        quantity,
      },
    ],
  });
}

/** begin_checkout — fired when /checkout mounts. */
export function trackBeginCheckout(
  cart: AnalyticsItem[],
  total: number,
) {
  trackEvent("begin_checkout", {
    currency: ILS,
    value: total,
    items: cart.map((item) => ({
      item_id: item.slug,
      item_name: item.nameHe,
      item_category: item.category,
      item_brand: item.team,
      quantity: item.quantity ?? 1,
      price: item.price,
    })),
  });
}

/** purchase — fired on the order-success page. */
export function trackPurchase(
  orderId: string,
  items: AnalyticsItem[],
  total: number,
) {
  trackEvent("purchase", {
    transaction_id: orderId,
    currency: ILS,
    value: total,
    items: items.map((item) => ({
      item_id: item.slug,
      item_name: item.nameHe,
      item_category: item.category,
      item_brand: item.team,
      quantity: item.quantity ?? 1,
      price: item.price,
    })),
  });
}

// Plain, framework-free contract for store's cross-lazy-boundary
// signals -- deliberately just constants + a type, not a service/class, so
// that the one place OUTSIDE the store module that needs it (the shared, eagerly-
// loaded HomeHeaderComponent, which shows a live store cart badge in
// the site header) only ever imports this tiny file, never CartService/
// PricingService themselves. Importing the real
// services into a component that ships in every page's initial bundle
// would pull store's code out of its own lazy chunk and defeat the
// point of it being one. If store is ever removed, home-header.component.ts
// is the one place outside this folder that references this file.
export interface CartSummary {
  quantity: number;
  total: number;
}

/** Dispatched on `window` (CustomEvent<CartSummary>) whenever
 *  CartService's cart changes. */
export const CART_CHANGED_EVENT = 'store:cart-changed';

/** Dispatched on `window` (no detail) to ask the cart drawer to open --
 *  listened for directly by CartDrawerComponent. */
export const CART_OPEN_DRAWER_EVENT = 'store:open-cart-drawer';

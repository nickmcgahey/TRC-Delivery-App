"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { getProduct, sampleName } from "./catalog";
import { addCalendarMonth } from "./dates";
import { deliveryWindow } from "./hours";
import { MEMBERSHIP_PRICE_CENTS } from "./money";
import { quote } from "./quote";
import type { Address, Age, CartLine, Membership, Order } from "./types";
import { formatPostal } from "./zone";

const STORAGE_KEY = "trc-delivery-prototype-v1";
const MAX_QTY = 5;

type Persisted = {
  age: Age;
  cart: CartLine[];
  address: Address | null;
  membership: Membership | null;
  orders: Order[];
};

type State = Persisted & { ready: boolean };

type Action =
  | { type: "hydrate"; value: Persisted }
  | { type: "set-age"; age: Age }
  | { type: "add"; productId: string; qty: number }
  | { type: "set-qty"; productId: string; qty: number }
  | { type: "set-address"; address: Address }
  | { type: "join" }
  | { type: "cancel-membership" }
  | { type: "keep-membership" }
  | { type: "place-order"; order: Order };

function seed(now = Date.now()): Persisted {
  const product = getProduct("preroll-trail");
  if (!product) {
    return { age: "unknown", cart: [], address: null, membership: null, orders: [] };
  }
  const line = {
    productId: product.id,
    name: sampleName(product.name),
    qty: 1,
    unitPriceCents: product.priceCents,
    driedEquivalentMg: product.driedEquivalentMg,
  };
  const priced = quote({
    lines: [
      {
        priceCents: line.unitPriceCents,
        qty: line.qty,
        driedEquivalentMg: line.driedEquivalentMg,
      },
    ],
    passActive: false,
    inZone: true,
  });
  const order: Order = {
    id: "TRC-S-1042",
    placedAt: now - 26 * 60 * 60 * 1000,
    lines: [line],
    addressLabel: "18 Sample Avenue, Oshawa, ON L1H 2B3",
    membershipApplied: false,
    subtotalCents: priced.subtotalCents,
    deliveryFeeCents: priced.deliveryFeeCents,
    listDeliveryFeeCents: priced.listDeliveryFeeCents,
    hstCents: priced.hstCents,
    totalCents: priced.totalCents,
    driedEquivalentMg: priced.driedEquivalentMg,
  };
  return { age: "unknown", cart: [], address: null, membership: null, orders: [order] };
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed || !Array.isArray(parsed.cart) || !Array.isArray(parsed.orders)) return seed();
    if (parsed.age !== "unknown" && parsed.age !== "allowed" && parsed.age !== "blocked") return seed();
    return parsed;
  } catch {
    return seed();
  }
}

function clampQty(qty: number): number {
  return Math.max(0, Math.min(MAX_QTY, Math.round(qty)));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...action.value, ready: true };
    case "set-age":
      return { ...state, age: action.age };
    case "add": {
      const qty = clampQty(action.qty);
      if (qty === 0 || !getProduct(action.productId)) return state;
      const existing = state.cart.find((line) => line.productId === action.productId);
      const cart = existing
        ? state.cart.map((line) =>
            line.productId === action.productId
              ? { ...line, qty: clampQty(line.qty + qty) }
              : line,
          )
        : [...state.cart, { productId: action.productId, qty }];
      return { ...state, cart };
    }
    case "set-qty": {
      const qty = clampQty(action.qty);
      const cart =
        qty === 0
          ? state.cart.filter((line) => line.productId !== action.productId)
          : state.cart.map((line) =>
              line.productId === action.productId ? { ...line, qty } : line,
            );
      return { ...state, cart };
    }
    case "set-address":
      return { ...state, address: action.address };
    case "join": {
      if (state.membership && state.membership.currentPeriodEnd > Date.now()) {
        return {
          ...state,
          membership: { ...state.membership, status: "active", cancelAtPeriodEnd: false },
        };
      }
      const startedAt = Date.now();
      return {
        ...state,
        membership: {
          status: "active",
          startedAt,
          currentPeriodEnd: addCalendarMonth(startedAt),
          cancelAtPeriodEnd: false,
          priceCents: MEMBERSHIP_PRICE_CENTS,
        },
      };
    }
    case "cancel-membership":
      if (!state.membership) return state;
      return { ...state, membership: { ...state.membership, cancelAtPeriodEnd: true } };
    case "keep-membership":
      if (!state.membership) return state;
      return { ...state, membership: { ...state.membership, cancelAtPeriodEnd: false } };
    case "place-order":
      return { ...state, cart: [], orders: [action.order, ...state.orders] };
    default:
      return state;
  }
}

function nextOrderId(orders: Order[]): string {
  const max = orders.reduce((highest, order) => {
    const value = Number(order.id.replace("TRC-S-", ""));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 1042);
  return `TRC-S-${max + 1}`;
}

type StoreValue = {
  ready: boolean;
  age: Age;
  cart: CartLine[];
  address: Address | null;
  membership: Membership | null;
  orders: Order[];
  passActive: boolean;
  allowAge: () => void;
  blockAge: () => void;
  addToCart: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  setAddress: (address: Address) => void;
  joinPass: () => void;
  cancelPass: () => void;
  keepPass: () => void;
  placeOrder: () => string | null;
  resetSession: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ...seed(0), ready: false, orders: [] });
  const hydrated = useRef(false);

  useEffect(() => {
    dispatch({ type: "hydrate", value: load() });
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    const persisted: Persisted = {
      age: state.age,
      cart: state.cart,
      address: state.address,
      membership: state.membership,
      orders: state.orders,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [state]);

  const value = useMemo<StoreValue>(() => {
    const passActive = isPassActive(state.membership);
    return {
      ready: state.ready,
      age: state.age,
      cart: state.cart,
      address: state.address,
      membership: state.membership,
      orders: state.orders,
      passActive,
      allowAge: () => dispatch({ type: "set-age", age: "allowed" }),
      blockAge: () => dispatch({ type: "set-age", age: "blocked" }),
      addToCart: (productId, qty = 1) => dispatch({ type: "add", productId, qty }),
      setQty: (productId, qty) => dispatch({ type: "set-qty", productId, qty }),
      setAddress: (address) => dispatch({ type: "set-address", address }),
      joinPass: () => dispatch({ type: "join" }),
      cancelPass: () => dispatch({ type: "cancel-membership" }),
      keepPass: () => dispatch({ type: "keep-membership" }),
      placeOrder: () => {
        if (!state.address?.inZone || state.cart.length === 0 || !deliveryWindow().open) return null;
        const lines = state.cart.flatMap((line) => {
          const product = getProduct(line.productId);
          if (!product) return [];
          return [
            {
              productId: product.id,
              name: sampleName(product.name),
              qty: line.qty,
              unitPriceCents: product.priceCents,
              driedEquivalentMg: product.driedEquivalentMg,
            },
          ];
        });
        if (lines.length === 0) return null;
        const priced = quote({
          lines: lines.map((line) => ({
            priceCents: line.unitPriceCents,
            qty: line.qty,
            driedEquivalentMg: line.driedEquivalentMg,
          })),
          passActive,
          inZone: true,
        });
        if (priced.overLimit) return null;
        const order: Order = {
          id: nextOrderId(state.orders),
          placedAt: Date.now(),
          lines,
          addressLabel: `${state.address.line1}, ${state.address.city}, ON ${formatPostal(state.address.postal)}`,
          membershipApplied: priced.membershipApplied,
          subtotalCents: priced.subtotalCents,
          deliveryFeeCents: priced.deliveryFeeCents,
          listDeliveryFeeCents: priced.listDeliveryFeeCents,
          hstCents: priced.hstCents,
          totalCents: priced.totalCents,
          driedEquivalentMg: priced.driedEquivalentMg,
        };
        dispatch({ type: "place-order", order });
        return order.id;
      },
      resetSession: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "/";
      },
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used within StoreProvider");
  return value;
}

export function isPassActive(membership: Membership | null, now = Date.now()): boolean {
  return Boolean(membership && membership.status === "active" && membership.currentPeriodEnd > now);
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { getProduct } from "@/lib/catalog";
import { quote } from "@/lib/quote";
import { useStore } from "@/lib/store";
import { checkZone, formatPostal } from "@/lib/zone";

const PRESETS = [
  {
    id: "in",
    label: "In-zone sample",
    line1: "18 Sample Avenue",
    city: "Oshawa",
    postal: "L1H 2B3",
  },
  {
    id: "out",
    label: "Out-of-zone sample",
    line1: "200 Sample Street",
    city: "Toronto",
    postal: "M5V 1A1",
  },
] as const;

export function AddressScreen() {
  const { cart, address, setAddress, passActive } = useStore();
  const [line1, setLine1] = useState(address?.line1 ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [postal, setPostal] = useState(address?.postal ?? "");
  const [message, setMessage] = useState<string | null>(address ? null : null);
  const [inZone, setInZone] = useState<boolean | null>(address?.inZone ?? null);

  const lines = cart.flatMap((line) => {
    const product = getProduct(line.productId);
    if (!product) return [];
    return [{ priceCents: product.priceCents, qty: line.qty, driedEquivalentMg: product.driedEquivalentMg }];
  });
  const overLimit = quote({ lines, passActive, inZone: true }).overLimit;
  const dirty =
    !address ||
    address.line1 !== line1.trim() ||
    address.city !== city.trim() ||
    formatPostal(address.postal) !== formatPostal(postal);
  const savedInZone = Boolean(address?.inZone) && !dirty;

  function apply(next: { line1: string; city: string; postal: string }) {
    const result = checkZone(next);
    setLine1(next.line1);
    setCity(next.city);
    setPostal(formatPostal(next.postal));
    setMessage(result.message);
    setInZone(result.ok ? result.inZone : null);
    if (result.ok) {
      setAddress({
        line1: next.line1.trim(),
        city: next.city.trim(),
        province: "ON",
        postal: formatPostal(next.postal),
        inZone: result.inZone,
      });
    }
  }

  if (cart.length === 0) {
    return (
      <div className="stack">
        <h1>Address</h1>
        <p>Add a sample product before entering an address.</p>
        <Link href="/shop" className="btn btn-primary">
          Browse sample products
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <h1>Delivery address</h1>
      <p className="fine">
        Ontario residences only. The zone check is sample data for Oshawa postal codes L1G, L1H, L1J, L1K, and L1L.
      </p>
      <div className="chips">
        {PRESETS.map((preset) => (
          <button key={preset.id} type="button" className="chip" onClick={() => apply(preset)}>
            {preset.label}
          </button>
        ))}
      </div>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          apply({ line1, city, postal });
        }}
      >
        <label className="field">
          <span>Street</span>
          <input value={line1} onChange={(event) => setLine1(event.target.value)} autoComplete="address-line1" />
        </label>
        <label className="field">
          <span>City</span>
          <input value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" />
        </label>
        <label className="field">
          <span>Province</span>
          <input value="Ontario" disabled />
        </label>
        <label className="field">
          <span>Postal code</span>
          <input
            value={postal}
            onChange={(event) => setPostal(event.target.value)}
            autoComplete="postal-code"
            inputMode="text"
          />
        </label>
        <button type="submit" className="btn btn-ghost btn-block">
          Check address
        </button>
      </form>
      {dirty && (line1.trim() || city.trim() || postal.trim()) ? (
        <p className="fine">Check the address to refresh the zone result.</p>
      ) : message ? (
        <p className={inZone ? "notice ok" : "notice bad"} role="status">
          {message}
        </p>
      ) : address ? (
        <p className={address.inZone ? "notice ok" : "notice bad"} role="status">
          {address.inZone ? "Saved sample address is inside the zone." : "Saved sample address is outside the zone."}
        </p>
      ) : null}
      {overLimit && <p className="notice bad">The cart is over 30 g dried equivalent. Checkout stays blocked.</p>}
      {savedInZone && !overLimit ? (
        <Link href="/checkout" className="btn btn-primary btn-block">
          Continue to checkout
        </Link>
      ) : (
        <button type="button" className="btn btn-primary btn-block" disabled>
          Continue to checkout
        </button>
      )}
    </div>
  );
}

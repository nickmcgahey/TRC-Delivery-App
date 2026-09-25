"use client";

import Link from "next/link";
import { getProduct, sampleName } from "@/lib/catalog";
import { formatGramsFromMg } from "@/lib/equivalency";
import { formatCad } from "@/lib/money";
import { quote } from "@/lib/quote";
import { useStore } from "@/lib/store";
import { GramMeter } from "../ui";

export function CartScreen() {
  const { cart, setQty, passActive, address } = useStore();
  const lines = cart.flatMap((line) => {
    const product = getProduct(line.productId);
    if (!product) return [];
    return [{ line, product }];
  });
  const priced = quote({
    lines: lines.map(({ line, product }) => ({
      priceCents: product.priceCents,
      qty: line.qty,
      driedEquivalentMg: product.driedEquivalentMg,
    })),
    passActive,
    inZone: Boolean(address?.inZone),
  });

  if (lines.length === 0) {
    return (
      <div className="stack">
        <h1>Cart</h1>
        <p>Your cart is empty.</p>
        <Link href="/shop" className="btn btn-primary">
          Browse sample products
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <h1>Cart</h1>
      <GramMeter mg={priced.driedEquivalentMg} />
      <p className="fine">
        Prototype tip: three bags of Sample: Harbour Lot Flower (14 g each) are 42.00 g and block checkout.
      </p>
      <ul className="cart-list">
        {lines.map(({ line, product }) => (
          <li key={product.id}>
            <div>
              <p className="product-name">{sampleName(product.name)}</p>
              <p className="fine">
                {formatGramsFromMg(product.driedEquivalentMg * line.qty)} g dried eq. ·{" "}
                {formatCad(product.priceCents * line.qty)}
              </p>
            </div>
            <div className="qty">
              <button
                type="button"
                onClick={() => setQty(product.id, line.qty - 1)}
                aria-label={`Decrease quantity of ${sampleName(product.name)}`}
              >
                −
              </button>
              <span className="num">{line.qty}</span>
              <button
                type="button"
                onClick={() => setQty(product.id, line.qty + 1)}
                aria-label={`Increase quantity of ${sampleName(product.name)}`}
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
      <details className="card">
        <summary>How this prototype counts grams</summary>
        <p className="fine">
          Sample math uses the public possession table, not live Breadstack “Equivalent To” data.
        </p>
        <ul className="plain">
          <li>Dried flower and pre-rolls: 1 g = 1 g dried</li>
          <li>Edibles: 15 g = 1 g dried</li>
          <li>Liquid products, including beverages: 70 g = 1 g dried</li>
          <li>Concentrates, including vapes: 0.25 g = 1 g dried</li>
        </ul>
      </details>
      <div className="row spread">
        <span>Subtotal</span>
        <span className="num">{formatCad(priced.subtotalCents)}</span>
      </div>
      {priced.overLimit ? (
        <button type="button" className="btn btn-primary btn-block" disabled>
          Checkout blocked
        </button>
      ) : (
        <Link href="/address" className="btn btn-primary btn-block">
          Enter delivery address
        </Link>
      )}
    </div>
  );
}

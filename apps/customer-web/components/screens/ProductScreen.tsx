"use client";

import Link from "next/link";
import { useState } from "react";
import { categoryLabel, getProduct, sampleName } from "@/lib/catalog";
import { formLabel, formatGramsFromMg } from "@/lib/equivalency";
import { formatCad } from "@/lib/money";
import { useStore } from "@/lib/store";

export function ProductScreen({ id }: { id: string }) {
  const product = getProduct(id);
  const { addToCart } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="stack">
        <h1>Not in the sample catalog</h1>
        <Link href="/shop" className="btn btn-primary">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <Link href="/shop" className="back">
        Shop
      </Link>
      <p className="kicker">{categoryLabel(product.category)} · Sample data</p>
      <h1>{sampleName(product.name)}</h1>
      <p className="price-lg num">{formatCad(product.priceCents)}</p>
      <p>{product.summary}</p>
      <dl className="facts">
        <div>
          <dt>Net</dt>
          <dd>{product.netLabel}</dd>
        </div>
        <div>
          <dt>Form</dt>
          <dd>{formLabel(product.form)}</dd>
        </div>
        <div>
          <dt>Dried equivalent</dt>
          <dd>{formatGramsFromMg(product.driedEquivalentMg)} g</dd>
        </div>
        <div>
          <dt>Cultivar label</dt>
          <dd>{product.cultivar}</dd>
        </div>
        <div>
          <dt>Potency</dt>
          <dd>{product.samplePotency}</dd>
        </div>
      </dl>
      <p className="fine">{product.equivalencyNote}</p>
      <div className="qty">
        <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">
          −
        </button>
        <span className="num">{qty}</span>
        <button type="button" onClick={() => setQty((value) => Math.min(5, value + 1))} aria-label="Increase quantity">
          +
        </button>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => {
          addToCart(product.id, qty);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1400);
        }}
      >
        {added ? "Added to cart" : "Add to cart"}
      </button>
      <p className="fine">Sample price before HST. Checkout adds 13% for this prototype.</p>
    </div>
  );
}

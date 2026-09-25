"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, PRODUCTS, categoryLabel, sampleName } from "@/lib/catalog";
import { formatGramsFromMg } from "@/lib/equivalency";
import { formatCad } from "@/lib/money";
export function ShopScreen() {
  const params = useSearchParams();
  const initial = params.get("category");
  const initialCategory = CATEGORIES.some((category) => category.id === initial) ? initial : "all";
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const next = params.get("category");
    if (next && CATEGORIES.some((item) => item.id === next)) setCategory(next);
  }, [params]);

  const products = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      if (category !== "all" && product.category !== category) return false;
      if (!needle) return true;
      const haystack = `${product.name} ${product.cultivar} ${product.summary}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [category, query]);

  return (
    <div className="stack">
      <section>
        <p className="kicker">Sample catalog</p>
        <h1>Shop</h1>
        <p className="fine">Fictional products and prices. Nothing here is on the live menu.</p>
      </section>

      <label className="field">
        <span>Search</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sample products"
          type="search"
        />
      </label>

      <div className="chips" role="tablist" aria-label="Categories">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category === item.id ? "chip active" : "chip"}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <p>No sample products match.</p>
      ) : (
        <ul className="product-list">
          {products.map((product) => (
            <li key={product.id}>
              <Link href={`/shop/${product.id}`} className="product-row">
                <span className="swatch" data-category={product.category} aria-hidden="true" />
                <span>
                  <span className="product-cat">{categoryLabel(product.category)}</span>
                  <span className="product-name">{sampleName(product.name)}</span>
                  <span className="fine">
                    {product.netLabel} · {formatGramsFromMg(product.driedEquivalentMg)} g dried eq.
                  </span>
                </span>
                <span className="num price">{formatCad(product.priceCents)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { formatDay } from "@/lib/dates";
import { formatCad, MEMBERSHIP_PRICE_CENTS } from "@/lib/money";
import { useStore } from "@/lib/store";
import { HoursBanner, LicenceFacts, RetailSeal } from "../ui";

export function HomeScreen() {
  const { membership, passActive, resetSession } = useStore();
  return (
    <div className="stack">
      <section>
        <p className="kicker">Independent retailer</p>
        <h1>Oshawa store</h1>
        <p className="lede">
          Same-day delivery from the shop, plus pickup and curbside. This prototype uses sample products only.
        </p>
      </section>

      <HoursBanner />

      <section className="card">
        <h2>Store</h2>
        <p>Twisted Roots Cannabis</p>
        <p className="fine">Street address placeholder · Oshawa, Ontario</p>
        <p className="fine">
          Delivery is 9:00 a.m. to 11:00 p.m. Eastern, and only while the store is open. This prototype uses that
          same window as store hours.
        </p>
        <p className="fine">Monaghan is not part of this prototype.</p>
      </section>

      <RetailSeal />
      <LicenceFacts />

      <section>
        <h2>Browse</h2>
        <div className="chips">
          {CATEGORIES.filter((category) => category.id !== "all").map((category) => (
            <Link key={category.id} href={`/shop?category=${category.id}`} className="chip">
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="card pass-card">
        <p className="kicker">Delivery Pass</p>
        {passActive && membership ? (
          <>
            <h2>Active</h2>
            <p>
              In-zone delivery fee is $0.00 until{" "}
              {membership.cancelAtPeriodEnd ? "the Pass ends" : "renewal"} on{" "}
              {formatDay(membership.currentPeriodEnd)}.
            </p>
          </>
        ) : (
          <>
            <h2>{formatCad(MEMBERSHIP_PRICE_CENTS)} + tax / month</h2>
            <p>A paid delivery service. The in-zone delivery fee is included while the Pass is active.</p>
          </>
        )}
        <Link href="/membership" className="btn btn-primary">
          {passActive ? "Manage Delivery Pass" : "View Delivery Pass"}
        </Link>
      </section>

      <section className="card">
        <h2>How a sample order works</h2>
        <ol className="steps">
          <li>Shop the sample catalog. The cart counts dried equivalent and stops at 30 g.</li>
          <li>Check a sample address, then pay with the mock BlazePay step. Nothing is charged.</li>
          <li>Watch a simulated driver on the tracking screen.</li>
        </ol>
      </section>

      <button type="button" className="btn btn-ghost" onClick={resetSession}>
        Reset sample session
      </button>
    </div>
  );
}

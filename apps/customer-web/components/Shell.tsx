"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Mark, RetailSeal } from "./ui";

const TABS = [
  { id: "home", href: "/", label: "Home" },
  { id: "shop", href: "/shop", label: "Shop" },
  { id: "cart", href: "/cart", label: "Cart" },
  { id: "orders", href: "/orders", label: "Orders" },
  { id: "membership", href: "/membership", label: "Pass" },
] as const;

function tabFor(pathname: string): (typeof TABS)[number]["id"] {
  if (pathname.startsWith("/shop")) return "shop";
  if (
    pathname.startsWith("/cart") ||
    pathname.startsWith("/address") ||
    pathname.startsWith("/checkout")
  ) {
    return "cart";
  }
  if (pathname.startsWith("/orders")) return "orders";
  if (pathname.startsWith("/membership")) return "membership";
  return "home";
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, age, cart, allowAge, blockAge, resetSession } = useStore();
  const count = cart.reduce((sum, line) => sum + line.qty, 0);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Prototype still works if the worker does not install. */
    });
  }, []);

  if (!ready) {
    return (
      <div className="app boot">
        <p>Twisted Roots Cannabis</p>
      </div>
    );
  }

  if (age !== "allowed") {
    return (
      <div className="app gate">
        <div className="gate-card">
          <Mark size={48} />
          <p className="kicker">Oshawa, Ontario</p>
          <h1>Twisted Roots Cannabis</h1>
          <p className="lede">
            You must be 19 or older to view this catalog. Cannabis is for adults in Ontario.
          </p>
          <p className="fine">Prototype with sample data. Not the live store. No order placed here is real.</p>
          <RetailSeal compact />
          {age === "blocked" ? (
            <div className="blocked" role="status">
              <p>You must be 19 or older to enter.</p>
              <button type="button" className="btn btn-ghost" onClick={resetSession}>
                Reset sample session
              </button>
            </div>
          ) : (
            <div className="stack">
              <button type="button" className="btn btn-primary btn-block" onClick={allowAge}>
                I am 19 or older
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={blockAge}>
                I am under 19
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const current = tabFor(pathname);

  return (
    <div className="app">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="top">
        <p className="banner">Sample data — not a real product, order, or payment.</p>
        <div className="header-bar">
          <Link href="/" className="brand">
            <Mark size={34} />
            <span>
              <strong>Twisted Roots</strong>
              <small>Cannabis · Oshawa</small>
            </span>
          </Link>
        </div>
      </header>
      <main id="content" className="main">
        {children}
      </main>
      <footer className="legal-line">
        <p>Ontario cannabis retail seal: placeholder · CRSA licence: placeholder · 19+</p>
      </footer>
      <nav className="nav" aria-label="Primary">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={current === tab.id ? "page" : undefined}
            className={current === tab.id ? "active" : undefined}
          >
            <NavIcon id={tab.id} />
            <span>{tab.label}</span>
            {tab.id === "cart" && count > 0 && <em className="badge">{count}</em>}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function NavIcon({ id }: { id: (typeof TABS)[number]["id"] }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (id === "home") {
    return (
      <svg {...common}>
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M7 10.5V20h10v-9.5" />
      </svg>
    );
  }
  if (id === "shop") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (id === "cart") {
    return (
      <svg {...common}>
        <path d="M5 7h14l-1.2 11H6.2L5 7Z" />
        <path d="M9 7V5.5A3 3 0 0 1 12 2.5 3 3 0 0 1 15 5.5V7" />
      </svg>
    );
  }
  if (id === "orders") {
    return (
      <svg {...common}>
        <path d="M6 4h12v16H6z" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

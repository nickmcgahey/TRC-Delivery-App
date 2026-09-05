# TRC Delivery Platform — Architecture & Delivery Plan

**Product:** Twisted Roots Cannabis (TRC) same-day delivery  
**Repo:** `TRC-Delivery-App` (greenfield)  
**System of record today:** [trcannabis.ca](https://trcannabis.ca) — WordPress + WooCommerce 10.9 + Breadstack (`deepknead`) on Cloudways  
**Staging:** [https://wordpress-1668181-6656169.cloudwaysapps.com](https://wordpress-1668181-6656169.cloudwaysapps.com) (Cloudways clone; `noindex`) — **WP is up, but WooCommerce / Breadstack / CanFleet REST namespaces are not exposed yet** (likely plugins inactive or clone incomplete)  
**Stores:** Oshawa (live pickup/curbside), Monaghan (catalog location present; storefront incomplete)  
**Architecture decision:** **Hybrid** (locked) — CanFleet for fleet/dispatch/POD; TRC-built customer apps + compliance gateway; Woo/Breadstack remains commerce SoR. Full custom fleet deferred to Phase 3 only if CanFleet gaps block ops.  
**Payments decision:** **BlazePay** (locked) — primary processor; Payfirma/`betpg` remain fallbacks if already configured; Stripe out of scope.

This plan defines how a customer web/PWA + mobile app, driver app, and admin dispatch dashboard integrate with the existing retail inventory and order stack, while meeting Ontario AGCO delivery rules.

---

## 1. Executive recommendation

**Do not rebuild commerce from scratch.** Keep WooCommerce/Breadstack as the inventory and order system of record. Build (or wrap) delivery UX in this repo around that core.

**Chosen path: Hybrid (configure + wrap)** — stakeholder-approved.

| Layer | Approach |
|---|---|
| Catalog, cart, stock, taxes, tips | WooCommerce Store API + Breadstack location/warehouse model |
| Payments | **BlazePay** (chosen); Payfirma/`betpg` as existing fallbacks only; Stripe explicitly out of scope |
| Dispatch, driver app, GPS tracking, POD | Enable **Breadstack Delivery (CanFleet)** — plugin already connected (`bs-cf`) but delivery rates are not live at checkout |
| Branded customer ordering + tracking | New PWA / React Native app in this repo |
| Admin dispatch UX | CanFleet dispatch first; optional custom dashboard later if branding/ops require it |
| Compliance rules (age, gram limits, zones, hours) | Shared **Compliance & Pricing service** owned by TRC, enforced before checkout and again at POD |

**Why not a full custom fleet stack first?** CanFleet already covers driver assignment, GPS, ETA, notifications, and proof-of-delivery. Rebuilding that while also shipping a customer app doubles scope and compliance risk. Custom dispatch remains a Phase 3 option if CanFleet gaps block operations.

**Payments:** Stakeholder chose **BlazePay**. Do not integrate Stripe. Keep a thin payment adapter so Payfirma/`betpg` can still settle existing orders if those gateways remain enabled on the store, but all new delivery checkout work targets BlazePay.

---

## 2. Current-state integration map

### What already exists

- ~406 variable products; stock is **per variation / per location** (`pa_locations`)
- Warehouse IDs in Breadstack `locationData` for Oshawa and Monaghan
- Shipping today: `cantec_local_pickup`, `curbside_pickup` only — location mode is `pick_up_in_store`
- Soft age gate (19+) + checkout DOB field
- HST 13% (Ontario); WPC Order Tip plugin
- CanFleet REST namespaces installed: `bs-cf`, `bs-localpickup`, `bs-curbsidepickup` (status: Connect Successful)
- Google Maps UI hooks exist; **API key currently empty**

### What must be built or enabled

- Live **delivery** shipping method + zone fees at checkout
- Hard **equivalent-gram** cart limits (30 g dried / equivalent) across the order
- Doorstep **ID verification / POD** workflow for drivers (AGCO: ID required if recipient appears under 25)
- Customer **real-time tracking** surface (map + ETA)
- Push notifications (order lifecycle)
- Installable **PWA** + native customer/driver apps (or CanFleet driver app + TRC customer app)
- Admin dispatch visibility across stores
- Finish Monaghan storefront/location selection before advertising multi-store delivery

### Wholesale note

Public site is **retail B2C only**. No wholesale roles/pricing found. If wholesale delivery is required later, treat it as a separate B2B channel with distinct pricing, credit terms, and compliance — out of MVP scope.

---

## 3. Compliance constraints (Ontario AGCO)

These are hard product requirements, not nice-to-haves:

1. **In-house drivers only** — CRSA holder or employees; no third-party couriers.
2. **Store-bound fulfillment** — order placed with a specific store; fulfilled from that store’s on-premises inventory.
3. **Delivery window** — 9 a.m.–11 p.m. (confirm against latest O. Reg. amendments before launch).
4. **Residence / private place only** in Ontario; address on the order is the only drop-off.
5. **Age 19+** — reasonable measures on web/app; ID check at door when recipient appears under 25.
6. **Public possession limit** — 30 g dried cannabis or equivalent (enforce in cart using Breadstack “Equivalent To” data).
7. **Return unsold runs same day** to originating store.
8. **Store must not operate predominantly as a delivery business.**
9. Online platforms must show **Ontario cannabis retail seal** + CRSA details.
10. Delivery records retained for audit.

Product UX must encode these as guards (checkout blocks, zone geofences, driver checklists), not only as SOP docs.

---

## 4. Target architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         Client surfaces                              │
│  Customer PWA/Web   Customer iOS/Android   Driver App   Admin Web    │
└───────────────┬───────────────┬───────────────┬───────────┬──────────┘
                │               │               │           │
                ▼               ▼               ▼           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     TRC Delivery API Gateway                         │
│         Auth (JWT/session) · Rate limits · Store scoping             │
└───────┬───────────────────┬─────────────────────┬────────────────────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌───────────────┐  ┌─────────────────┐  ┌────────────────────────────┐
│ Compliance &  │  │  Tracking Hub   │  │  Notification Service      │
│ Pricing       │  │  (WS + Maps)    │  │  (FCM / APNs / Web Push)   │
│ · age/DOB     │  │  · driver GPS   │  │  · order events            │
│ · gram limits │  │  · customer map │  │  · ETA / nearby / POD      │
│ · zones/fees  │  │  · ETA          │  └────────────────────────────┘
│ · hours       │  └────────▲────────┘
└───────┬───────┘           │
        │                   │ GPS / task events
        ▼                   │
┌──────────────────────────────────────────────────────────────────────┐
│                 Integration adapters                                 │
│  WooCommerce Store API + WC REST v3  │  Breadstack / CanFleet        │
│  catalog · cart · orders · stock     │  dispatch · driver · POD      │
└──────────────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
   WP/MySQL (SoR)                 CanFleet fleet services
   Cloudways + Cloudflare
```

### Ownership of data

| Domain | Owner | Notes |
|---|---|---|
| Products, variations, stock | Woo / Breadstack | Location-scoped variations |
| Customers, addresses, DOB | Woo customers + TRC auth profile | DOB already collected at checkout |
| Orders & payments | Woo orders | Delivery meta + fulfillment status mirrored |
| Delivery tasks, driver GPS, POD | CanFleet (Phase 1) or TRC Tracking Hub (Phase 3) | Sync task IDs onto WC order meta |
| Delivery zones & fees | TRC Compliance & Pricing (source) → WC shipping rates / CanFleet geo locks | Single config UI in admin |
| Push device tokens | TRC Notification Service | Bound to customer/driver user IDs |

---

## 5. Applications

### 5.1 Customer Web / PWA

**Stack (recommended):** Next.js (App Router) + TypeScript, deployed as PWA (`manifest`, service worker for offline shell + web push).

**Jobs:**
- Age gate (19+) before catalog; persist attestation; show CRSA seal / store info
- Store selection (Oshawa / Monaghan) — cart is warehouse-scoped
- Browse catalog via Store API; respect stock `max_qty`
- Cart with live **equivalent-gram meter** and hard block at 30 g eq.
- Address capture → Google Places autocomplete → zone eligibility + fee quote
- Checkout: billing, DOB, tip, payment via adapter, delivery window (9–11)
- Order history + live tracking map (driver marker, ETA, status timeline)
- Push/opt-in: confirmed → preparing → out for delivery → nearby → delivered

**PWA specifics:** installable; cache catalog shell; never cache payment/PII pages; background sync only for non-sensitive prefs.

### 5.2 Customer mobile app

**Stack (recommended):** React Native (Expo) sharing API client + domain types with the PWA.

**Parity with PWA**, plus:
- Native push (FCM/APNs)
- Deep link into active tracking
- Camera only if future ID-upload KYC is required (MVP: attestation + DOB; doorstep ID is driver-side)

Ship PWA first if timeline is tight; native wraps the same backend.

### 5.3 Driver app

**Phase 1:** Use **CanFleet Driver App** (already part of Breadstack Delivery) for navigation, task accept/complete, and POD.

**TRC requirements to configure / extend via process + meta:**
- Shift login tied to employee identity (in-house only)
- Navigate via Google Maps / CanFleet routing
- Checklist: arrive → verify recipient ≥19 (ID if appears under 25) → capture ID type/last4 or photo per legal advice → signature + optional photo → mark delivered / failed-return
- Cannot mark delivered outside geofence of order address (configurable radius)
- Failed delivery → “return to store” task same day

**Phase 3 (only if CanFleet insufficient):** Custom Expo driver app talking to TRC Tracking Hub + WC order updates.

### 5.4 Admin dispatch dashboard

**Phase 1:** Breadstack/CanFleet dispatch (auto-assign, hours, multi-store).

**Phase 2 TRC Admin (Next.js):** ops console that staff prefer branded/internal:
- Live map of drivers + open orders per store
- Manual assign / reassign / cancel
- Zone & fee editor (polygons + pricing rules)
- Compliance reports: deliveries, ID checks, returns, gram totals
- Read Woo orders via authenticated WC REST; write fulfillment meta / notes
- Role-based access: `dispatcher`, `store_manager`, `owner` (WP application users or TRC auth)

---

## 6. Feature designs

### 6.1 Age verification

| Stage | Control |
|---|---|
| Entry | Soft gate: confirm 19+; block under-age; cookie/account flag |
| Account / checkout | Required DOB; reject if under 19; re-check on birthday edge cases |
| Platform chrome | Ontario retail seal + CRSA block on every storefront surface |
| Doorstep | Driver POD: visual age estimate; mandatory ID inspection if appears under 25; capture verification outcome (pass/fail/reason) |
| Audit | Immutable delivery verification event log |

Optional later: third-party age/ID vendors for high-risk accounts — not required for MVP if doorstep process is solid.

### 6.2 Order limits

Enforce **before payment** and re-validate server-side at order create:

- **30 g dried equivalent** using product `equivalent_to` (or Breadstack meta) summed across line items
- Per-SKU quantity caps already present in Store API (`quantity_limits`)
- Per-vehicle / per-run weight caps (ops config) for drivers
- One active delivery address; reject commercial/PO Box via Places types + denylist
- Delivery only during permitted hours; cut off checkout when ETA would land outside window

Expose a `POST /compliance/quote` endpoint that returns `{ allowed, gramEquivalent, fee, zoneId, reasons[] }`.

### 6.3 Zone-based fees

**Model:**
- Store-centric zones (Oshawa polygons, Monaghan polygons) as GeoJSON
- Rules: flat fee, distance bands, minimum order, surge/busy multiplier (optional), free-delivery threshold
- Geofence outside Ontario / restricted First Nations bands → hard deny
- Fee written to Woo as `shipping_lines` (or fee line) at checkout

**Admin UX:** draw/edit polygons on Google Maps; publish versioned zone configs; clients always quote against `published` version.

### 6.4 Payments

```text
PaymentProvider
  ├─ BlazePayProvider      (default — live)
  ├─ PayfirmaProvider      (live alternate)
  ├─ CodProvider           (if ops still allow; AGCO expects payment before leaving store — prefer prepaid)
  └─ StripeProvider        (feature-flagged; enable only if underwriting approved)
```

- Prefer **prepaid online** before driver leaves store (aligns with historical AGCO delivery conditions and fraud control).
- Webhooks reconcile `payment_intent` / gateway txn → Woo `processing`
- Never store PAN in TRC systems; use hosted fields / redirect per gateway SDK
- Refunds / partials flow through Woo + gateway adapter

### 6.5 Google Maps tracking

| Use | API |
|---|---|
| Address autocomplete & validation | Places |
| Zone membership | Maps JS + turf.js server-side on GeoJSON |
| Driver navigation | CanFleet / Google Maps navigation intent |
| Customer live map | Maps JS/SDK; driver point from Tracking Hub (throttled) |
| ETA | Distance Matrix or CanFleet ETA; refresh on GPS ticks |
| Static receipts / admin | Maps Static optional |

Store API key(s) server-side where possible; browser key HTTP-referrer restricted; mobile key app-restricted. Fill the currently empty `googleMapsApiKey` on the WP side for any remaining Breadstack location UI.

### 6.6 Push notifications

**Events → channels**

| Event | Customer | Driver | Dispatcher |
|---|---|---|---|
| Order paid / confirmed | Push + email | — | Dashboard |
| Preparing / ready | Push | — | — |
| Assigned / out for delivery | Push + tracking deep link | Push task | Live map |
| Driver nearby (geofence) | Push | — | — |
| Delivered / failed | Push | — | Alert on fail |
| Shift / reassign | — | Push | — |

**Stack:** Firebase Cloud Messaging + APNs; Web Push for PWA. Notification service subscribes to Woo webhooks + CanFleet/task events.

---

## 7. Order & fulfillment lifecycle

```text
draft → pending_payment → paid/processing → preparing
    → ready_for_dispatch → assigned → out_for_delivery
    → delivered | failed_return_to_store → completed | cancelled
```

- Map custom fulfillment states onto Woo status + order meta (`_trc_fulfillment_status`, `_trc_canfleet_task_id`, `_trc_pod_*`)
- Customer Store API continues to show coarse Woo status; tracking API returns fine-grained timeline
- Inventory: decrement on paid/processing per current Woo/Breadstack behavior; failed returns restock via documented ops path
- Location cookie / selected warehouse must match fulfillment store for the entire order

### Critical integration sequence (happy path)

1. Customer selects store → catalog filtered to that warehouse stock  
2. Cart validated by Compliance (`gram`, hours, age)  
3. Address → zone quote → shipping line  
4. Payment via provider → Woo order `processing`  
5. Webhook → Dispatch: create CanFleet delivery task pinned to store  
6. Budtender marks ready → auto/manual assign driver  
7. Driver GPS stream → Tracking Hub → customer map + nearby push  
8. POD capture → Woo meta + completed; notifications fire  
9. Audit log retained  

---

## 8. API surface (TRC Delivery Gateway)

Approximate MVP routes (BFF over Woo + CanFleet):

```text
POST   /auth/login | /auth/register | /auth/refresh
GET    /stores
GET    /catalog/products
POST   /cart/*                      # proxy Store API + inject compliance
POST   /compliance/quote
POST   /checkout
GET    /orders
GET    /orders/:id/tracking         # WS upgrade: /ws/tracking/:orderId
POST   /devices/register            # push tokens

# Admin
GET    /admin/dispatch/board
POST   /admin/dispatch/assign
CRUD   /admin/zones
CRUD   /admin/fees
GET    /admin/reports/deliveries

# Driver (Phase 3 custom only)
GET    /driver/tasks
POST   /driver/tasks/:id/pod
POST   /driver/location
```

Auth: customer JWT (or WP-backed session exchange); staff via WP Application Passwords / SSO; driver via CanFleet in Phase 1.

---

## 9. Suggested monorepo layout (this repo)

```text
TRC-Delivery-App/
├── apps/
│   ├── customer-web/          # Next.js PWA
│   ├── customer-mobile/       # Expo
│   ├── admin-web/             # Dispatch & config
│   └── driver-mobile/         # Phase 3 placeholder
├── packages/
│   ├── api/                   # Gateway / BFF
│   ├── domain/                # shared types, gram math, zone eval
│   ├── woo-client/            # Store API + WC REST
│   ├── canfleet-client/       # Breadstack delivery adapter
│   ├── payments/              # provider interface
│   └── ui/                    # shared design system
├── docs/
│   └── delivery-platform-plan.md
└── README.md
```

**Infra (typical):** API on Node (Nest or Hono) + Postgres (TRC-owned: zones, devices, audit, tracking snapshots) + Redis (pubsub/GPS fanout) + object storage for POD images. Woo remains on Cloudways.

---

## 10. Phased delivery

### Phase 0 — Enablement (ops + WP, little custom code)
- Confirm CanFleet subscription/config; turn on delivery shipping for Oshawa
- Set Google Maps keys (WP + future apps)
- Define first delivery polygons + fees in CanFleet/WC
- Document employee-driver SOP + CannSell requirements
- Staging WC Application Password + webhook endpoints for TRC API
- Decision gate: **Stripe eligible?** If no, lock BlazePay/Payfirma as MVP

### Phase 1 — MVP launch (Oshawa)
- Customer PWA: catalog, compliance cart, zone fees, checkout, order history
- Prepaid payment via existing gateway adapter
- CanFleet driver app + Breadstack dispatch live
- Customer tracking page fed by CanFleet/Tracking Hub
- Push: web push + email for core events
- Age gate + DOB + POD checklist
- Gram limit hard enforcement

### Phase 2 — Mobile + Monaghan + Admin polish
- Customer Expo app
- Monaghan location UX complete; dual-store dispatch
- TRC Admin map board + zone editor
- Richer analytics (delivery times, fail rates, fee revenue)
- Native push

### Phase 3 — Differentiation (only if needed)
- Custom driver app
- Advanced routing / batching beyond CanFleet
- Stronger ID verification vendor
- Wholesale channel (separate program)

---

## 11. Risks & open decisions

| Item | Risk | Decision needed |
|---|---|---|
| Stripe | Out of scope (BlazePay chosen) | No action |
| CanFleet fit | Plugin connected but delivery not selling | Validate feature gaps with Breadstack before custom fleet work |
| WP not in git | Hard to review theme/plugin changes | Export critical theme/plugin code or document WP change runbook |
| Monaghan readiness | Selector/page incomplete | Do not advertise until stock + UX verified |
| Real-time cost | GPS fanout + Maps quotas | Throttle driver updates (e.g. 5–10s); cache ETAs |
| Compliance drift | Reg amendments (hours, etc.) | Centralize rules in Compliance service with config versioning |
| `bs-*/api-key` exposure | Encrypted keys observed on public routes during probe | Harden before production integrations |
| Predominant delivery | AGCO restriction | Cap delivery share via ops policy; keep pickup/curbside prominent |

---

## 12. Success metrics

- Checkout → delivered conversion and median delivery minutes
- % orders within zone / fee accuracy (quote vs charged)
- Compliance: zero underage deliveries; 100% POD completion on attempted drops
- Gram-limit block rate (UX friction vs prevented over-limit)
- Driver utilization and failed-delivery return compliance (same-day)
- Push opt-in rate and “where is my order?” support ticket reduction

---

## 13. Immediate next actions

1. ~~**Stakeholder decision:** Hybrid vs full custom fleet.~~ **Done — Hybrid chosen.**  
2. ~~**Payments:**~~ **Done — BlazePay; Stripe out of scope.**  
3. ~~**Staging WordPress clone:**~~ **Done — URL:** `https://wordpress-1668181-6656169.cloudwaysapps.com`  
4. **Unblock staging commerce stack:** on that site, activate/restore **WooCommerce + Breadstack (`deepknead`) + CanFleet** (and related pickup plugins). Public REST currently only shows core WP namespaces — no `wc/*` or `bs-cf/*` routes. Ask Breadstack if the clone was meant to include plugins/data.  
5. **Then from staging WP:** confirm Administrator role → create WooCommerce REST API keys; enable CanFleet delivery; BlazePay test/sandbox; Google Maps key.  
6. **Phase 0 config** on staging: delivery shipping, one Oshawa zone + fees, test employee-driver.  
7. **Scaffold monorepo** in this repo (`apps/customer-web` + `packages/api` + `woo-client` + `canfleet-client`).  
8. **Implement Compliance quote** (grams + zone fee) against Store API cart.  
9. **Payment adapter spike** on BlazePay (sandbox/test mode).  
10. **Cloudways:** optional for app build — only needed later for hosting ops (re-clone, DNS/SSL, server logs, PHP/stack tweaks).

### Staging access — status

| Access item | Needed for app testing? | Status |
|---|---|---|
| Staging WP URL | Yes | **Have it** — `https://wordpress-1668181-6656169.cloudwaysapps.com` |
| Staging WP admin login | Yes | Owner has access |
| WooCommerce + Breadstack on staging | Yes | **Blocked** — REST has no `wc` / `bs-*` namespaces yet |
| WC REST keys (from staging WP) | Yes | After Woo is active: WooCommerce → Settings → Advanced → REST API |
| CanFleet / Breadstack Delivery on staging | Yes | After plugins active |
| BlazePay sandbox / test mode | Yes | Gateway settings on staging (avoid live charges) |
| Google Maps keys | Yes | Google Cloud Console (not Cloudways) |
| Cloudways panel | No for app API work | Nice-to-have for clone/DNS/SSL/server ops only |
| Webhooks to TRC API | When API is deployed | Configure from WP once staging API URL exists |

**Cloudways is not required** to start building/testing once staging has Woo/Breadstack healthy. Prefer an **Administrator** role on staging — Shop Manager alone often cannot create API keys or enable delivery modules.

---

## Appendix A — Key endpoints (integration cheat sheet)

Use the **staging** host while building; production host only for live cutover.

| Purpose | Staging | Production |
|---|---|---|
| Site | `https://wordpress-1668181-6656169.cloudwaysapps.com` | `https://trcannabis.ca` |
| Catalog | `GET /wp-json/wc/store/v1/products` | same path |
| Cart | `/wp-json/wc/store/v1/cart/*` | same path |
| Checkout | `POST /wp-json/wc/store/v1/checkout` | same path |
| Admin orders/products | `/wp-json/wc/v3/*` (auth) | same path |
| CanFleet | `/wp-json/bs-cf/*` | same path |
| Local/curbside pickup | `/wp-json/bs-localpickup/*`, `/wp-json/bs-curbsidepickup/*` | same path |
| Location AJAX | `bs_set_shipping_method`, `bs_location_*` via `admin-ajax.php` | same path |

**Note (2026-09-05):** Staging currently exposes only core WP REST namespaces. Until WooCommerce/Breadstack are active on the clone, the `wc/*` and `bs-*` rows above will 404.

## Appendix B — Equivalent gram reference (public possession)

| Product form | Equivalent to 1 g dried |
|---|---|
| Fresh cannabis | 5 g |
| Edibles | 15 g |
| Liquid product | 70 g |
| Concentrates (solid/liquid) | 0.25 g |
| Plant seed | 1 seed |

Cart engine should use store-provided `equivalent_to` when present; fall back to this table only with merchandising sign-off.

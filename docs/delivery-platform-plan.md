# TRC Delivery Platform — Architecture & Delivery Plan

**Product:** Twisted Roots Cannabis (TRC) same-day delivery  
**Repo:** `TRC-Delivery-App` (greenfield)  
**System of record today:** [trcannabis.ca](https://trcannabis.ca) — WordPress + WooCommerce 10.9 + Breadstack (`deepknead`) on Cloudways  
**Staging:** [https://wordpress-1668181-6656169.cloudwaysapps.com](https://wordpress-1668181-6656169.cloudwaysapps.com) (Cloudways clone; `noindex`) — **WP is up, but WooCommerce / Breadstack / CanFleet REST namespaces are not exposed yet** (likely plugins inactive or clone incomplete)  
**Stores:** Oshawa (live pickup/curbside), Monaghan (catalog location present; storefront incomplete)  
**Architecture decision:** **Hybrid** (locked) — CanFleet for fleet/dispatch/POD; TRC-built customer apps + compliance gateway; Woo/Breadstack remains commerce SoR. Full custom fleet deferred to Phase 3 only if CanFleet gaps block ops.  
**Payments decision:** **BlazePay** (locked) — primary processor; Payfirma/`betpg` remain fallbacks if already configured; Stripe out of scope.  
**Delivery Pass (planned):** Monthly delivery membership at **$7.99 + Ontario HST (13%)**, recurring, billed by TRC through BlazePay if BlazePay supports recurring charges (open question). Active members get the in-zone per-delivery fee set to **$0**. Framed strictly as a paid delivery service — not a cannabis discount, loyalty program, or spend threshold. See §6.7.

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
| Delivery Pass | **TRC-owned membership service** (recommended) + BlazePay for the monthly charge; Compliance zeroes the in-zone delivery fee for active members. Not WooCommerce Subscriptions for MVP. Not Apple/Google in-app purchase. See §6.7 |

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
│ · membership  │           │
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
| Delivery Pass membership | TRC Postgres (recommended) | Status, period, cancel, audit. Woo stores only the resulting shipping line on each cannabis order ($0 or the zone fee), not the subscription. See §6.7 |
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
- Delivery Pass: price ($7.99 + HST), start, renewal date, cancel at period end; checkout zeroes the delivery fee for an active member inside the zone
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

Expose a `POST /compliance/quote` endpoint that returns `{ allowed, gramEquivalent, fee, listFee, feeWaived, zoneId, reasons[], membership }`. `fee` is what the customer is charged for delivery. `listFee` is the published in-zone fee. `feeWaived` is true only for an **active** Delivery Pass inside the zone (§6.7).

### 6.3 Zone-based fees

**Model:**
- Store-centric zones (Oshawa polygons, Monaghan polygons) as GeoJSON
- Rules: flat per-delivery fee, distance bands, optional busy multiplier
- **No “free delivery over $X” and no minimum cannabis spend.** A threshold or minimum tied to the cannabis cart is a purchase inducement and is out of scope. The only fee waiver is an active Delivery Pass, which does not depend on order total (§6.7)
- Geofence outside Ontario / restricted First Nations bands → hard deny
- Fee written to Woo as `shipping_lines` (or fee line) at checkout. Active Pass: the line is still written, with total `$0.00` and meta naming the membership, so the waiver is auditable. The line is not omitted

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
- **Delivery Pass billing uses the same processor (BlazePay), not a second one.** Do not sell the Pass or cannabis through Apple In-App Purchase or Google Play billing. The customer app is PWA-first, which sidesteps the app stores; Google Play does not allow cannabis sales apps. Recurring support on BlazePay is unconfirmed — see §6.7.

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

### 6.7 Delivery Pass (membership)

A monthly **Delivery Pass**: the customer pays for delivery service in advance. While the Pass is active, the in-zone per-delivery fee on a cannabis order is **$0**. Cannabis prices do not change. This is the only delivery-fee waiver in the product.

**Price (locked for the plan; tax math is deterministic):**

| | Amount |
|---|---|
| Service price | $7.99 CAD / month, before tax |
| Ontario HST | 13% |
| HST on $7.99 | $1.04 (799 × 13 / 100 = 103.87 cents, rounded half-up to 104) |
| Total charged each month | **$9.03 CAD** |
| Billing interval | Monthly, auto-renewing until cancelled |
| Per-order minimum | None |
| What it covers | The published in-zone delivery fee |

The Pass is a delivery-service charge. It is not a cannabis SKU, not store credit, and not a coupon.

#### Why the framing is strict

Federal **Cannabis Act s.24** and **AGCO Registrar’s Standard 6.3** prohibit inducements to purchase cannabis (stakeholder framing; counsel confirms how those provisions apply to this offer before launch). The Pass has to read as a paid delivery service the retailer sells, including when the customer does not add cannabis to the cart in the same step.

**In the product:**

- Name it **Delivery Pass**. Customer copy says the delivery fee is **included** or **$0.00**, not “FREE DELIVERY”, and never “free delivery over $X”.
- No minimum order, no points, no points redeemable on cannabis, no free cannabis, no free accessories, no gift with purchase, no contest or draw tied to an order.
- Joining, renewing, and cancelling do not require a cannabis purchase.
- The Pass does not enlarge the delivery zone, the hours, or the 30 g limit.
- **Not in MVP — requires legal review, do not build:** member discounts on cannabis, member pricing, early access to products or drops, birthday rewards, referral credits, and any other benefit that changes the cannabis offer.

Marketing and UI must not use lifestyle imagery or health claims around the Pass (same rule as the rest of the storefront).

#### Where the subscription lives

**Recommendation: a TRC-owned membership service** in the Delivery API gateway, stored in TRC Postgres. BlazePay is the biller. WooCommerce remains the system of record for cannabis orders only. WooCommerce Subscriptions is not the MVP system of record.

| | TRC-owned membership (recommended) | WooCommerce Subscriptions |
|---|---|---|
| Compliance boundary | The Pass is a delivery-service record. It never appears as a cannabis catalog promotion. | A subscription product sits in the Woo catalog and order stream, which makes it easier to mistake for a loyalty or discount program. |
| Fit with this architecture | Zones, audit, devices, and tracking snapshots are already TRC Postgres data. Membership belongs with them. | Woo stays the commerce SoR and would also own renewal orders, tax, and dunning UI. |
| BlazePay | A thin billing adapter calls BlazePay’s recurring or scheduled-charge API if it exists, and applies webhooks to membership status. | Works only if BlazePay (or a bridge) is a Subscriptions-compatible gateway. That is unknown. |
| Tax | The gateway charges $7.99 + 13% HST as a delivery-service total ($9.03). Accounting can mirror the charge outside the cannabis cart. | HST can use Woo tax classes if a non-cannabis subscription product is set up correctly. |
| Cancel, disclosure, audit | The customer app and an append-only event log own the wording and the history. | Relies on Subscriptions’ customer screens and WP records that are outside this git repo. |
| Cost of the choice | TRC builds status changes, failed-payment handling, and renewal notices. | Plugin licence, plus a WP change that is hard to review. Does not help if BlazePay cannot tokenize a reusable payment method. |

**Reopen this decision only if** BlazePay’s supported recurring path is the official WooCommerce Subscriptions gateway and counsel is comfortable with the Pass living on Woo. Until then, do not add the Subscriptions plugin for this feature.

#### Data model

```text
delivery_memberships
  id                        uuid
  woo_customer_id           bigint          # Woo customer link. No card data.
  plan                      text            # 'delivery_pass'
  status                    text            # pending | active | past_due | cancelled | expired
  price_cents               int             # 799
  currency                  char(3)         # CAD
  tax_rate_bps              int             # 1300 = 13.00%
  current_period_start      timestamptz
  current_period_end        timestamptz     # renewal date; fee waiver ends here
  cancel_at_period_end      boolean
  cancelled_at              timestamptz null
  billing_provider          text            # 'blazepay'
  provider_customer_id      text null
  provider_subscription_id  text null       # or schedule id — shape depends on BlazePay
  created_at / updated_at

delivery_membership_events                 # append-only
  id, membership_id, type, at, payload
  # started | renewed | payment_failed | cancel_scheduled
  # | cancelled | expired | reactivated
```

**Status:**

- `POST /membership` creates `pending` until the first BlazePay charge succeeds, then `active`.
- Renewal success: move `current_period_end` forward one calendar month and stay `active`. Month-end clamping (31st → shorter month) is defined with the processor, not ad hoc in the client.
- Renewal failure: `past_due`. The delivery fee is **not** waived. Retry policy waits on BlazePay’s capabilities, then `expired` or back to `active`.
- Customer cancels: set `cancel_at_period_end`, keep `active` until `current_period_end`, then `cancelled`. No further charge.
- **MVP refund proposal:** no partial-month refund. Service continues through the period already paid. Counsel confirms before launch.

`past_due`, `cancelled`, and `expired` do not waive the fee. `cancel_at_period_end` still waives the fee until the period ends, because that month is paid.

#### How the fee is zeroed at checkout

1. Checkout calls `POST /compliance/quote` with the cart, the delivery address, and the customer id.
2. The service loads the membership and the published zone fee (`listFee`).
3. `feeWaived` is true only when all of these hold: status is `active`, `now < current_period_end`, the address is inside the published zone for that store, and age, hours, and gram checks already pass.
4. When `feeWaived` is true, `fee` is `0` and `listFee` is unchanged (so the client can show the comparison in quiet, factual copy).
5. The Woo order still gets a delivery `shipping_lines` (or fee) row. Total is `"0.00"` when waived, otherwise the zone fee. Meta includes `_trc_delivery_pass_id` and `_trc_list_delivery_fee`. Omitting the line would hide the waiver from finance and from an AGCO audit.
6. Outside the zone, `allowed` is false. The Pass does not buy a wider zone and does not write a $0 delivery to an address the store cannot serve.
7. The waiver is not a function of cart subtotal. There is no threshold and no minimum.

The customer PWA shows the delivery line as **$0.00** with “Delivery fee included with your Delivery Pass” for an active member, and the sample or published per-delivery fee for everyone else.

#### Billing, cancel, and auto-renewal disclosure

- Charge the Pass on **BlazePay** as a retailer billing relationship. Confirm BlazePay can: save a reusable payment method, charge it monthly, send webhooks for success and failure, and accept a cancel so the next charge does not run.
- Do **not** use Apple IAP or Google Play billing (see §6.4).
- The first charge and each renewal are for the delivery service ($9.03 tax-in). They are not line items on a cannabis order.
- Before the customer confirms, show: the $7.99 price, HST of $1.04, the $9.03 monthly total, that it **renews automatically each month until cancelled**, and how to cancel (in the app, effective at period end).
- Send a receipt that calls the charge a delivery service fee.
- Renewal reminder: follow whatever lead time Ontario’s consumer-protection rules require for auto-renewal. Counsel sets the lead time; the service must be able to email it.
- Cancel path is in the same membership screen as join: status, renewal date, “Cancel Delivery Pass”, and undo-cancel while the period is still running.

**Draft wording for counsel — not approved to ship:**

> Delivery Pass is a monthly delivery service from Twisted Roots Cannabis. The price is $7.99 plus HST (13%), which is $9.03 per month. It renews automatically each month until you cancel. You can cancel any time in the app. If you cancel, you will not be charged again, and the Pass stays active until the end of the current month. The Pass covers the in-zone delivery fee. It does not change cannabis prices, and it is not a discount, point program, or gift.

#### Lawyer review (required before launch)

Counsel reviews and, if needed, rewrites every customer-facing string before the Pass is offered:

1. Cannabis Act s.24 and AGCO Registrar’s Standard 6.3 — is a prepaid in-zone delivery fee, sold on its own, an inducement to purchase cannabis if the only thing TRC delivers is cannabis?
2. Final name and the words used instead of “free delivery”.
3. Auto-renewal consent, price, interval, cancel method, and reminder timing under Ontario consumer-protection rules.
4. Mid-cycle cancel: no partial refund (proposal) vs a pro-rata refund.
5. Predominant-delivery restriction: the Pass must not turn the store into a delivery-primary business. Pickup and curbside stay visible.
6. Written confirmation that member cannabis discounts, early access, points, gifts, contests, and spend-threshold free delivery stay **out** until a separate opinion says otherwise. Those items are **requires legal review, not in MVP**.

#### Prototype

`apps/customer-web` includes a Delivery Pass screen on sample data: $7.99 + $1.04 HST = $9.03, join, renewal date, cancel at period end, and checkout with the delivery line at $0.00 for an active member versus a sample per-delivery fee otherwise. It does not call BlazePay or Woo. Sample copy is for the owner to react to, not approved legal copy.

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
3. Address → zone quote → shipping line (total `$0.00` when an active Delivery Pass waives the in-zone fee; otherwise the zone fee). The Pass charge itself is not a cannabis order line.  
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
POST   /compliance/quote            # includes fee, listFee, feeWaived, membership
POST   /checkout
GET    /orders
GET    /orders/:id/tracking         # WS upgrade: /ws/tracking/:orderId
POST   /devices/register            # push tokens

# Delivery Pass (TRC-owned; BlazePay bills — see §6.7)
GET    /membership                  # current customer; none | pending | active | past_due | cancelled | expired
POST   /membership                  # start Pass; returns membership + BlazePay billing step (no PAN)
POST   /membership/cancel           # cancel_at_period_end; access until current_period_end
POST   /membership/reactivate       # clear a scheduled cancel while the period is still paid
GET    /membership/events           # that customer's audit events
POST   /webhooks/blazepay           # first charge, renewal success, renewal failure, processor cancel

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

**Infra (typical):** API on Node (Nest or Hono) + Postgres (TRC-owned: zones, devices, audit, tracking snapshots, **Delivery Pass memberships and events**) + Redis (pubsub/GPS fanout) + object storage for POD images. Woo remains on Cloudways.

**Prototype now in the repo:** `apps/customer-web` is a clickable Next.js PWA (App Router, TypeScript, installable manifest) with **labelled sample data only**. It demonstrates age gate, catalog, 30 g meter, zone check, Delivery Pass, checkout fee waiver, mock payment, and tracking. It does not call Woo, CanFleet, BlazePay, or any live credential. How to run it is in the root README. `packages/*` and the other apps are still to be scaffolded once staging Woo/Breadstack is active.

---

## 10. Phased delivery

### Phase 0 — Enablement (ops + WP, little custom code)
- Confirm CanFleet subscription/config; turn on delivery shipping for Oshawa
- Set Google Maps keys (WP + future apps)
- Define first delivery polygons + fees in CanFleet/WC
- Document employee-driver SOP + CannSell requirements
- Staging WC Application Password + webhook endpoints for TRC API
- Decision gate: **Stripe eligible?** If no, lock BlazePay/Payfirma as MVP — **done: BlazePay, Stripe out of scope**
- Confirm whether **BlazePay can bill the Delivery Pass monthly** (reusable payment method, scheduled charge, webhooks for success/failure/cancel). If it cannot, launch with per-delivery fees only
- Send Delivery Pass wording to counsel (§6.7) before any customer-facing offer. Member discounts and early access are not in this phase and not in MVP

### Phase 1 — MVP launch (Oshawa)
- Customer PWA: catalog, compliance cart, zone fees, checkout, order history
- Per-delivery zone fee at checkout for non-members
- Delivery Pass join / renewal date / cancel, and a **$0 delivery line for active members**, only after the BlazePay recurring check and the lawyer’s wording sign-off. Until then the Pass stays off in production (the sample prototype may still show it)
- Prepaid payment via BlazePay adapter
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
- Delivery Pass operations: renewal notices, past-due retries, support lookup of membership events
- Still excluded unless a later legal opinion allows it: member cannabis discounts, early access, points, gifts, contests, spend-threshold free delivery

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
| Predominant delivery | AGCO restriction | Cap delivery share via ops policy; keep pickup/curbside prominent. Delivery Pass must not reposition the store as delivery-primary |
| BlazePay recurring | Delivery Pass cannot bill monthly if the processor has no reusable token / schedule / webhooks | Confirm with BlazePay before building billing. Fallback: per-delivery fees only, Pass hidden in production |
| Subscription system of record | WooCommerce Subscriptions vs TRC-owned service | **Recommend TRC-owned membership** (§6.7). Reopen only if BlazePay’s recurring path is the Subscriptions gateway and counsel accepts the Pass living on Woo |
| Delivery Pass wording | Cannabis Act s.24 and AGCO Registrar’s Standard 6.3 inducement risk; Ontario auto-renewal disclosure | Lawyer reviews final strings before launch. Draft wording is in §6.7 and is not approved copy. Member discounts / early access: **requires legal review, not in MVP** |
| Staging commerce APIs | WooCommerce, Breadstack, and CanFleet REST namespaces are not on the staging clone | Unblock before any live integration. The customer PWA prototype does not depend on this |

---

## 12. Success metrics

- Checkout → delivered conversion and median delivery minutes
- % orders within zone / fee accuracy (quote vs charged)
- Compliance: zero underage deliveries; 100% POD completion on attempted drops
- Gram-limit block rate (UX friction vs prevented over-limit)
- Driver utilization and failed-delivery return compliance (same-day)
- Push opt-in rate and “where is my order?” support ticket reduction
- Delivery Pass: active memberships, cancel-before-renewal rate, and fee accuracy (charged delivery fee is `$0` if and only if the Pass is active, in zone, and inside the paid period)

---

## 13. Immediate next actions

1. ~~**Stakeholder decision:** Hybrid vs full custom fleet.~~ **Done — Hybrid chosen.**  
2. ~~**Payments:**~~ **Done — BlazePay; Stripe out of scope.**  
3. ~~**Staging WordPress clone:**~~ **Done — URL:** `https://wordpress-1668181-6656169.cloudwaysapps.com`  
4. **Unblock staging commerce stack:** on that site, activate/restore **WooCommerce + Breadstack (`deepknead`) + CanFleet** (and related pickup plugins). Public REST currently only shows core WP namespaces — no `wc/*` or `bs-cf/*` routes. Ask Breadstack if the clone was meant to include plugins/data.  
5. **Then from staging WP:** confirm Administrator role → create WooCommerce REST API keys; enable CanFleet delivery; BlazePay test/sandbox; Google Maps key.  
6. **Phase 0 config** on staging: delivery shipping, one Oshawa zone + fees, test employee-driver.  
7. ~~**Scaffold monorepo** in this repo (`apps/customer-web` + `packages/api` + `woo-client` + `canfleet-client`).~~ **Customer PWA prototype is in `apps/customer-web`** (sample data, Delivery Pass screen, no live API). Still to scaffold once staging commerce APIs exist: `packages/api`, `woo-client`, `canfleet-client`.  
8. **Implement Compliance quote** (grams + zone fee + Delivery Pass waiver) against Store API cart.  
9. **Payment adapter spike** on BlazePay (sandbox/test mode), including a yes/no on recurring billing for the Delivery Pass.  
10. **Counsel:** review Delivery Pass wording (§6.7) before it is offered to customers.  
11. **Cloudways:** optional for app build — only needed later for hosting ops (re-clone, DNS/SSL, server logs, PHP/stack tweaks).

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

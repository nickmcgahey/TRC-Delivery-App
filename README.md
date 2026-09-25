# TRC Delivery App

Delivery platform for **Twisted Roots Cannabis**, integrating with the existing WooCommerce / Breadstack store at [trcannabis.ca](https://trcannabis.ca).

## Plan

See **[docs/delivery-platform-plan.md](./docs/delivery-platform-plan.md)** for the full architecture:

- Customer web/PWA + mobile ordering and real-time tracking
- Driver navigation and proof-of-delivery (CanFleet first)
- Admin dispatch dashboard
- Age verification, 30 g equivalent limits, zone-based fees
- Delivery Pass: $7.99 + HST per month for in-zone delivery (a paid delivery service, not a cannabis discount)
- Payments via BlazePay (Stripe out of scope)
- Google Maps tracking and push notifications
- Phased rollout (enable CanFleet → PWA MVP → native + Monaghan)

## Status

**Architecture: Hybrid (chosen)** — CanFleet for drivers/dispatch/POD; this repo for customer PWA/mobile, compliance/pricing gateway, and later admin polish. **Payments: BlazePay.** Commerce SoR remains WordPress + WooCommerce + Breadstack.

`apps/customer-web` is a clickable **sample-data prototype**. It does not call the live site, staging WordPress, or any payment API.

## Customer PWA prototype

The prototype is a mobile-first Next.js app so the store can click through ordering before WooCommerce / Breadstack integration is unblocked. Every product is fictional and marked **Sample**. Nothing is charged.

It includes:

- 19+ age gate
- Oshawa store info, an Ontario retail-seal placeholder, and a licence placeholder
- Catalog search and categories (flower, pre-rolls, vapes, edibles, beverages)
- Product detail
- Cart with a live 30 g dried-equivalent meter that blocks checkout over the limit
- Address entry with a sample in-zone / out-of-zone check
- Delivery Pass: $7.99 + 13% HST ($1.04) = $9.03 per month, join, renewal date, cancel
- Checkout with the delivery fee at $0.00 for an active Pass, or a sample $4.99 fee otherwise, plus a 9:00 a.m.–11:00 p.m. Eastern hours check
- Mock payment (no card entry, no charge)
- Order confirmation, order history, and a tracking timeline with simulated driver movement on a map placeholder

### Run it locally

Requires Node.js 20 or newer.

```bash
cd apps/customer-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Confirm you are 19 or older to enter. **Reset sample session** on the home screen clears the prototype data stored in this browser.

To build and run the production server:

```bash
cd apps/customer-web
npm install
npm run build
npm start
```

Dried-equivalent math in the prototype uses the public possession table in the plan (Appendix B), not live Breadstack “Equivalent To” data. The delivery zone check accepts sample Oshawa postal codes `L1G`, `L1H`, `L1J`, `L1K`, and `L1L` only. Use **In-zone sample** or **Out-of-zone sample** on the address screen to try both results. Three 14 g bags of Sample: Harbour Lot Flower are 42 g and will block checkout.

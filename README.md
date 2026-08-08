# TRC Delivery App

Delivery platform for **Twisted Roots Cannabis**, integrating with the existing WooCommerce / Breadstack store at [trcannabis.ca](https://trcannabis.ca).

## Plan

See **[docs/delivery-platform-plan.md](./docs/delivery-platform-plan.md)** for the full architecture:

- Customer web/PWA + mobile ordering and real-time tracking
- Driver navigation and proof-of-delivery (CanFleet first)
- Admin dispatch dashboard
- Age verification, 30 g equivalent limits, zone-based fees
- Payment provider adapter (BlazePay/Payfirma default; Stripe gated)
- Google Maps tracking and push notifications
- Phased rollout (enable CanFleet → PWA MVP → native + Monaghan)

## Status

Greenfield repository. Commerce system of record remains WordPress + WooCommerce + Breadstack; this repo will host the delivery clients and API gateway described in the plan.

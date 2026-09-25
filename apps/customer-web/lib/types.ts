export type ProductForm = "dried" | "fresh" | "edible" | "liquid" | "concentrate";

export type CategoryId = "flower" | "pre-roll" | "vape" | "edible" | "beverage";

export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  cultivar: string;
  form: ProductForm;
  /** Net amount of this product form, in milligrams (liquids use grams × 1000). */
  amountMg: number;
  netLabel: string;
  equivalencyNote: string;
  priceCents: number;
  summary: string;
  samplePotency: string;
  driedEquivalentMg: number;
};

export type CartLine = {
  productId: string;
  qty: number;
};

export type Address = {
  line1: string;
  city: string;
  province: "ON";
  postal: string;
  inZone: boolean;
};

export type Membership = {
  status: "active";
  startedAt: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  priceCents: number;
};

export type OrderLine = {
  productId: string;
  name: string;
  qty: number;
  unitPriceCents: number;
  driedEquivalentMg: number;
};

export type Order = {
  id: string;
  placedAt: number;
  lines: OrderLine[];
  addressLabel: string;
  membershipApplied: boolean;
  subtotalCents: number;
  deliveryFeeCents: number;
  listDeliveryFeeCents: number;
  hstCents: number;
  totalCents: number;
  driedEquivalentMg: number;
};

export type Age = "unknown" | "allowed" | "blocked";

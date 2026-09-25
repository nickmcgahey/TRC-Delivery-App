import type { Metadata } from "next";
import { CheckoutScreen } from "@/components/screens/CheckoutScreen";

export const metadata: Metadata = { title: "Checkout" };

export default function Page() {
  return <CheckoutScreen />;
}

import type { Metadata } from "next";
import { CartScreen } from "@/components/screens/CartScreen";

export const metadata: Metadata = { title: "Cart" };

export default function Page() {
  return <CartScreen />;
}

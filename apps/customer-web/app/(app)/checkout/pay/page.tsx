import type { Metadata } from "next";
import { PaymentScreen } from "@/components/screens/PaymentScreen";

export const metadata: Metadata = { title: "Sample payment" };

export default function Page() {
  return <PaymentScreen />;
}

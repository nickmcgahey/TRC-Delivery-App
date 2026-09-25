import type { Metadata } from "next";
import { MembershipScreen } from "@/components/screens/MembershipScreen";

export const metadata: Metadata = { title: "Delivery Pass" };

export default function Page() {
  return <MembershipScreen />;
}

import type { Metadata } from "next";
import { HomeScreen } from "@/components/screens/HomeScreen";

export const metadata: Metadata = { title: "Oshawa store" };

export default function Page() {
  return <HomeScreen />;
}

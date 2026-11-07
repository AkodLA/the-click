import type { Metadata } from "next";
import { HomeDashboard } from "@/features/home/home-dashboard";

export const metadata: Metadata = { title: "Home · Snakk" };

export default function LearnPage() {
  return <HomeDashboard />;
}

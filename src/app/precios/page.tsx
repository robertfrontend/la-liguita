import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { PricingPage } from "@/components/pricing/PricingPage";
import "../landing.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-barlow",
});

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: "700",
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Precios · La Liguita",
  description: "Planes Gratis, Liga Pro, Club y Federación para organizar tu liga.",
};

export default function PreciosPage() {
  return (
    <div className={`${barlow.variable} ${display.variable}`}>
      <PricingPage locale="es" />
    </div>
  );
}

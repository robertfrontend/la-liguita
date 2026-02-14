import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";

import { AuthProvider } from "@/components/providers/AuthProvider";

import { DataSubscriber } from "@/components/providers/DataSubscriber";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La Liguita - Street Basketball Stats",
  description: "Track stats, climb the leaderboard, and dominate the game.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--background)] text-[var(--foreground)]`}>
        <AuthProvider>
          <DataSubscriber />
          <TopNav />
          <main className="min-h-screen pt-16 pb-20">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}

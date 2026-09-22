import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RouteAwareAppShell } from "@/components/features/PublicTournamentDirectory";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La Liguita - Plataforma de Gestión de Torneos & Ligas",
  description: "Panel de control y administración para torneos deportivos y ligas oficiales.",
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
    <html lang="es" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <RouteAwareAppShell>{children}</RouteAwareAppShell>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

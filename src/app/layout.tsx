import type { Metadata } from "next";
import "./globals.css";

const title = "La Liguita - Plataforma de Gestión de Torneos & Ligas";
const description =
  "Panel de control y administración para torneos deportivos y ligas oficiales.";

export const metadata: Metadata = {
  metadataBase: new URL("https://laliguita.vercel.app"),
  title,
  description,
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title,
    description,
    locale: "es",
    type: "website",
    siteName: "La Liguita",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}

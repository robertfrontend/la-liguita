import { Barlow, Barlow_Condensed } from "next/font/google";
import { TopNav } from "@/components/layout/TopNav";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-barlow",
});

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-display",
});

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${barlow.variable} ${display.variable} ${barlow.className} ll-platform min-h-screen antialiased`}
    >
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <TopNav />
            <main className="min-h-screen pt-16">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </div>
  );
}

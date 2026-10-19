import { Inter } from "next/font/google";
import { TopNav } from "@/components/layout/TopNav";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-100 antialiased`}
      style={{ colorScheme: "dark" }}
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

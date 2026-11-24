import type { Metadata, Viewport } from "next";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { BottomNav } from "@/components/common/BottomNav";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { AutoTranslator } from "@/components/common/AutoTranslator";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fffaf3",
};

export const metadata: Metadata = {
  title: "Tsunagu Generations — Connecting the Past to the Present",
  description:
    "An intergenerational community platform connecting older and younger generations through knowledge sharing, skill exchange, daily assistance, and companionship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <AuthProvider>
          <LanguageProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <Header />
            <NotificationToast />
            <main id="main-content" className="flex-1 focus:outline-none">{children}</main>
            <Footer />
            <BottomNav />
            <AssistantWidget />
            <AutoTranslator />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

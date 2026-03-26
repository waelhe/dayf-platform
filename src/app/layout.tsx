import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ضيف - Syrian Tourism Platform | DAYF",
  description: "منصة سياحية سورية متكاملة - اكتشف سحر سوريا مع ضيف. Comprehensive Syrian tourism platform inspired by Airbnb/Booking.com",
  keywords: ["ضيف", "Syria", "Tourism", "Damascus", "Aleppo", "Travel", "Hotels", "Syrian Tourism"],
  authors: [{ name: "Dayf Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ضيف - Syrian Tourism Platform",
    description: "اكتشف سحر سوريا مع ضيف - منصة سياحية متكاملة",
    url: "https://dayf.sy",
    siteName: "ضيف",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ضيف - Syrian Tourism Platform",
    description: "اكتشف سحر سوريا مع ضيف",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

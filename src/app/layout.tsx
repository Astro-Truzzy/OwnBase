import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AOSInit } from "@/components/AOSInit";
import { OAuthErrorRecovery } from "@/components/auth/oauth-error-recovery";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const themeInitScript =
  '(function(){try{var k="ownbase-theme",t=localStorage.getItem(k);if(t==="dark")document.documentElement.classList.add("dark");if(t==="light")document.documentElement.classList.remove("dark");}catch(e){}})();';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Ownbase — Your Software. Your Base.",
  description:
    "One place to see what you own, who has access, and how it works. Built for leaders who want clarity and control.",
  icons: {
    icon: [{ url: "/LOGO/Logo-Icon.png", type: "image/png" }],
    apple: "/LOGO/Logo-Icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-background text-foreground font-sans antialiased"
        suppressHydrationWarning
      >
        <Script id="ownbase-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <AOSInit />
        <OAuthErrorRecovery />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}

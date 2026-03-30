import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import GlobalClientProviders from "@/components/GlobalClientProviders";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rase+ | Unlimited Entertainment",
  description:
    "Stream anime, movies, TV series — all in one premium platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Sans Flex via Fontsource CDN */}
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="6a97888e-site-verification" content="bb26e853a8876d12de5bdd94f3f7138f" />
      </head>
      <body className={`${outfit.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>
          <GlobalClientProviders>
            {children}
          </GlobalClientProviders>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

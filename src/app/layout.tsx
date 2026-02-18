import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Rase+ | Unlimited Entertainment",
  description:
    "Stream anime, movies, TV series and read manga — all in one premium platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Satoshi font from FontShare */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${dmSans.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

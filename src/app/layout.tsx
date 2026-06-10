
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import Providers from "@/components/Providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Mperf - Admin Dashboard",
  description: "Modernized Sar Stat Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          <DashboardWrapper>
            {children}
          </DashboardWrapper>
        </Providers>
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import Providers from "@/components/Providers";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Metrisar - Admin Dashboard",
  description: "Modernized Sar Stat Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.className} bg-gray-50 text-gray-900`}>
        <Providers>
          <DashboardWrapper>
            {children}
          </DashboardWrapper>
        </Providers>
      </body>
    </html>
  );
}

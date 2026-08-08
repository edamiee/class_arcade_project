import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Penelope's Learning Arcade",
  description: "Classroom quiz arcade",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arcade",
  },
};

export const viewport: Viewport = {
  themeColor: "#060613",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="pac" className={`${pixelFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

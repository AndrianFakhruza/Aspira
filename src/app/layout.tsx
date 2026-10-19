import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Tanggap — Platform Form Builder, Survei & Analisis Respons",
  description: "Kumpulkan respons, pahami hasilnya. Platform form builder modern dan analisis survei monokrom profesional.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-text-primary antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}

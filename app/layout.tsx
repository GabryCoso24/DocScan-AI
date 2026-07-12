import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocScan AI — AI Document Data Extraction",
  description: "Upload receipts, invoices, or any document and get structured JSON instantly with AI. MVP built for the Mamazen application process.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

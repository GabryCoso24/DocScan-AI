import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocScan AI — Estrazione Dati da Documenti con AI",
  description: "Carica scontrini, fatture o qualsiasi documento e ottieni dati strutturati in JSON istantaneamente grazie all'AI. MVP realizzato per la candidatura Mamazen.",
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

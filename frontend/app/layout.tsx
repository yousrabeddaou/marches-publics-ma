import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marchés Publics Maroc — Tableau de bord",
  description:
    "Suivez les appels d'offres des marchés publics marocains en temps réel. Filtrez par acheteur, budget, catégorie et date limite.",
  openGraph: {
    title: "Marchés Publics Maroc",
    description: "Plateforme de veille sur les marchés publics au Maroc",
    locale: "fr_MA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

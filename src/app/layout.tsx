import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/lib/providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EOLIA - Assistant Administratif pour Praticiens",
    template: "%s | EOLIA",
  },
  description:
    "Simplifiez la gestion de votre cabinet. Rendez-vous, rappels automatiques et facturation pour les praticiens du bien-être.",
  keywords: [
    "gestion cabinet",
    "praticien",
    "sophrologie",
    "naturopathie",
    "rendez-vous",
    "facturation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}

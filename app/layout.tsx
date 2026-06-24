import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstraChrono — Montres de Luxe IA Ultra HD",
  description:
    "Générez des montres de luxe ultra-réalistes avec la technologie IA Ultra HD d'AstraChrono. Tous les modèles en 4K en quelques secondes.",
  keywords: ["AstraChrono", "IA", "montre", "montre de luxe", "ultra hd", "génération montre"],
  openGraph: {
    title: "AstraChrono — Montres de Luxe IA Ultra HD",
    description: "Générez des montres de luxe ultra-réalistes avec l'IA Ultra HD d'AstraChrono",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-background text-foreground antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1E1E1E",
              color: "#fff",
              border: "1px solid #2A2A2A",
              borderRadius: "12px",
            },
            success: {
              iconTheme: { primary: "#8A2BE2", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}

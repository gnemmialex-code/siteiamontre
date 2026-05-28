import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex mb-4">
              <Image src="/logo.png" alt="AstraCrea" width={2000} height={2000} className="h-9 w-auto" />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              La plateforme de transformation photo par IA Ultra HD la plus avancée.
              Résultats 4K en quelques secondes.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="https://instagram.com/aleksisgn" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-surface border border-surface-border rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:border-accent-violet/50 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white/80">Produit</h4>
            <ul className="space-y-2">
              {[
                { href: "/upload", label: "Générer" },
                { href: "/pricing", label: "Tarifs" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/80">Légal</h4>
            <ul className="space-y-2">
              {[
                { href: "/terms", label: "CGU" },
                { href: "/privacy", label: "Confidentialité" },
                { href: "/consent", label: "Consentement" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © 2025 AstraCrea. Tous droits réservés.
          </p>
          <p className="text-white/20 text-xs">
            Usage créatif uniquement. Respect des droits à l&apos;image requis.
          </p>
        </div>
      </div>
    </footer>
  );
}

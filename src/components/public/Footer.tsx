import React from 'react';
import { Headphones, ShieldCheck, Mail, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { categories, navigateTo, currentPath } = useApp();

  const handleHashLink = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    if (currentPath === '/') {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigateTo(`/${hash}`);
    }
  };

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 py-16 text-neutral-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-neutral-950">
                <Headphones className="h-5 w-5 stroke-[2.2]" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                VISION BOOKS
              </span>
            </div>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-neutral-400">
              La bibliothèque professionnelle de livres audio haute définition pour les entrepreneurs, investisseurs et visionnaires désireux d'accélérer leur maîtrise stratégique.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs text-neutral-400">
              <Mail className="h-4 w-4 text-amber-500" />
              <span>contact@visionbooks.audio</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Thématiques
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/categorie/${cat.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(`/categorie/${cat.slug}`);
                    }}
                    className="hover:text-amber-400 transition-colors"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <a
                  href="/produits"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/produits');
                  }}
                  className="hover:text-amber-400 transition-colors"
                >
                  Catalogue Complet
                </a>
              </li>
              <li>
                <a
                  href="#bestsellers"
                  onClick={(e) => handleHashLink(e, '#bestsellers')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Best-Sellers
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/blog');
                  }}
                  className="hover:text-amber-400 transition-colors"
                >
                  Blog & Journal
                </a>
              </li>
              <li>
                <a
                  href="#ressource-gratuite"
                  onClick={(e) => handleHashLink(e, '#ressource-gratuite')}
                  className="text-amber-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1"
                >
                  <span>Guides Offerts 🎁</span>
                </a>
              </li>
              <li>
                <a
                  href="#temoignages"
                  onClick={(e) => handleHashLink(e, '#temoignages')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Témoignages
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleHashLink(e, '#faq')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Questions Fréquentes (FAQ)
                </a>
              </li>
            </ul>
          </div>

          {/* Espace Pro & Admin */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Administration
            </h4>
            <p className="mt-4 text-xs text-neutral-400">
              Interface dédiée à la gestion complète du catalogue, des articles, témoignages et métriques d'audience.
            </p>
            <button
              onClick={() => navigateTo('/admin')}
              className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:border-amber-500/50 hover:text-amber-400"
            >
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <span>Panneau Admin (/admin)</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-850 pt-8 sm:flex-row text-xs text-neutral-400">
          <p>© 2026 VISION BOOKS. Tous droits réservés.</p>
          <div className="flex gap-6">
            <span className="hover:text-neutral-300 cursor-pointer">Conditions Générales</span>
            <span className="hover:text-neutral-300 cursor-pointer">Confidentialité</span>
            <span className="hover:text-neutral-300 cursor-pointer">Mentions Légales</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CategoriesSection: React.FC = () => {
  const { categories, products, navigateTo } = useApp();

  // Only display active categories in public storefront
  const activeCategories = categories.filter((c) => c.is_active);

  const handleCategoryClick = (categorySlug: string) => {
    navigateTo(`/categorie/${categorySlug}`);
  };

  const getProductCount = (categorySlug: string, categoryId: string) => {
    return products.filter(
      (p) => p.is_active && (p.category === categorySlug || p.category === categoryId || p.categoryId === categoryId)
    ).length;
  };

  if (activeCategories.length === 0) return null;

  return (
    <section id="categories" className="border-b border-neutral-800 bg-neutral-900/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Thématiques & Domaines
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Nos livres audio par thématique
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            Sélectionnez une thématique pour découvrir l'ensemble des livres audio d'exception associés.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeCategories.map((cat) => {
            const count = getProductCount(cat.slug, cat.id);
            const categoryUrl = `/categorie/${cat.slug}`;

            return (
              <a
                key={cat.id}
                href={categoryUrl}
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryClick(cat.slug);
                }}
                className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-950/80 p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/50 hover:bg-neutral-900/60 hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl" role="img" aria-label={cat.name}>
                      {cat.icon}
                    </span>
                    <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 font-mono text-xs font-semibold text-neutral-300">
                      {count} {count > 1 ? 'livres' : 'livre'}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {cat.name}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                    {cat.description || 'Thématique d\'apprentissage audio sélectionnée.'}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-amber-500 group-hover:text-amber-400">
                  <span>Afficher les livres de la catégorie</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
            );
          })}
        </div>

        {/* Informative notice */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-neutral-400">
          <Layers className="h-3.5 w-3.5 text-amber-500" />
          <span>Accès direct : cliquez sur n'importe quelle catégorie pour afficher tous ses livres audio.</span>
        </div>
      </div>
    </section>
  );
};

import React, { useState, useMemo } from 'react';
import { Search, FolderOpen, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from './ProductCard';

export const ProductsSection: React.FC = () => {
  const { products, categories, setActivePreviewProduct, navigateTo } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Only display active categories in storefront
  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.is_active);
  }, [categories]);

  // "Pour les autres produits : les organiser par catégorie."
  // Non-bestseller active products (or all active products if filtered/searched)
  const otherProducts = useMemo(() => {
    return products.filter((p) => p.is_active && !p.is_best_seller && !p.isBestSeller);
  }, [products]);

  // If a search query is active, filter all active products
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      if (!p.is_active) return false;
      return (
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q) ||
        (p.summary && p.summary.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery]);

  // Group other products by active category
  const categoriesWithProducts = useMemo(() => {
    return activeCategories
      .map((cat) => {
        const catProducts = otherProducts.filter(
          (p) => p.category === cat.slug || p.category === cat.id || p.categoryId === cat.id
        );
        return {
          category: cat,
          products: catProducts,
        };
      })
      .filter((group) => {
        if (selectedCategoryTab === 'all') {
          return group.products.length > 0;
        }
        return (
          (group.category.slug === selectedCategoryTab || group.category.id === selectedCategoryTab) &&
          group.products.length > 0
        );
      });
  }, [activeCategories, otherProducts, selectedCategoryTab]);

  // Products with unknown or "autres" category
  const uncategorizedProducts = useMemo(() => {
    const knownCatIds = new Set(
      activeCategories.flatMap((c) => [c.id, c.slug])
    );
    return otherProducts.filter((p) => !knownCatIds.has(p.category) && !knownCatIds.has(p.categoryId || ''));
  }, [activeCategories, otherProducts]);

  return (
    <section id="catalogue" className="border-b border-neutral-800 bg-neutral-950 py-20 relative">
      <div id="produits" className="absolute -top-20" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <BookOpen className="h-4 w-4" />
              <span>Catalogue Complet</span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Nos Livres Audio par Thématique
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              Explorez nos ouvrages organisés par domaine d'expertise pour cibler vos objectifs stratégiques.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher titre, auteur..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 py-2.5 pl-10 pr-9 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Jump Filters */}
        {!searchQuery && (
          <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-neutral-800/80 pb-5">
            <button
              onClick={() => setSelectedCategoryTab('all')}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                selectedCategoryTab === 'all'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10'
                  : 'border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white'
              }`}
            >
              Toutes les catégories
            </button>

            {activeCategories.map((cat) => {
              const count = otherProducts.filter(
                (p) => p.category === cat.slug || p.category === cat.id || p.categoryId === cat.id
              ).length;
              if (count === 0) return null;
              const isSelected = selectedCategoryTab === cat.slug || selectedCategoryTab === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryTab(cat.slug)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-500 font-bold text-neutral-950 shadow-md shadow-amber-500/10'
                      : 'border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate max-w-[150px]">{cat.name}</span>
                  <span className="font-mono text-[10px] opacity-75 tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* SEARCH RESULTS VIEW */}
        {searchResults !== null ? (
          <div className="mt-10">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-neutral-300">
                Résultats de recherche pour <span className="font-bold text-amber-400">"{searchQuery}"</span> ({searchResults.length} {searchResults.length > 1 ? 'livres trouvés' : 'livre trouvé'}) :
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-amber-400 hover:underline"
              >
                Effacer la recherche
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {searchResults.map((product) => {
                  const cat = categories.find((c) => c.slug === product.category || c.id === product.category);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryName={cat ? `${cat.icon} ${cat.name}` : undefined}
                      onPlayPreview={() => setActivePreviewProduct(product)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="my-16 rounded-2xl border border-dashed border-neutral-800 p-12 text-center">
                <FolderOpen className="mx-auto h-8 w-8 text-neutral-600" />
                <h3 className="mt-4 text-base font-semibold text-white">Aucun livre audio trouvé</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Aucun résultat ne correspond à votre recherche "{searchQuery}". Essayez un autre mot-clé.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold text-amber-400 hover:bg-neutral-700"
                >
                  Voir tous les livres
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ORGANIZED BY CATEGORY */
          <div className="mt-12 space-y-16">
            {categoriesWithProducts.map(({ category, products: catProducts }) => (
              <div
                key={category.id}
                id={`cat-${category.slug}`}
                className="rounded-3xl border border-neutral-800/80 bg-neutral-900/20 p-6 sm:p-8"
              >
                {/* Category Group Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-neutral-800/80 pb-6 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3 sm:items-center">
                    <span className="text-3xl sm:text-4xl" role="img" aria-label={category.name}>
                      {category.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                          {category.name}
                        </h3>
                        <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-400">
                          {catProducts.length} {catProducts.length > 1 ? 'titres' : 'titre'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-400 max-w-xl">
                        {category.description || 'Sélection d’ouvrages audio de premier ordre pour votre croissance.'}
                      </p>
                    </div>
                  </div>

                  {/* Bouton vers la page /categorie/[slug] */}
                  <a
                    href={`/categorie/${category.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(`/categorie/${category.slug}`);
                    }}
                    className="group inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <span>Voir toute la catégorie</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>

                {/* Category Products Grid */}
                <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {catProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryName={`${category.icon} ${category.name}`}
                      onPlayPreview={() => setActivePreviewProduct(product)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Uncategorized products if any exist */}
            {uncategorizedProducts.length > 0 && selectedCategoryTab === 'all' && (
              <div className="rounded-3xl border border-neutral-800/80 bg-neutral-900/20 p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✨</span>
                    <div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                        Autres Titres du Catalogue
                      </h3>
                      <p className="mt-1 text-xs text-neutral-400">
                        Ouvrages complémentaires pour enrichir votre bibliothèque audio.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {uncategorizedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onPlayPreview={() => setActivePreviewProduct(product)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

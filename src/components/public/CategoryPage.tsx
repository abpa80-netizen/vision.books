import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { ProductCard } from './ProductCard';
import { AudioPreviewModal } from './AudioPreviewModal';
import { ArrowLeft, BookOpen, Layers, Sparkles, Headphones, ShieldCheck, ArrowRight } from 'lucide-react';

interface CategoryPageProps {
  slug: string;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ slug }) => {
  const { categories, products, navigateTo, setActivePreviewProduct } = useApp();

  // Find category by slug (or id)
  const currentCategory = useMemo(() => {
    return categories.find(
      (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase() === slug.toLowerCase()
    );
  }, [categories, slug]);

  // All active products belonging to this category
  const categoryProducts = useMemo(() => {
    if (!currentCategory) return [];
    return products.filter(
      (p) =>
        p.is_active &&
        (p.category === currentCategory.slug ||
          p.category === currentCategory.id ||
          p.categoryId === currentCategory.id)
    );
  }, [products, currentCategory]);

  // Other active categories for cross-navigation
  const otherCategories = useMemo(() => {
    return categories.filter(
      (c) => c.is_active && c.slug !== slug && c.id !== slug
    );
  }, [categories, slug]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-8 overflow-x-auto whitespace-nowrap">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/');
              }}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Accueil</span>
            </a>
            <span className="text-neutral-600">/</span>
            <a
              href="/#categories"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/#categories');
              }}
              className="hover:text-amber-400 transition-colors"
            >
              Catégories
            </a>
            <span className="text-neutral-600">/</span>
            <span className="font-semibold text-white">
              {currentCategory ? currentCategory.name : slug}
            </span>
          </nav>

          {/* Category Hero Banner */}
          {currentCategory ? (
            <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900/80 to-neutral-950 p-6 sm:p-10 shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-neutral-800/80 border border-neutral-700/80 text-4xl sm:text-5xl shadow-inner">
                    <span role="img" aria-label={currentCategory.name}>
                      {currentCategory.icon}
                    </span>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      <Sparkles className="h-3 w-3" />
                      <span>Thématique d'apprentissage</span>
                    </div>

                    <h1 className="mt-2 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                      {currentCategory.name}
                    </h1>

                    <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-neutral-300">
                      {currentCategory.description ||
                        'Découvrez notre sélection de livres audio haute définition pour développer cette compétence clé.'}
                    </p>
                  </div>
                </div>

                {/* Stat Badges */}
                <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-2.5 backdrop-blur-sm">
                    <div className="font-mono text-xl font-extrabold text-amber-400">
                      {categoryProducts.length}
                    </div>
                    <div className="text-[11px] font-medium text-neutral-400">
                      {categoryProducts.length > 1 ? 'Livres audio disponibles' : 'Livre audio disponible'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <Headphones className="h-3.5 w-3.5 text-amber-400" />
                    <span>Qualité Studio HD 320 kbps</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 text-center">
              <h1 className="font-display text-2xl font-bold text-white">
                Catégorie introuvable
              </h1>
              <p className="mt-2 text-xs text-neutral-400">
                La thématique demandée "{slug}" n'existe pas ou a été déplacée.
              </p>
              <button
                onClick={() => navigateTo('/')}
                className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400"
              >
                Retourner à l'accueil
              </button>
            </div>
          )}

          {/* Products List */}
          <div className="mt-12">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-500" />
                <h2 className="font-display text-lg font-bold text-white">
                  Tous les livres audio de cette catégorie
                </h2>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {categoryProducts.length} résultat{categoryProducts.length > 1 ? 's' : ''}
              </span>
            </div>

            {categoryProducts.length > 0 ? (
              <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={currentCategory ? `${currentCategory.icon} ${currentCategory.name}` : undefined}
                    onPlayPreview={() => setActivePreviewProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="my-16 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/20 p-12 text-center">
                <Layers className="mx-auto h-10 w-10 text-neutral-600" />
                <h3 className="mt-4 font-display text-base font-bold text-white">
                  Aucun livre audio actif dans cette catégorie
                </h3>
                <p className="mt-1.5 text-xs text-neutral-400 max-w-md mx-auto">
                  De nouveaux ouvrages pour cette thématique sont en cours de mastering audio et seront bientôt disponibles.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo('/');
                    }}
                    className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 shadow-sm"
                  >
                    Explorer tout le catalogue
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Other Categories Section */}
          {otherCategories.length > 0 && (
            <div className="mt-20 border-t border-neutral-800/80 pt-12">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-white">
                    Explorer d'autres thématiques
                  </h3>
                  <p className="mt-1 text-xs text-neutral-400">
                    Élargissez vos compétences en découvrant nos autres domaines de formation audio.
                  </p>
                </div>
                <a
                  href="/#categories"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/');
                  }}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-400"
                >
                  <span>Toutes les catégories</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {otherCategories.slice(0, 8).map((cat) => (
                  <a
                    key={cat.id}
                    href={`/categorie/${cat.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(`/categorie/${cat.slug}`);
                    }}
                    className="group flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 transition-all hover:border-amber-500/50 hover:bg-neutral-900 hover:shadow-lg"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        Découvrir les livres →
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <AudioPreviewModal />
    </div>
  );
};

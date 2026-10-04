import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { ProductCard } from './ProductCard';
import { AudioPreviewModal } from './AudioPreviewModal';
import {
  Search,
  BookOpen,
  Filter,
  Sparkles,
  Flame,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { products, categories, navigateTo, setActivePreviewProduct } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterBestSeller, setFilterBestSeller] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'title'>('recommended');

  const activeCategories = useMemo(() => categories.filter((c) => c.is_active), [categories]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.is_active);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          (p.summary && p.summary.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(
        (p) =>
          p.category === selectedCategory ||
          p.categoryId === selectedCategory
      );
    }

    if (filterBestSeller) {
      result = result.filter((p) => p.is_best_seller || p.isBestSeller);
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.sale_price ?? a.normal_price) - (b.sale_price ?? b.normal_price));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.sale_price ?? b.normal_price) - (a.sale_price ?? a.normal_price));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // Best sellers first, then by date/id
        result.sort((a, b) => ((b.is_best_seller || b.isBestSeller) ? 1 : 0) - ((a.is_best_seller || a.isBestSeller) ? 1 : 0));
        break;
    }

    return result;
  }, [products, search, selectedCategory, filterBestSeller, sortBy]);

  const getCategoryName = (catSlugOrId: string) => {
    const found = categories.find((c) => c.slug === catSlugOrId || c.id === catSlugOrId);
    return found ? `${found.icon} ${found.name}` : undefined;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-neutral-400">
            <button
              onClick={() => navigateTo('/')}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Accueil</span>
            </button>
            <span>/</span>
            <span className="text-amber-400 font-medium">Catalogue Complet</span>
          </nav>

          {/* Heading */}
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Bibliothèque Audio</span>
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Tous Nos Livres Audio
            </h1>
            <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
              Explorez l'intégralité de nos condensés de haute valeur pour transformer vos connaissances en actions concrètes.
            </p>
          </div>

          {/* Search & Filters Bar */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par titre, auteur, mot-clé..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Best-sellers filter & Sort dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFilterBestSeller(!filterBestSeller)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                    filterBestSeller
                      ? 'border-amber-500/80 bg-amber-500/20 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  <span>Best-Sellers uniquement</span>
                </button>

                <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-1.5 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer"
                  >
                    <option value="recommended" className="bg-neutral-900">Tri : Recommandés</option>
                    <option value="price-asc" className="bg-neutral-900">Prix : Croissant</option>
                    <option value="price-desc" className="bg-neutral-900">Prix : Décroissant</option>
                    <option value="title" className="bg-neutral-900">Titre : A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                Toutes les catégories ({products.filter((p) => p.is_active).length})
              </button>

              {activeCategories.map((cat) => {
                const count = products.filter((p) => p.is_active && (p.category === cat.slug || p.category === cat.id)).length;
                const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? 'all' : cat.slug)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>
              {filteredProducts.length} {filteredProducts.length > 1 ? 'livres audio trouvés' : 'livre audio trouvé'}
            </span>
            {(search || selectedCategory !== 'all' || filterBestSeller) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setFilterBestSeller(false);
                }}
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-neutral-600" />
              <h3 className="mt-4 font-display text-lg font-bold text-white">
                Aucun livre ne correspond à votre recherche
              </h3>
              <p className="mt-2 text-xs text-neutral-400 max-w-sm mx-auto">
                Essayez d'ajuster vos critères de recherche ou de réinitialiser les filtres sélectionnés.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setFilterBestSeller(false);
                }}
                className="mt-6 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400"
              >
                Voir tout le catalogue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryName={getCategoryName(product.category)}
                  onPlayPreview={() => setActivePreviewProduct(product)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <AudioPreviewModal />
    </div>
  );
};

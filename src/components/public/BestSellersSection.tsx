import React from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from './ProductCard';

export const BestSellersSection: React.FC = () => {
  const { products, categories, setActivePreviewProduct } = useApp();

  // Filter only active bestsellers
  const bestSellers = products.filter(
    (p) => p.is_active && (p.is_best_seller || p.isBestSeller)
  );

  const getCategoryName = (catSlugOrId: string) => {
    const found = categories.find((c) => c.slug === catSlugOrId || c.id === catSlugOrId);
    return found ? `${found.icon} ${found.name}` : undefined;
  };

  if (bestSellers.length === 0) return null;

  return (
    <section id="bestsellers" className="border-b border-neutral-800 bg-neutral-950 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Flame className="h-4 w-4" />
              <span>Les Incontournables</span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Nos Livres Audio Best-Sellers
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              Les titres les plus écoutés, plébiscités et appliqués par notre communauté.
            </p>
          </div>

          <a
            href="#categories"
            className="group flex items-center gap-1.5 text-sm font-semibold text-amber-500 hover:text-amber-400"
          >
            <span>Voir par thématique</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Best sellers grid (2 per row on mobile, 3 per row on desktop) */}
        <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {bestSellers.map((book) => (
            <ProductCard
              key={book.id}
              product={book}
              categoryName={getCategoryName(book.category)}
              onPlayPreview={() => setActivePreviewProduct(book)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

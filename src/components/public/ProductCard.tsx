import React from 'react';
import { ArrowRight, Star, Headphones, Play, Gift } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { trackProductClick } from '../../services/analytics';

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  onPlayPreview?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categoryName,
  onPlayPreview,
}) => {
  const { navigateTo } = useApp();

  const hasPromo =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    product.sale_price < product.normal_price;

  const isBestSeller = Boolean(product.is_best_seller || product.isBestSeller);
  const productUrl = `/produit/${product.slug}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click was not on a button, navigate to the product page
    const target = e.target as HTMLElement;
    if (!target.closest('button')) {
      e.preventDefault();
      trackProductClick(product.id, typeof window !== 'undefined' ? window.location.pathname : '/');
      navigateTo(productUrl);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700 hover:shadow-2xl hover:shadow-amber-500/5 cursor-pointer"
    >
      {/* Top Media: 3:4 Cover Art */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950">
        <img
          src={product.cover || product.coverUrl}
          alt={`Couverture audio de ${product.title}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-70" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Badge Best-Seller */}
          {isBestSeller ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-950 shadow-md">
              <Star className="h-3 w-3 fill-neutral-950 text-neutral-950" />
              <span>Best-Seller</span>
            </span>
          ) : (
            <div />
          )}

          {/* Rating */}
          <div className="flex items-center gap-1 rounded-full bg-neutral-950/80 px-2.5 py-1 text-white backdrop-blur-md border border-white/10">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-mono text-[11px] font-bold tabular-nums">
              {product.rating || 4.9}
            </span>
          </div>
        </div>

        {/* Audio Quick Preview Trigger */}
        {onPlayPreview && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayPreview();
              }}
              className="flex h-13 w-13 items-center justify-center rounded-full bg-amber-500 text-neutral-950 shadow-2xl transition-transform hover:scale-110 active:scale-95"
              title="Écouter un extrait audio de 2 minutes"
            >
              <Play className="h-5 w-5 fill-neutral-950 ml-0.5" />
            </button>
          </div>
        )}

        {/* Subtle Audio Pill in bottom cover */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-neutral-950/80 px-2 py-0.5 text-[10px] font-medium text-neutral-300 backdrop-blur-md">
          <Headphones className="h-3 w-3 text-amber-400" />
          <span>Livre audio HD</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        {/* Category name if provided */}
        {categoryName && (
          <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-amber-500 truncate">
            {categoryName}
          </div>
        )}

        {/* Titre */}
        <h3 className="mt-1 font-display text-sm sm:text-base font-bold text-white transition-colors group-hover:text-amber-400 line-clamp-1">
          <a
            href={productUrl}
            onClick={(e) => {
              e.preventDefault();
              navigateTo(productUrl);
            }}
          >
            {product.title}
          </a>
        </h3>

        {/* Auteur */}
        <p className="mt-0.5 text-[11px] sm:text-xs text-neutral-300 truncate">
          Par <span className="font-semibold text-white">{product.author}</span>
        </p>

        {/* Exactement 2 lignes maximum de description courte */}
        <p className="mt-2 line-clamp-2 text-[11px] sm:text-xs leading-relaxed text-neutral-400 min-h-[2rem] sm:min-h-[2.5rem]">
          {product.short_description || product.summary || ''}
        </p>

        {/* Bonus note if applicable */}
        {product.bonus && (
          <div className="mt-2 flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-amber-400/90 truncate">
            <Gift className="h-3 w-3 shrink-0 text-amber-400" />
            <span className="truncate">Bonus : {product.bonus}</span>
          </div>
        )}

        {/* Pricing Area: Prix promotionnel & Ancien prix barré */}
        <div className="mt-3 border-t border-neutral-800/80 pt-2.5">
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {hasPromo ? (
                <>
                  <span className="font-mono text-base sm:text-xl font-extrabold text-amber-400 tabular-nums">
                    {product.sale_price!.toFixed(2)} €
                  </span>
                  <span className="font-mono text-[10px] sm:text-xs text-neutral-500 line-through tabular-nums">
                    {product.normal_price.toFixed(2)} €
                  </span>
                </>
              ) : (
                <span className="font-mono text-base sm:text-xl font-extrabold text-white tabular-nums">
                  {product.normal_price.toFixed(2)} €
                </span>
              )}
            </div>

            {hasPromo && (
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-amber-400">
                PROMO
              </span>
            )}
          </div>
        </div>

        {/* Bouton « Voir le produit » */}
        <div className="mt-3 flex items-center gap-1.5 sm:gap-2">
          {onPlayPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayPreview();
              }}
              title="Écouter un extrait audio"
              className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-amber-400 hover:border-amber-500/50 hover:bg-neutral-800 active:scale-95 transition-colors"
            >
              <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current ml-0.5" />
            </button>
          )}

          <a
            href={productUrl}
            onClick={(e) => {
              e.preventDefault();
              trackProductClick(product.id, typeof window !== 'undefined' ? window.location.pathname : '/');
              navigateTo(productUrl);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold text-neutral-950 transition-all hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/10"
          >
            <span>Voir le produit</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 hidden xs:inline" />
          </a>
        </div>
      </div>
    </div>
  );
};

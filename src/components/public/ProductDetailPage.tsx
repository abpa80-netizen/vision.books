import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { ProductCard } from './ProductCard';
import { AudioPreviewModal } from './AudioPreviewModal';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  Gift,
  Headphones,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShieldCheck,
  Zap,
  Download,
  Clock,
  BookOpen,
  Share2,
  Check,
  Sparkles,
  Smartphone,
  MessageCircle,
  Award,
  ArrowRight,
} from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { trackProductView, trackWhatsAppClick } from '../../services/analytics';

interface ProductDetailPageProps {
  slug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const { products, categories, settings, navigateTo, showToast } = useApp();

  // Find product by slug or id
  const product = useMemo(() => {
    return products.find(
      (p) =>
        p.slug.toLowerCase() === slug.toLowerCase() ||
        p.id.toLowerCase() === slug.toLowerCase()
    );
  }, [products, slug]);

  // Find category for breadcrumbs & similar products
  const category = useMemo(() => {
    if (!product) return null;
    return categories.find(
      (c) => c.slug === product.category || c.id === product.category || c.id === product.categoryId
    );
  }, [categories, product]);

  // Similar products in the same category
  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(
        (p) =>
          p.id !== product.id &&
          p.is_active &&
          (p.category === product.category ||
            (category && (p.category === category.slug || p.categoryId === category.id)))
      )
      .slice(0, 3);
  }, [products, product, category]);

  // In-page Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // 2 minutes default preview
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio source URL
  const audioSrc = product?.audio_url || product?.audioPreviewUrl || 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg';

  useEffect(() => {
    // Reset audio state when product changes
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [slug]);

  // Track product page view
  useEffect(() => {
    if (product?.id) {
      trackProductView(product.id, `/produit/${product.slug}`);
    }
  }, [product?.id, product?.slug]);

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Audio play prevented:', e);
        setIsPlaying(true); // fallback visual feedback
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Pricing calculation
  const hasPromo =
    product &&
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    product.sale_price < product.normal_price;

  const currentPrice = hasPromo ? product!.sale_price! : (product ? product.normal_price : 0);
  const regularPrice = product ? product.normal_price : 0;
  const discountAmount = hasPromo ? (regularPrice - currentPrice).toFixed(2) : '0';
  const discountPercent = hasPromo ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100) : 0;

  // WhatsApp Order Handler (Using admin settings number, no hardcoded phone)
  const handleOrderWhatsApp = async () => {
    if (!product) return;

    let rawPhone = settings?.whatsapp_number || '';
    if (!rawPhone) {
      try {
        const fetchedSettings = await api.getSettings();
        rawPhone = fetchedSettings.whatsapp_number || '';
      } catch (err) {
        console.warn('Could not retrieve settings for WhatsApp order:', err);
      }
    }

    const cleanPhone = (rawPhone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      showToast('Le numéro WhatsApp de commande n\'est pas encore configuré dans les paramètres.', 'error');
      return;
    }

    const finalPrice = hasPromo ? currentPrice : regularPrice;
    const priceText = `${finalPrice % 1 === 0 ? finalPrice : finalPrice.toFixed(2)} €`;

    const productUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/produit/${product.slug}`
      : `https://visionbooks.audio/produit/${product.slug}`;

    const message = `Bonjour VISION BOOKS,
je souhaite commander le livre audio :
${product.title}

Prix :
${priceText}

Lien du produit :
${productUrl}`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Track WhatsApp Order Intent Click
    trackWhatsAppClick(product.id, `/produit/${product.slug}`);

    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Lien du livre audio copié dans le presse-papier !', 'success');
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 text-center backdrop-blur-md">
            <BookOpen className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="mt-4 font-display text-2xl font-bold text-white">
              Livre audio introuvable
            </h1>
            <p className="mt-2 text-xs text-neutral-400">
              Le produit correspondant à l'adresse "/produit/{slug}" n'existe pas ou est momentanément indisponible.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => navigateTo('/')}
                className="w-full rounded-xl bg-amber-500 py-3 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors"
              >
                Explorer tout le catalogue
              </button>
              <button
                onClick={() => navigateTo('/#categories')}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                Parcourir les catégories
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Key points array safe access
  const keyPoints =
    Array.isArray(product.key_points) && product.key_points.length > 0
      ? product.key_points
      : (product.keyTakeaways || [
          'Maîtrise des principes fondamentaux et stratégies concrètes applicables immédiatement',
          'Méthodes éprouvées pour débloquer votre plein potentiel professionnel et financier',
          'Études de cas réelles et retours d’expérience pour éviter les erreurs coûteuses',
          'Plan d’action par étapes structuré pour implémenter chaque leçon au quotidien',
        ]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Header />

      {/* Hidden audio element for in-page playback */}
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        preload="metadata"
      />

      <main className="flex-1 pb-24 sm:pb-32">
        {/* Breadcrumb Bar */}
        <div className="border-b border-neutral-800/80 bg-neutral-900/30 py-3.5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-neutral-400 overflow-x-auto whitespace-nowrap">
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
              {category && (
                <>
                  <a
                    href={`/categorie/${category.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(`/categorie/${category.slug}`);
                    }}
                    className="hover:text-amber-400 transition-colors"
                  >
                    {category.name}
                  </a>
                  <span className="text-neutral-600">/</span>
                </>
              )}
              <span className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                {product.title}
              </span>
            </nav>
          </div>
        </div>

        {/* ============================================================== */}
        {/* HERO SECTION : CONVERSION ORIENTED                             */}
        {/* ============================================================== */}
        <section className="pt-8 sm:pt-14 pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* LEFT COLUMN: LARGE COVER & AUDIO PREVIEW (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Grande Couverture */}
                <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-3xl border-2 border-neutral-800 bg-neutral-900 shadow-2xl shadow-neutral-950">
                  <img
                    src={product.cover || product.coverUrl}
                    alt={`Grande couverture audio de ${product.title}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent" />

                  {/* Badges on cover */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    {(product.is_best_seller || product.isBestSeller) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-neutral-950 shadow-lg">
                        <Award className="h-3.5 w-3.5" />
                        <span>Best-Seller N°1</span>
                      </span>
                    ) : (
                      <div />
                    )}

                    {hasPromo && (
                      <span className="rounded-full bg-red-600 px-3 py-1 font-mono text-xs font-extrabold text-white shadow-lg">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* Play trigger overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <button
                      onClick={togglePlayAudio}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-neutral-950 shadow-2xl transition-transform hover:scale-110 active:scale-95"
                      title={isPlaying ? "Mettre en pause" : "Écouter l'extrait audio"}
                    >
                      {isPlaying ? (
                        <Pause className="h-7 w-7 fill-neutral-950" />
                      ) : (
                        <Play className="h-7 w-7 fill-neutral-950 ml-1" />
                      )}
                    </button>
                  </div>

                  {/* Bottom cover pill */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-neutral-200">
                    <div className="flex items-center gap-2 rounded-lg bg-neutral-950/80 px-2.5 py-1 backdrop-blur-md">
                      <Headphones className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-medium">Édition Audio Haute Fidélité</span>
                    </div>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1 rounded-lg bg-neutral-950/80 px-2.5 py-1 backdrop-blur-md hover:text-white transition-colors"
                      title="Partager ce livre"
                    >
                      <Share2 className="h-3 w-3" />
                      <span>Partager</span>
                    </button>
                  </div>
                </div>

                {/* Lecteur Audio Interactif Intégré */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                        <Headphones className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Extrait Audio Disponible</div>
                        <div className="text-[10px] text-neutral-400">Mastering studio HD • Écoute immédiate</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-amber-400 font-semibold tabular-nums">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Progress scrubber */}
                  <div className="mt-4">
                    <input
                      type="range"
                      min={0}
                      max={duration || 120}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Player controls */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlayAudio}
                        className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 transition-all hover:bg-amber-400 active:scale-95 shadow-sm"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="h-3.5 w-3.5 fill-current" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                            <span>Écouter l'extrait</span>
                          </>
                        )}
                      </button>

                      {isPlaying && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Lecture en cours</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                      title={isMuted ? "Réactiver le son" : "Couper le son"}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Badges de Confiance & Réassurance */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3">
                    <Zap className="h-4 w-4 shrink-0 text-amber-400" />
                    <span className="text-[11px] text-neutral-300 font-medium">Accès immédiat 24/7</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3">
                    <Download className="h-4 w-4 shrink-0 text-amber-400" />
                    <span className="text-[11px] text-neutral-300 font-medium">Téléchargement MP3 libre</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3">
                    <Smartphone className="h-4 w-4 shrink-0 text-amber-400" />
                    <span className="text-[11px] text-neutral-300 font-medium">Compatible tout mobile</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" />
                    <span className="text-[11px] text-neutral-300 font-medium">Support WhatsApp 7j/7</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: SALES COPY & CONVERSION CTAs (lg:col-span-7) */}
              <div className="lg:col-span-7 flex flex-col">
                {/* Category & Rating Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {category && (
                    <a
                      href={`/categorie/${category.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo(`/categorie/${category.slug}`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </a>
                  )}

                  {/* Rating Score */}
                  <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-bold text-white">4.9 / 5</span>
                    <span className="text-neutral-500">(+240 avis vérifiés)</span>
                  </div>
                </div>

                {/* Grand Titre */}
                <h1 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                  {product.title}
                </h1>

                {/* Auteur */}
                <div className="mt-3 flex items-center gap-2 text-sm text-neutral-300">
                  <span>Par</span>
                  <span className="font-bold text-white">{product.author}</span>
                  <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                    Auteur Référent
                  </span>
                </div>

                {/* Description courte d'accroche */}
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-neutral-300">
                  {product.short_description || product.summary}
                </p>

                {/* ========================================================= */}
                {/* PRIX ULTRA VISIBLE & BLOC DE COMMANDE                     */}
                {/* ========================================================= */}
                <div className="mt-6 rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/20 p-6 sm:p-7 shadow-2xl">
                  {/* Pricing row */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-neutral-800 pb-5">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        {hasPromo ? 'Tarif promotionnel de lancement' : 'Tarif standard'}
                      </div>
                      <div className="mt-1 flex items-baseline gap-3">
                        {hasPromo ? (
                          <>
                            <span className="font-mono text-4xl sm:text-5xl font-extrabold text-amber-400 tabular-nums">
                              {currentPrice.toFixed(2)} €
                            </span>
                            <span className="font-mono text-xl sm:text-2xl text-neutral-500 line-through tabular-nums">
                              {regularPrice.toFixed(2)} €
                            </span>
                          </>
                        ) : (
                          <span className="font-mono text-4xl sm:text-5xl font-extrabold text-white tabular-nums">
                            {regularPrice.toFixed(2)} €
                          </span>
                        )}
                      </div>
                    </div>

                    {hasPromo && (
                      <div className="self-start sm:self-center rounded-2xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 text-right">
                        <div className="font-bold text-xs text-amber-300">
                          Économisez {discountAmount} €
                        </div>
                        <div className="text-[10px] text-neutral-400">Paiement unique • Sans abonnement</div>
                      </div>
                    )}
                  </div>

                  {/* Encadré Bonus Offert */}
                  {product.bonus && (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 font-bold shadow-md">
                        <Gift className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xs font-bold uppercase tracking-wider text-amber-400">
                            Bonus Spécial Inclus avec votre commande
                          </span>
                          <span className="rounded bg-neutral-900 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                            Offert
                          </span>
                        </div>
                        <div className="mt-1 text-xs font-medium text-neutral-200">
                          {product.bonus}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ======================================================= */}
                  {/* GRAND CTA « COMMANDER SUR WHATSAPP »                     */}
                  {/* ======================================================= */}
                  <div className="mt-6 flex flex-col gap-2.5">
                    <button
                      onClick={handleOrderWhatsApp}
                      className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-4.5 text-base sm:text-lg font-extrabold text-white shadow-xl shadow-emerald-950/60 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <MessageCircle className="h-6 w-6 stroke-[2.4] fill-white/20 group-hover:scale-110 transition-transform" />
                      <span>Commander sur WhatsApp</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>

                    <div className="flex items-center justify-center gap-3 text-[11px] text-neutral-400 text-center">
                      <span className="flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Réponse en moins de 5 min
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Accès & téléchargement immédiats
                      </span>
                    </div>
                  </div>

                  {/* Moyens de paiement acceptés */}
                  <div className="mt-5 border-t border-neutral-800/80 pt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300">Paiements acceptés :</span>
                    <span className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-neutral-400">
                      <span className="rounded bg-neutral-800 px-2 py-0.5">WhatsApp Direct</span>
                      <span className="rounded bg-neutral-800 px-2 py-0.5">Wave</span>
                      <span className="rounded bg-neutral-800 px-2 py-0.5">Orange Money</span>
                      <span className="rounded bg-neutral-800 px-2 py-0.5">Carte Bancaire</span>
                      <span className="rounded bg-neutral-800 px-2 py-0.5">Virement</span>
                    </span>
                  </div>
                </div>

                {/* Key Points Summary Teaser */}
                <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                    <Sparkles className="h-4 w-4" />
                    <span>Ce que vous allez maîtriser</span>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {keyPoints.slice(0, 3).map((kp, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <span className="leading-snug">{kp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* DETAILED SECTIONS                                              */}
        {/* ============================================================== */}
        <section className="mt-8 border-t border-neutral-800 bg-neutral-900/20 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* MAIN CONTENT AREA (lg:col-span-8) */}
              <div className="lg:col-span-8 space-y-12">
                {/* 1. KEY POINTS */}
                <div id="key-points" className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Les Points Clés d'Apprentissage</span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold text-white">
                    Ce que vous allez transformer avec ce livre audio
                  </h2>
                  <p className="mt-1 text-xs text-neutral-400">
                    Des concepts puissants synthétisés pour une application directe dans vos projets.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {keyPoints.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-2xl border border-neutral-800/80 bg-neutral-950/60 p-4 transition-colors hover:border-neutral-700"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                          {index + 1}
                        </div>
                        <p className="text-xs leading-relaxed text-neutral-200">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. DESCRIPTION COMPLETE */}
                <div id="description" className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                    <BookOpen className="h-4 w-4" />
                    <span>Présentation Intégrale</span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold text-white">
                    Description Complète du Livre
                  </h2>

                  <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-300">
                    {product.full_description ? (
                      product.full_description.split('\n\n').map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))
                    ) : (
                      <>
                        <p>
                          {product.short_description || product.summary}
                        </p>
                        <p>
                          Dans un environnement où le temps est votre actif le plus précieux, ce livre audio a été conçu pour délivrer l'essence stratégique des meilleures pratiques en matière de leadership, d'investissement et de développement stratégique.
                        </p>
                        <p>
                          Chaque chapitre a été soigneusement édité pour éliminer le superflu et se concentrer exclusivement sur les leviers d'action à fort impact. Écoutez-le lors de vos déplacements, de vos séances de sport ou lors de vos moments de réflexion pour nourrir votre esprit d'idées novatrices.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. BONUS SECTION */}
                {product.bonus && (
                  <div id="bonus" className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/20 p-6 sm:p-8 shadow-xl">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                      <Gift className="h-4 w-4" />
                      <span>Bonus Exclusif Inclus</span>
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-bold text-white">
                      Un pack complet avec votre bonus offert
                    </h2>
                    <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
                      En commandant ce livre audio aujourd'hui, vous débloquez immédiatement sans surcoût :
                    </p>

                    <div className="mt-5 flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-neutral-950/80 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-neutral-950 font-extrabold text-xl shadow-md">
                        🎁
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-amber-300">
                          {product.bonus}
                        </h3>
                        <p className="mt-1 text-xs text-neutral-300 leading-relaxed">
                          Document synthétique et fiches d'exercices pratiques téléchargeables au format PDF pour accélérer l'implémentation des apprentissages audio.
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-amber-400 font-semibold">
                          <span>Valeur : 29 €</span>
                          <span>•</span>
                          <span className="text-emerald-400">Offert à 100% avec ce livre</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CONTENU DU PRODUIT */}
                <div id="contenu" className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                    <Sparkles className="h-4 w-4" />
                    <span>Contenu du Pack Audio</span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold text-white">
                    Ce que vous recevez immédiatement après commande
                  </h2>
                  <p className="mt-1 text-xs text-neutral-400">
                    Un accès complet sans restriction DRM pour écouter où vous voulez, quand vous voulez.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                        <Headphones className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">Livre Audio Intégral en Haute Définition</div>
                        <div className="text-[11px] text-neutral-400">Fichiers MP3 320 kbps découpés par chapitres avec métadonnées complètes</div>
                      </div>
                      <span className="text-xs font-mono text-amber-400 font-semibold">Inclus</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">Guide d'accompagnement & Synthèse PDF</div>
                        <div className="text-[11px] text-neutral-400">Fiche récapitulative des concepts clés et fiches d'actions concrètes</div>
                      </div>
                      <span className="text-xs font-mono text-amber-400 font-semibold">Inclus</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                        <Gift className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">Bonus Exclusif VISION BOOKS</div>
                        <div className="text-[11px] text-neutral-400">{product.bonus || 'Outil complémentaire d’accélération'}</div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-semibold">Offert</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">Accès à vie et téléchargements illimités</div>
                        <div className="text-[11px] text-neutral-400">Pas d'abonnement récurrent, les fichiers vous appartiennent pour toujours</div>
                      </div>
                      <span className="text-xs font-mono text-amber-400 font-semibold">Garantie</span>
                    </div>
                  </div>
                </div>

                {/* 5. INFORMATIONS AUDIO DISPONIBLES */}
                <div id="audio-info" className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                    <Headphones className="h-4 w-4" />
                    <span>Spécifications Audio Studio</span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold text-white">
                    Informations Audio Disponibles
                  </h2>
                  <p className="mt-1 text-xs text-neutral-400">
                    Une production audio irréprochable calibrée pour une écoute claire et stimulante.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                      <div className="text-xs font-bold text-white">Narration & Voix</div>
                      <p className="mt-1 text-xs text-neutral-400">
                        Voix professionnelle captivante en langue française, diction parfaite et rythme adapté à la mémorisation.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                      <div className="text-xs font-bold text-white">Mastering Studio HD</div>
                      <p className="mt-1 text-xs text-neutral-400">
                        Échantillonnage 320 kbps MP3 stéréo dynamique, compression acoustique calibrée pour écoute en voiture et casque.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                      <div className="text-xs font-bold text-white">Écoute Hors Ligne & Mobilité</div>
                      <p className="mt-1 text-xs text-neutral-400">
                        Téléchargez les fichiers directement dans l'application de votre choix (Apple Music, Spotify local, VLC, Smart AudioBook).
                      </p>
                    </div>

                    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                      <div className="text-xs font-bold text-white">Extrait Pré-écoute</div>
                      <p className="mt-1 text-xs text-neutral-400">
                        Extrait officiel de 2 minutes disponible ci-dessus pour juger de la qualité de la narration avant commande.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SIDEBAR: LIVRE DETAILS (Détails du livre) & QUICK ACTIONS (lg:col-span-4) */}
              <div className="lg:col-span-4 space-y-6">
                {/* DÉTAILS DU LIVRE */}
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                    <BookOpen className="h-4 w-4" />
                    <span>Fiche Technique</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-white">
                    Détails du Livre Audio
                  </h3>

                  <div className="mt-5 divide-y divide-neutral-800 text-xs">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-neutral-400">Titre :</span>
                      <span className="font-semibold text-white truncate max-w-[180px]">{product.title}</span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-neutral-400">Auteur :</span>
                      <span className="font-semibold text-white">{product.author}</span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-neutral-400">Catégorie :</span>
                      <span className="font-semibold text-amber-400">
                        {category ? category.name : product.category}
                      </span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-neutral-400">Format :</span>
                      <span className="font-semibold text-white">Livre Audio Numérique (MP3)</span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-neutral-400">Débit audio :</span>
                      <span className="font-semibold text-white">320 kbps Haute Définition</span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-neutral-400">Langue :</span>
                      <span className="font-semibold text-white">Français (Intégral)</span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-neutral-400">Protection :</span>
                      <span className="font-semibold text-emerald-400">Sans DRM (Usage libre)</span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-neutral-400">Disponibilité :</span>
                      <span className="font-semibold text-emerald-400">Immédiate après validation</span>
                    </div>
                  </div>

                  {/* Sidebar WhatsApp Order Button */}
                  <div className="mt-6 pt-4 border-t border-neutral-800">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-xs text-neutral-400">Prix :</span>
                      <div className="flex items-baseline gap-2">
                        {hasPromo ? (
                          <>
                            <span className="font-mono text-xl font-extrabold text-amber-400">
                              {currentPrice.toFixed(2)} €
                            </span>
                            <span className="font-mono text-xs text-neutral-500 line-through">
                              {regularPrice.toFixed(2)} €
                            </span>
                          </>
                        ) : (
                          <span className="font-mono text-xl font-extrabold text-white">
                            {regularPrice.toFixed(2)} €
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleOrderWhatsApp}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Commander sur WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Assistance card */}
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 text-xs font-bold text-white">Besoin d'aide ou question ?</h4>
                  <p className="mt-1 text-[11px] text-neutral-400 leading-relaxed">
                    Notre équipe VISION BOOKS est à votre écoute directe sur WhatsApp pour répondre à vos questions et vous guider.
                  </p>
                  <button
                    onClick={handleOrderWhatsApp}
                    className="mt-3 text-xs font-semibold text-amber-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Poser une question</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* GRAND CTA DE CONVERSION EN BAS DE PAGE                         */}
        {/* ============================================================== */}
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-8 sm:p-12 text-center shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Passez à l'action dès aujourd'hui</span>
              </span>

              <h2 className="mt-4 font-display text-2xl sm:text-4xl font-extrabold text-white">
                Prêt à transformer vos compétences avec "{product.title}" ?
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Obtenez le livre audio complet en haute définition avec le bonus exclusif et commencez votre écoute en quelques minutes.
              </p>

              {/* Price comparison */}
              <div className="mt-6 flex items-center justify-center gap-3">
                {hasPromo ? (
                  <>
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-400">
                      {currentPrice.toFixed(2)} €
                    </span>
                    <span className="font-mono text-lg text-neutral-500 line-through">
                      {regularPrice.toFixed(2)} €
                    </span>
                    <span className="rounded bg-red-600 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                      -{discountPercent}%
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">
                    {regularPrice.toFixed(2)} €
                  </span>
                )}
              </div>

              {/* Big Bottom WhatsApp CTA */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleOrderWhatsApp}
                  className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-8 py-4 text-base font-extrabold text-white shadow-xl shadow-emerald-950/60 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="h-5 w-5 fill-white/20" />
                  <span>Commander sur WhatsApp</span>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-400" />
                  Téléchargement direct
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-400" />
                  Bonus inclus offert
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-400" />
                  Paiement sécurisé
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SIMILAR PRODUCTS SECTION                                       */}
        {/* ============================================================== */}
        {similarProducts.length > 0 && (
          <section className="border-t border-neutral-800 bg-neutral-900/30 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                    Découvrez Aussi
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-bold text-white">
                    Autres livres audio dans la même thématique
                  </h3>
                </div>

                {category && (
                  <a
                    href={`/categorie/${category.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(`/categorie/${category.slug}`);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-400"
                  >
                    <span>Voir toute la catégorie {category.name}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {similarProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    categoryName={category ? `${category.icon} ${category.name}` : undefined}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ================================================================ */}
      {/* MOBILE STICKY CTA BAR (Optimized Conversion on Mobile Devices)     */}
      {/* ================================================================ */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-neutral-950/95 p-3 backdrop-blur-md flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex flex-col">
          <span className="font-mono text-lg font-extrabold text-amber-400">
            {currentPrice.toFixed(2)} €
          </span>
          {hasPromo && (
            <span className="font-mono text-[10px] text-neutral-500 line-through">
              {regularPrice.toFixed(2)} €
            </span>
          )}
        </div>

        <button
          onClick={handleOrderWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white shadow-md active:scale-95 transition-transform"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Commander sur WhatsApp</span>
        </button>
      </div>

      <Footer />
      <AudioPreviewModal />
    </div>
  );
};

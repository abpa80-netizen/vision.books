import React from 'react';
import { MessageCircle, ArrowRight, Sparkles, BookOpen, Headphones } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FinalCtaSection: React.FC = () => {
  const { settings, navigateTo } = useApp();
  const phone = (settings?.whatsapp_number || '22990000000').replace(/[^0-9]/g, '');

  const defaultMsg = encodeURIComponent(
    'Bonjour VISION BOOKS, je souhaite découvrir le catalogue complet de livres audio et passer commande.'
  );

  return (
    <section className="relative overflow-hidden border-b border-neutral-800 bg-neutral-900/60 py-20 sm:py-24">
      {/* Background ambient accents */}
      <div className="pointer-events-none absolute -bottom-10 right-0 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-10 left-0 h-80 w-80 rounded-full bg-amber-600/5 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Passez à l'Action Dès Aujourd'hui</span>
        </div>

        <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Prêt à transformer vos temps morts en <br className="hidden sm:inline" />
          <span className="text-amber-400">accélérateurs de réussite</span> ?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-neutral-300">
          Accédez dès maintenant aux condensés des meilleurs ouvrages mondiaux en finance, business, leadership et stratégie. Commandez directement en quelques clics via WhatsApp.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`https://wa.me/${phone}?text=${defaultMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 transition-all shadow-xl hover:shadow-amber-500/20"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Commander sur WhatsApp</span>
          </a>

          <button
            onClick={() => navigateTo('/produits')}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-7 py-3.5 text-sm font-semibold text-white hover:bg-neutral-800 hover:border-neutral-600 transition-all"
          >
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span>Explorer tous les livres</span>
            <ArrowRight className="h-4 w-4 text-neutral-400" />
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Headphones className="h-4 w-4 text-amber-400" />
            <span>Audio Studio HD MP3</span>
          </div>
          <span className="text-neutral-700">·</span>
          <div>Validation immédiate 7j/7</div>
          <span className="text-neutral-700">·</span>
          <div>Bonus d'action & fiches synthèses inclus</div>
        </div>
      </div>
    </section>
  );
};

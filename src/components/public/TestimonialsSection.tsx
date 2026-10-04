import React from 'react';
import { Star, Quote, CheckCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TestimonialsSection: React.FC = () => {
  const { testimonials } = useApp();

  const activeTestimonials = testimonials.filter((t) => t.is_active !== false);

  if (activeTestimonials.length === 0) return null;

  return (
    <section id="temoignages" className="border-b border-neutral-800 bg-neutral-900/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>Retours d'Expérience Vérifiés</span>
          </div>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ce Que Disent Nos Auditeurs
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Entrepreneurs, investisseurs et cadres dirigeants partagent l'impact concret des condensés VISION BOOKS dans leurs décisions.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {activeTestimonials.map((item) => {
            const stars = item.rating ?? 5;
            const avatar = item.avatar_url || item.avatarUrl;
            const bookTitle = item.audiobook_title || item.audiobookTitle;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-sm hover:border-neutral-700 transition-colors"
              >
                <div>
                  {/* Rating stars & Quote icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < stars
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-neutral-800 text-neutral-800'
                          }`}
                        />
                      ))}
                    </div>
                    <Quote className="h-4 w-4 text-neutral-700" />
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-neutral-300 italic">
                    "{item.content}"
                  </p>

                  {bookTitle && (
                    <div className="mt-4 rounded-lg bg-neutral-900/90 border border-neutral-850 px-2.5 py-1.5 text-[11px] text-amber-400">
                      Livre : <span className="text-white font-medium truncate block">{bookTitle}</span>
                    </div>
                  )}
                </div>

                {/* Author info */}
                <div className="mt-6 flex items-center gap-3 border-t border-neutral-850 pt-4">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={item.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover border border-amber-500/30"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-neutral-800 text-xs font-bold text-amber-400 border border-amber-500/30">
                      {item.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-xs font-bold text-white">{item.name}</p>
                      <CheckCircle className="h-3 w-3 text-amber-500 shrink-0" />
                    </div>
                    {(item.role || item.company) && (
                      <p className="truncate text-[10px] text-neutral-400">
                        {item.role}
                        {item.company ? ` · ${item.company}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

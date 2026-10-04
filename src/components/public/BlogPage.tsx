import React, { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Clock, User, ArrowRight, Search, FileText, Sparkles, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BlogPage: React.FC = () => {
  const { blogPosts, navigateTo } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const publishedPosts = blogPosts.filter((p) => p.is_published !== false);

  const categories = Array.from(new Set(publishedPosts.map((p) => p.category))).filter(Boolean);

  const filteredPosts = publishedPosts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Header />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Analyses & Méthodologie</span>
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Le Journal VISION BOOKS
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-neutral-400">
              Articles de fond, décryptages stratégiques et techniques d'apprentissage accéléré pour dirigeants, investisseurs et créateurs ambitieux.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-y border-neutral-800/80 py-5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un sujet, mot-clé ou auteur..."
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                Tous ({publishedPosts.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === c
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const postUrl = `/blog/${post.slug}`;
              const image = post.imageUrl || post.image_url || '/src/assets/images/cover_business_empire_1790615532791.jpg';

              return (
                <article
                  key={post.id}
                  onClick={() => navigateTo(postUrl)}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700 hover:shadow-2xl hover:shadow-amber-500/5 cursor-pointer"
                >
                  {/* Article Banner */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-950">
                    <img
                      src={image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80" />

                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-neutral-950/90 border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 backdrop-blur-md">
                        {post.category}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] text-neutral-300">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>{post.readTime || post.read_time || '5 min'}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] text-neutral-500 font-mono">{post.date}</span>
                      <h2 className="mt-2 font-display text-lg font-bold text-white transition-colors group-hover:text-amber-400 line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="mt-3 text-xs leading-relaxed text-neutral-400 line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-neutral-300">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-bold text-amber-400">
                          {post.author.slice(0, 1)}
                        </div>
                        <span className="text-neutral-400 text-[11px] font-medium">{post.author}</span>
                      </div>

                      <div className="flex items-center gap-1 font-bold text-amber-400 group-hover:text-amber-300">
                        <span>Lire</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredPosts.length === 0 && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-neutral-600" />
              <h3 className="mt-4 font-display text-lg font-bold text-white">
                Aucun article ne correspond à votre recherche
              </h3>
              <p className="mt-2 text-xs text-neutral-400">
                Essayez d'autres mots-clés ou réinitialisez le filtre de thématique.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="mt-6 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* Lead Magnet Banner in Blog */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Ressource Complémentaire Offerte
              </span>
              <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
                Téléchargez gratuitement nos guides et protocoles d'action
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Condensés stratégiques des 10 principes inviolables de la liberté financière et du closing à haute tension.
              </p>
            </div>
            <button
              onClick={() => navigateTo('/lead-magnet/guide-liberte-financiere')}
              className="rounded-xl bg-amber-500 px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-neutral-950 hover:bg-amber-400 shadow-xl shadow-amber-500/10 active:scale-95 transition-all whitespace-nowrap"
            >
              Débloquer mon Guide Gratuit
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

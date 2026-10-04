import React from 'react';
import { Clock, User, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BlogSection: React.FC = () => {
  const { blogPosts, navigateTo } = useApp();

  const publishedPosts = blogPosts.filter((p) => p.is_published !== false).slice(0, 3);

  if (publishedPosts.length === 0) return null;

  return (
    <section id="blog" className="border-b border-neutral-800 bg-neutral-950 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ressources & Réflexions</span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Le Journal VISION BOOKS
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              Analyses, méthodes d'écoute active et réflexions stratégiques pour les esprits ambitieux.
            </p>
          </div>

          <button
            onClick={() => navigateTo('/blog')}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-amber-500 hover:text-amber-400 transition-colors"
          >
            <span>Explorer tous les articles</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Blog Posts Grid */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {publishedPosts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-900/80 cursor-pointer"
              onClick={() => navigateTo(`/blog/${post.slug || post.id}`)}
            >
              <div>
                {/* Meta header */}
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="font-semibold text-amber-400">{post.category}</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span>{post.date}</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-neutral-500" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h3 className="mt-4 font-display text-lg font-bold text-white transition-colors group-hover:text-amber-400 line-clamp-2">
                  {post.title}
                </h3>

                <p className="mt-3 text-xs leading-relaxed text-neutral-300 line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-neutral-800/80 pt-4">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <User className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{post.author}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo(`/blog/${post.slug || post.id}`);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-400"
                >
                  <span>Lire l'article</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

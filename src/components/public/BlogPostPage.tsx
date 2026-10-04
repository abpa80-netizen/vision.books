import React, { useMemo } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import {
  ArrowLeft,
  Clock,
  User,
  Share2,
  Calendar,
  Check,
  BookOpen,
  Headphones,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BlogPostPageProps {
  slug: string;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug }) => {
  const { blogPosts, products, navigateTo, showToast } = useApp();

  const post = useMemo(() => {
    return blogPosts.find(
      (p) => p.slug === slug || p.id === slug || p.slug === decodeURIComponent(slug)
    );
  }, [blogPosts, slug]);

  const recommendedProducts = useMemo(() => {
    return products.filter((p) => p.is_active).slice(0, 3);
  }, [products]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Lien de l\'article copié dans le presse-papier !', 'success');
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="font-display text-2xl font-bold text-white">Article introuvable</h1>
            <p className="mt-2 text-xs text-neutral-400">
              L'article que vous recherchez n'existe pas ou a été déplacé.
            </p>
            <button
              onClick={() => navigateTo('/blog')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour au blog</span>
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const image = post.imageUrl || post.image_url || '/src/assets/images/cover_business_empire_1790615532791.jpg';

  // Format content paragraphs
  const contentText = post.content || post.excerpt;
  const sections = contentText.split('\n\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Back Button & Share */}
          <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
            <button
              onClick={() => navigateTo('/blog')}
              className="group flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Retour au Journal VISION BOOKS</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
              title="Partager cet article"
            >
              <Share2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Partager</span>
            </button>
          </div>

          {/* Article Header Metadata */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {post.category}
              </span>
              <span className="text-neutral-500">·</span>
              <span className="flex items-center gap-1 text-neutral-400 font-mono text-xs">
                <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                <span>{post.date}</span>
              </span>
              <span className="text-neutral-500">·</span>
              <span className="flex items-center gap-1 text-neutral-400 text-xs">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>{post.readTime || post.read_time || '5 min'} de lecture</span>
              </span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
              {post.title}
            </h1>

            {/* Author Profile Lockup */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-bold text-sm shadow-sm">
                {post.author.slice(0, 1)}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{post.author}</div>
                <div className="text-[11px] text-neutral-400">Rédaction stratégique VISION BOOKS</div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            <img
              src={image}
              alt={post.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
          </div>

          {/* Lead Paragraph Excerpt */}
          <div className="rounded-2xl border-l-4 border-amber-500 bg-neutral-900/60 p-6 backdrop-blur-sm">
            <p className="text-sm sm:text-base leading-relaxed text-neutral-200 font-medium italic">
              « {post.excerpt} »
            </p>
          </div>

          {/* Full Article Content */}
          <div className="space-y-6 text-sm sm:text-base leading-relaxed text-neutral-300 border-b border-neutral-850 pb-12">
            {sections.map((sec, idx) => {
              // Heading 3
              if (sec.startsWith('### ')) {
                return (
                  <h3 key={idx} className="font-display text-xl sm:text-2xl font-bold text-white pt-4 text-amber-400">
                    {sec.replace('### ', '')}
                  </h3>
                );
              }
              // Heading 2
              if (sec.startsWith('## ')) {
                return (
                  <h2 key={idx} className="font-display text-2xl font-bold text-white pt-6">
                    {sec.replace('## ', '')}
                  </h2>
                );
              }
              // Normal Paragraph
              return (
                <p key={idx} className="leading-relaxed">
                  {sec}
                </p>
              );
            })}
          </div>

          {/* Bottom Recommended Audiobooks Box */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Approfondir par l'écoute
                </span>
                <h3 className="mt-1 font-display text-xl font-bold text-white">
                  Livres audio recommandés pour cette thématique
                </h3>
              </div>
              <button
                onClick={() => navigateTo('/produits')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>Catalogue complet</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {recommendedProducts.map((book) => (
                <div
                  key={book.id}
                  onClick={() => navigateTo(`/produit/${book.slug}`)}
                  className="group rounded-xl border border-neutral-800 bg-neutral-950/80 p-3.5 transition-all hover:border-amber-500/50 hover:bg-neutral-900 cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={book.cover || book.coverUrl}
                      alt={book.title}
                      className="h-12 w-9 rounded object-cover shadow-sm bg-neutral-950 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                        {book.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400 truncate">{book.author}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-neutral-850 pt-2 text-[11px]">
                    <span className="font-bold text-white font-mono">
                      {(book.sale_price || book.normal_price).toFixed(2)} €
                    </span>
                    <span className="text-[10px] font-semibold text-amber-400 group-hover:underline">
                      Découvrir →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

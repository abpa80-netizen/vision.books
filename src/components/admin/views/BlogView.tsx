import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Clock,
  User,
  X,
  Check,
  Search,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { BlogPost } from '../../../types';
import { ImageUploader } from '../ImageUploader';

export const BlogView: React.FC = () => {
  const {
    blogPosts,
    addBlogPost,
    updateBlogPost,
    toggleBlogPostStatus,
    deleteBlogPost,
    navigateTo,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<BlogPost | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Stratégie & Efficacité');
  const [author, setAuthor] = useState('Équipe Éditoriale VISION BOOKS');
  const [date, setDate] = useState('');
  const [readTime, setReadTime] = useState('5 min');
  const [imageUrl, setImageUrl] = useState('/src/assets/images/cover_business_empire_1790615532791.jpg');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const sampleCovers = [
    { label: 'Business & Stratégie', url: '/src/assets/images/cover_business_empire_1790615532791.jpg' },
    { label: 'Finance & Richesse', url: '/src/assets/images/cover_financial_liberty_1790615544438.jpg' },
    { label: 'Mindset & Leadership', url: '/src/assets/images/cover_mindset_power_1790615556990.jpg' },
  ];

  const categories = [
    'Méthodologie & Efficacité',
    'Finance & Stratégie',
    'Mindset & Leadership',
    'Marketing & Vente',
    'Productivité & Focus',
  ];

  const openAddModal = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setCategory('Méthodologie & Efficacité');
    setAuthor('Équipe Éditoriale VISION BOOKS');
    setDate(
      new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
    setReadTime('5 min');
    setImageUrl('/src/assets/images/cover_business_empire_1790615532791.jpg');
    setExcerpt('');
    setContent('');
    setIsPublished(true);
    setIsAddModalOpen(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setCategory(post.category);
    setAuthor(post.author);
    setDate(post.date);
    setReadTime(post.readTime || post.read_time || '5 min');
    setImageUrl(post.imageUrl || post.image_url || '/src/assets/images/cover_business_empire_1790615532791.jpg');
    setExcerpt(post.excerpt);
    setContent(post.content || '');
    setIsPublished(post.is_published !== false);
    setIsAddModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingPost) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      category,
      author: author.trim() || 'VISION BOOKS',
      date: date.trim() || new Date().toLocaleDateString('fr-FR'),
      readTime: readTime.trim() || '5 min',
      read_time: readTime.trim() || '5 min',
      imageUrl: imageUrl.trim(),
      image_url: imageUrl.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      is_published: isPublished,
    };

    if (editingPost) {
      await updateBlogPost(editingPost.id, payload);
    } else {
      await addBlogPost(payload);
    }

    setIsAddModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    await deleteBlogPost(deleteCandidate.id);
    setDeleteCandidate(null);
  };

  // Filtered posts
  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      post.author.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || post.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-neutral-850 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Gestion du Blog & Analyses
            </h1>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-400 border border-amber-500/20">
              {blogPosts.length} articles
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Créez, modifiez, illustrez et publiez vos articles de fond et guides stratégiques.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('/blog')}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
            <span>Voir le Blog public</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, résumé ou auteur..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'all'
                ? 'bg-amber-500 text-neutral-950 font-bold'
                : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            Toutes les thématiques
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === c
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Articles */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => {
          const isPub = post.is_published !== false;
          const displayImage = post.imageUrl || post.image_url || '/src/assets/images/cover_business_empire_1790615532791.jpg';

          return (
            <div
              key={post.id}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-850 bg-neutral-900/50 backdrop-blur-sm transition-all hover:border-neutral-750"
            >
              {/* Cover Banner */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-950">
                <img
                  src={displayImage}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="rounded-full bg-neutral-950/80 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 backdrop-blur-md">
                    {post.category}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                      isPub
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {isPub ? 'Publié' : 'Brouillon'}
                  </span>
                </div>

                <div className="absolute bottom-2 left-3 flex items-center gap-2 text-[10px] text-neutral-400">
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span>{post.readTime || post.read_time || '5 min'}</span>
                  <span>·</span>
                  <span>{post.date}</span>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-white line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-400 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="h-3 w-3 shrink-0 text-neutral-500" />
                    <span className="truncate">{post.author}</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500 truncate max-w-[120px]">
                    /{post.slug}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-neutral-850 bg-neutral-950/60 px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigateTo(`/blog/${post.slug}`)}
                  className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-amber-400 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Lire l'article</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleBlogPostStatus(post.id)}
                    title={isPub ? 'Dépublier' : 'Publier'}
                    className={`rounded p-1.5 transition-colors ${
                      isPub ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-neutral-500 hover:bg-neutral-800'
                    }`}
                  >
                    {isPub ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(post)}
                    title="Modifier l'article"
                    className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCandidate(post)}
                    title="Supprimer"
                    className="rounded p-1.5 text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/30 p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-neutral-600" />
          <h3 className="mt-3 font-display text-sm font-semibold text-white">
            Aucun article trouvé
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Ajustez votre recherche ou créez un nouvel article pour le blog.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Créer un article</span>
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl my-8">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-850 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {editingPost ? "Modifier l'Article" : 'Rédiger un Nouvel Article'}
                </h2>
                <p className="text-xs text-neutral-400">
                  Renseignez tous les éléments éditoriaux et visuels avant publication.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Titre de l'Article *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex: Les 7 principes de concentration des leaders..."
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Slug & Date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Slug de l'URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="les-7-principes-de-concentration"
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 font-mono text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Date de Publication
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="Ex: 29 Septembre 2026"
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Catégorie & Auteur & Temps de lecture */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Thématique
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Auteur
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Alexandre Beaulieu"
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Temps de lecture
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="5 min"
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Principale (Téléversement depuis ordinateur) */}
              <div>
                <ImageUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Image Principale de l'Article *"
                  helpText="Sélectionnez une image (PNG, JPG, WebP) depuis votre ordinateur"
                  aspectRatio="16/9"
                />

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                  <span>Préréglages d'images :</span>
                  {sampleCovers.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(s.url)}
                      className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                        imageUrl === s.url
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'bg-neutral-900 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extrait */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Extrait / Chapô (résumé affiché dans les listes) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Accroche percutante qui résume l'intérêt de la lecture..."
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-xs leading-relaxed text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Contenu complet */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Contenu Complet de l'Article
                </label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Rédigez l'article complet. Vous pouvez utiliser du Markdown (### Titres, listes à puces)..."
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 font-mono text-xs leading-relaxed text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Statut de publication */}
              <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div>
                  <div className="text-xs font-semibold text-white">Statut de Publication</div>
                  <div className="text-[11px] text-neutral-400">
                    {isPublished ? 'Visible immédiatement sur /blog' : 'Enregistré comme brouillon privé'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublished ? 'bg-amber-500 justify-end pr-1' : 'bg-neutral-800 justify-start pl-1'
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-neutral-950 shadow-sm" />
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/10"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>{editingPost ? 'Mettre à jour' : "Publier l'Article"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-neutral-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-display text-base font-bold text-white">
                Supprimer cet article ?
              </h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-400">
              Êtes-vous sûr de vouloir supprimer définitivement l'article{' '}
              <strong className="text-white">« {deleteCandidate.title} »</strong> ? Cette action est irréversible.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition-colors"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

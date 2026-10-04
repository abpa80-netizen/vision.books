import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Star,
  X,
  Check,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  User,
  AlertTriangle,
  BookOpen,
  Search,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Testimonial } from '../../../types';
import { ImageUploader } from '../ImageUploader';

export const TestimonialsView: React.FC = () => {
  const {
    testimonials,
    addTestimonial,
    updateTestimonial,
    toggleTestimonialStatus,
    deleteTestimonial,
    products,
  } = useApp();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTesti, setEditingTesti] = useState<Testimonial | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Testimonial | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [audiobookTitle, setAudiobookTitle] = useState(products[0]?.title || "L'Empire du Business Moderne");
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingTesti(null);
    setName('');
    setRole('');
    setCompany('');
    setAvatarUrl('');
    setContent('');
    setRating(5);
    setAudiobookTitle(products[0]?.title || "L'Empire du Business Moderne");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Testimonial) => {
    setEditingTesti(t);
    setName(t.name);
    setRole(t.role || '');
    setCompany(t.company || '');
    setAvatarUrl(t.avatar_url || t.avatarUrl || '');
    setContent(t.content);
    setRating(t.rating ?? 5);
    setAudiobookTitle(t.audiobook_title || t.audiobookTitle || products[0]?.title || '');
    setIsActive(t.is_active !== false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    const payload = {
      name: name.trim(),
      role: role.trim(),
      company: company.trim(),
      avatar_url: avatarUrl.trim(),
      avatarUrl: avatarUrl.trim(),
      content: content.trim(),
      rating,
      audiobook_title: audiobookTitle,
      audiobookTitle,
      is_active: isActive,
    };

    if (editingTesti) {
      await updateTestimonial(editingTesti.id, payload);
    } else {
      await addTestimonial(payload);
    }

    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    await deleteTestimonial(deleteCandidate.id);
    setDeleteCandidate(null);
  };

  const filteredTestimonials = testimonials.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.content.toLowerCase().includes(term) ||
      (t.company && t.company.toLowerCase().includes(term)) ||
      (t.role && t.role.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-neutral-850 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Gestion des Témoignages
            </h1>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-400 border border-amber-500/20">
              {testimonials.length} avis
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Avis vérifiés, retours d'expérience et citations clients affichés sur la page d'accueil de VISION BOOKS.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/10"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Ajouter un Témoignage</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, entreprise ou mot-clé..."
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Grid of Testimonials */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTestimonials.map((t) => {
          const isAct = t.is_active !== false;
          const avatar = t.avatar_url || t.avatarUrl;
          const stars = t.rating ?? 5;

          return (
            <div
              key={t.id}
              className="flex flex-col justify-between rounded-xl border border-neutral-850 bg-neutral-900/50 p-6 backdrop-blur-sm transition-all hover:border-neutral-750"
            >
              <div>
                {/* Header card with Stars & Status */}
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
                    <span className="ml-1.5 font-mono text-[11px] font-bold text-neutral-400">
                      {stars}/5
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isAct
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                    }`}
                  >
                    {isAct ? 'Publié' : 'Inactif'}
                  </span>
                </div>

                {/* Quote Text */}
                <p className="mt-4 text-xs leading-relaxed text-neutral-300 italic">
                  "{t.content}"
                </p>

                {/* Associated Book Pill */}
                {(t.audiobook_title || t.audiobookTitle) && (
                  <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-2.5 py-1.5 text-[11px] text-amber-400">
                    <BookOpen className="h-3 w-3 shrink-0 text-amber-500" />
                    <span className="truncate text-neutral-300">
                      Livre : <strong className="text-white">{t.audiobook_title || t.audiobookTitle}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Author Info & Actions */}
              <div className="mt-6 pt-4 border-t border-neutral-850 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={t.name}
                      className="h-9 w-9 rounded-full object-cover border border-amber-500/30 shrink-0"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 text-xs font-bold text-amber-400 border border-amber-500/30">
                      {t.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-white">{t.name}</div>
                    <div className="truncate text-[11px] text-neutral-400">
                      {t.role}
                      {t.company ? ` · ${t.company}` : ''}
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => toggleTestimonialStatus(t.id)}
                    title={isAct ? 'Dépublier' : 'Publier sur le site'}
                    className={`rounded p-1.5 transition-colors ${
                      isAct ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-neutral-500 hover:bg-neutral-800'
                    }`}
                  >
                    {isAct ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(t)}
                    title="Modifier"
                    className="rounded p-1.5 text-neutral-400 hover:bg-neutral-850 hover:text-white transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCandidate(t)}
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

      {filteredTestimonials.length === 0 && (
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/30 p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-neutral-600" />
          <h3 className="mt-3 font-display text-sm font-semibold text-white">
            Aucun témoignage trouvé
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Ajoutez le premier avis client vérifié pour renforcer la preuve sociale de VISION BOOKS.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter un avis</span>
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-850 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {editingTesti ? 'Modifier le Témoignage' : 'Nouveau Témoignage Client'}
                </h2>
                <p className="text-xs text-neutral-400">
                  Renseignez l'avis, l'évaluation et les informations de profil.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Nom du Client *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Julien Renard"
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Rôle & Entreprise */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Poste / Fonction
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Fondateur & CEO"
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Société / Projet
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ex: Novacrest Capital"
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Photo du client & Note */}
              <div className="space-y-4">
                <div>
                  <ImageUploader
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    label="Photo / Avatar du Client (facultative)"
                    helpText="Sélectionnez une photo depuis votre ordinateur (laisser vide pour afficher les initiales)"
                    aspectRatio="square"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Note Attribuée (étoiles 1 à 5)
                  </label>
                  <div className="mt-1.5 flex items-center gap-1.5 h-10 px-3 rounded-xl border border-neutral-800 bg-neutral-900 w-fit">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            star <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-neutral-700 text-neutral-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-mono text-xs font-bold text-neutral-300">
                      {rating}/5
                    </span>
                  </div>
                </div>
              </div>

              {/* Livre audio associé */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Livre Audio Concerné
                </label>
                <select
                  value={audiobookTitle}
                  onChange={(e) => setAudiobookTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title}
                    </option>
                  ))}
                  <option value="Plateforme VISION BOOKS">Plateforme VISION BOOKS (Général)</option>
                </select>
              </div>

              {/* Contenu */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Texte du Témoignage *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ce que le client a pensé du livre audio, des résultats obtenus, de la rapidité de la commande WhatsApp..."
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-xs leading-relaxed text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Statut */}
              <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div>
                  <div className="text-xs font-semibold text-white">Statut de Publication</div>
                  <div className="text-[11px] text-neutral-400">
                    {isActive ? "Visible immédiatement sur la page d'accueil" : 'Masqué (en attente de validation)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`flex h-6 w-11 items-center rounded-full transition-colors ${
                    isActive ? 'bg-amber-500 justify-end pr-1' : 'bg-neutral-800 justify-start pl-1'
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-neutral-950 shadow-sm" />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/10"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>{editingTesti ? 'Mettre à jour' : 'Enregistrer'}</span>
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
                Supprimer ce témoignage ?
              </h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-400">
              Êtes-vous sûr de vouloir supprimer définitivement le témoignage de{' '}
              <strong className="text-white">« {deleteCandidate.name} »</strong> ?
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

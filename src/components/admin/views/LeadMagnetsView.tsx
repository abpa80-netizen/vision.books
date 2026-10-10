import React, { useState } from 'react';
import {
  Gift,
  Plus,
  Download,
  Edit2,
  Trash2,
  ExternalLink,
  Check,
  X,
  FileText,
  Search,
  CheckCircle2,
  Power,
  Copy,
  Sparkles,
  BookOpen,
  Headphones,
  Package,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { LeadMagnet, LeadMagnetMarketingContent } from '../../../types';
import { ImageUploader } from '../ImageUploader';
import { FileUploader } from '../FileUploader';
import { LeadMagnetAiGeneratorModal } from './LeadMagnetAiGeneratorModal';

export const LeadMagnetsView: React.FC = () => {
  const {
    leadMagnets,
    addLeadMagnet,
    updateLeadMagnet,
    deleteLeadMagnet,
    toggleLeadMagnetStatus,
    navigateTo,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLm, setEditingLm] = useState<LeadMagnet | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    marketing_content: '',
    slug: '',
    image: '/src/assets/images/cover_financial_liberty_1790615544438.jpg',
    description: '',
    benefitsText: '',
    file_url: '/downloads/guide-visionbooks.pdf',
    active: true,
    format: 'ebook' as 'ebook' | 'audiobook' | 'other',
    topic: '',
    target_audience: '',
    raw_content: '',
    hook: '',
    cta_text: '',
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCopyShareLink = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/lead-magnet/${slug}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      showToast(`Lien de partage copié ! ${fullUrl}`, 'success');
    }
  };

  const openCreateModal = () => {
    setEditingLm(null);
    setFormData({
      title: '',
      subtitle: '',
      marketing_content: '',
      slug: '',
      image: '/src/assets/images/cover_financial_liberty_1790615544438.jpg',
      description: '',
      benefitsText: 'Guide stratégique complet et prêt à l\'emploi\nModèles mentaux et erreurs à éviter\nTemplate actionnable inclus',
      file_url: '/downloads/ressource-gratuite.pdf',
      active: true,
      format: 'ebook',
      topic: '',
      target_audience: 'Entrepreneurs, investisseurs et cadres ambitieux',
      raw_content: '',
      hook: '',
      cta_text: 'Télécharger gratuitement',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lm: LeadMagnet) => {
    setEditingLm(lm);
    setFormData({
      title: lm.title || '',
      subtitle: lm.subtitle || '',
      marketing_content: lm.marketing_content || '',
      slug: lm.slug || '',
      image: lm.image || '/src/assets/images/cover_financial_liberty_1790615544438.jpg',
      description: lm.description || '',
      benefitsText: Array.isArray(lm.benefits) ? lm.benefits.join('\n') : (lm.benefits || ''),
      file_url: lm.file_url || '/downloads/ressource.pdf',
      active: lm.active !== false,
      format: (lm.format as any) || 'ebook',
      topic: lm.topic || lm.title || '',
      target_audience: lm.target_audience || 'Entrepreneurs et investisseurs',
      raw_content: lm.raw_content || '',
      hook: lm.hook || '',
      cta_text: lm.cta_text || 'Télécharger gratuitement',
    });
    setIsModalOpen(true);
  };

  const handleApplyAiContent = (content: Partial<LeadMagnetMarketingContent> & { benefits?: string[] }) => {
    setFormData((prev) => ({
      ...prev,
      title: content.title || prev.title,
      subtitle: content.subtitle || prev.subtitle,
      description: content.description || prev.description,
      benefitsText: content.benefits ? content.benefits.join('\n') : prev.benefitsText,
      marketing_content: content.visitor_content || content.landing_text || prev.marketing_content,
      hook: content.hook || prev.hook,
      cta_text: content.cta_text || prev.cta_text,
    }));
  };

  const handleTitleChange = (newTitle: string) => {
    setFormData((prev) => {
      if (!editingLm) {
        const autoSlug = newTitle
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        return { ...prev, title: newTitle, slug: autoSlug };
      }
      return { ...prev, title: newTitle };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const benefitsArray = formData.benefitsText
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      marketing_content: formData.marketing_content.trim(),
      slug: formData.slug.trim(),
      image: formData.image.trim(),
      description: formData.description.trim(),
      benefits: benefitsArray,
      file_url: formData.file_url.trim(),
      active: formData.active,
    };

    if (editingLm) {
      await updateLeadMagnet(editingLm.id, payload);
      showToast('Lead Magnet mis à jour avec succès !', 'success');
    } else {
      await addLeadMagnet(payload);
      showToast('Nouveau Lead Magnet créé avec succès !', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteLeadMagnet(id);
    showToast('Lead Magnet supprimé.', 'info');
    setDeleteConfirmId(null);
  };

  const filteredLeadMagnets = leadMagnets.filter((lm) => {
    const matchesSearch =
      lm.title.toLowerCase().includes(search.toLowerCase()) ||
      lm.slug.toLowerCase().includes(search.toLowerCase()) ||
      (lm.description && lm.description.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && lm.active) ||
      (filterActive === 'inactive' && !lm.active);

    return matchesSearch && matchesFilter;
  });

  const totalDownloads = leadMagnets.reduce(
    (acc, lm) => acc + (lm.downloads_count || lm.downloadsCount || 0),
    0
  );
  const activeCount = leadMagnets.filter((lm) => lm.active).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white">Section « Lead Magnets »</h1>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-400 border border-amber-500/20">
              {leadMagnets.length} configurés
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Créez, modifiez, activez et gérez les ressources gratuites offertes aux visiteurs pour capturer des prospects qualifiés.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Lead Magnet</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Total Lead Magnets</span>
            <Gift className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">{leadMagnets.length}</div>
          <div className="mt-1 text-[11px] text-neutral-500">Ressources créées dans le catalogue</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Ressources Actives</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">{activeCount}</div>
          <div className="mt-1 text-[11px] text-neutral-500">Accessibles sur leurs URLs de capture</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Total Téléchargements</span>
            <Download className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
            {totalDownloads.toLocaleString('fr-FR')}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Prospects ayant débloqué un fichier</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, slug ou contenu..."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 py-2 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterActive(filter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterActive === filter
                  ? 'bg-amber-500 text-neutral-950 font-semibold'
                  : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              {filter === 'all' ? 'Tous' : filter === 'active' ? 'Actifs' : 'Inactifs'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Lead Magnets */}
      {filteredLeadMagnets.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
          <Gift className="mx-auto h-10 w-10 text-neutral-600" />
          <h3 className="mt-3 font-display text-sm font-bold text-white">Aucun Lead Magnet trouvé</h3>
          <p className="mt-1 text-xs text-neutral-400">
            Ajustez vos filtres ou créez votre premier Lead Magnet pour capturer des prospects qualifiés.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            <span>Créer un Lead Magnet</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLeadMagnets.map((lm) => {
            const isCurrentlyActive = lm.active;
            const benefitsList = Array.isArray(lm.benefits)
              ? lm.benefits
              : typeof lm.benefits === 'string'
              ? JSON.parse(lm.benefits || '[]')
              : [];

            return (
              <div
                key={lm.id}
                className={`group flex flex-col justify-between rounded-xl border transition-all ${
                  isCurrentlyActive
                    ? 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                    : 'border-neutral-850 bg-neutral-950/60 opacity-75'
                }`}
              >
                {/* Visual Header / Cover Image */}
                <div className="relative h-44 w-full overflow-hidden rounded-t-xl bg-neutral-950">
                  <img
                    src={lm.image || '/src/assets/images/cover_financial_liberty_1790615544438.jpg'}
                    alt={lm.title}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        isCurrentlyActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-neutral-800/80 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isCurrentlyActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
                      {isCurrentlyActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {/* Slug Pill */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-neutral-300">
                    <span className="truncate rounded bg-neutral-950/80 px-2 py-0.5 font-mono text-neutral-300 backdrop-blur-sm border border-neutral-800">
                      /lead-magnet/{lm.slug}
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 p-5">
                  <h3 className="font-display text-base font-bold text-white line-clamp-2">
                    {lm.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-neutral-400 line-clamp-3">
                    {lm.description}
                  </p>

                  {/* Benefits Preview */}
                  {benefitsList.length > 0 && (
                    <div className="mt-3.5 space-y-1 rounded-lg bg-neutral-950/70 p-2.5 text-[11px] border border-neutral-850">
                      <div className="font-semibold text-neutral-300 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span>Bénéfices annoncés ({benefitsList.length}) :</span>
                      </div>
                      <ul className="space-y-0.5 text-neutral-400">
                        {benefitsList.slice(0, 2).map((b: string, idx: number) => (
                          <li key={idx} className="truncate">
                            • {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* File Info */}
                  <div className="mt-3.5 flex items-center gap-2 text-[11px] text-neutral-400">
                    <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="font-mono text-neutral-300 truncate" title={lm.file_url}>
                      {lm.file_url || 'Fichier PDF attaché'}
                    </span>
                  </div>

                  {/* 7. LIEN DE PARTAGE UNIQUE POUR CHAQUE LEAD MAGNET */}
                  <div className="mt-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300">Lien de partage :</span>
                      <span className="font-mono text-[10px] text-neutral-400 truncate max-w-[130px]">
                        /lead-magnet/{lm.slug}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyShareLink(lm.slug)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 py-2 px-3 text-xs font-bold text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all shadow-sm"
                      title="Copier le lien de partage unique"
                    >
                      <Copy className="h-3.5 w-3.5 text-amber-400" />
                      <span>Copier le lien</span>
                    </button>
                    <p className="text-[10px] text-neutral-400 text-center leading-tight">
                      À partager directement sur WhatsApp, Facebook, Instagram, etc.
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-neutral-800 bg-neutral-950/80 p-4 rounded-b-xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-mono font-bold text-white tabular-nums">
                        {(lm.downloads_count || lm.downloadsCount || 0).toLocaleString('fr-FR')}
                      </span>
                      <span>téléchargements</span>
                    </div>

                    <button
                      onClick={() => navigateTo(`/lead-magnet/${lm.slug}`)}
                      className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors"
                      title="Tester la page de capture"
                    >
                      <span>Voir la page</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-850">
                    {/* Toggle Active */}
                    <button
                      onClick={() => toggleLeadMagnetStatus(lm.id)}
                      className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold transition-colors ${
                        isCurrentlyActive
                          ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                      title={isCurrentlyActive ? 'Désactiver' : 'Activer'}
                    >
                      <Power className="h-3 w-3" />
                      <span>{isCurrentlyActive ? 'Désactiver' : 'Activer'}</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(lm)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-neutral-800 py-1.5 text-[11px] font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Modifier</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirmId(lm.id)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
            <h3 className="font-display text-base font-bold text-white">
              Supprimer définitivement ce Lead Magnet ?
            </h3>
            <p className="mt-2 text-xs text-neutral-400">
              Cette action supprimera la ressource et son URL de capture publique. Les leads déjà enregistrés resteront conservés.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-neutral-800 px-3.5 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Gift className="h-4 w-4" />
              <span>{editingLm ? 'Modifier le Lead Magnet' : 'Nouveau Lead Magnet'}</span>
            </div>

            <h2 className="mt-2 font-display text-xl font-bold text-white">
              {editingLm ? 'Éditer les paramètres & le fichier' : 'Créer un tunnel de capture'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-medium text-neutral-300">
                  Titre du Lead Magnet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex : Guide PDF : Les 10 Principes Inviolables de l'Indépendance Financière"
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block font-medium text-neutral-300">
                  Sous-titre / Promesse secondaire (subtitle)
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Ex : Les stratégies concrètes pour générer vos premiers 1 000 € passifs par mois"
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block font-medium text-neutral-300">
                  Slug URL publique (ex: /lead-magnet/[slug]) *
                </label>
                <div className="mt-1.5 flex items-center rounded-lg border border-neutral-800 bg-neutral-900 pl-3 focus-within:border-amber-500">
                  <span className="font-mono text-neutral-500">/lead-magnet/</span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="guide-liberte-financiere"
                    className="w-full bg-transparent px-1 py-2 text-white placeholder-neutral-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Image Uploader */}
              <div>
                <ImageUploader
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  label="Image de couverture / Mockup 3D *"
                  helpText="Sélectionnez l'image (PNG, JPG, WebP) depuis votre ordinateur"
                  aspectRatio="3/4"
                />

                {/* Presets rapides de secours */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-neutral-500">Sélection rapide :</span>
                  {[
                    { label: 'Finance', path: '/src/assets/images/cover_financial_liberty_1790615544438.jpg' },
                    { label: 'Business', path: '/src/assets/images/cover_business_empire_1790615532791.jpg' },
                    { label: 'Mindset', path: '/src/assets/images/cover_mindset_power_1790615556990.jpg' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: preset.path })}
                      className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-400 hover:border-amber-500/50 hover:text-white"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Uploader (Téléversement du fichier du Lead Magnet) */}
              <div>
                <FileUploader
                  value={formData.file_url}
                  onChange={(url) => setFormData({ ...formData, file_url: url })}
                  label="Fichier du Lead Magnet (PDF, ZIP, Document) *"
                  helpText="Téléversez le fichier que le prospect recevra immédiatement après inscription"
                  accept=".pdf,.zip,.epub,.mp3,.docx"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium text-neutral-300">
                  Description détaillée du contenu *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez avec précision la promesse, le problème résolu et la transformation apportée par cette ressource..."
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Bénéfices (un par ligne) */}
              <div>
                <label className="block font-medium text-neutral-300">
                  Bénéfices majeurs mis en avant (un bénéfice par ligne)
                </label>
                <textarea
                  rows={3}
                  value={formData.benefitsText}
                  onChange={(e) => setFormData({ ...formData, benefitsText: e.target.value })}
                  placeholder="Les 3 règles d'or de l'allocation d'actifs&#10;Plan d'action concret en 90 jours&#10;Template Excel dynamique offert"
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none font-mono text-[11px]"
                />
              </div>

              {/* Marketing Content */}
              <div>
                <label className="block font-medium text-neutral-300">
                  Contenu marketing & Argumentaire de capture (marketing_content)
                </label>
                <textarea
                  rows={3}
                  value={formData.marketing_content}
                  onChange={(e) => setFormData({ ...formData, marketing_content: e.target.value })}
                  placeholder="Texte de persuasion marketing supplémentaire affiché sur la page de capture (ex : témoignages, avertissement d'urgence, bonus supplémentaire)..."
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Active Toggle (Activer/Désactiver) */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="activeLeadMagnet"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="activeLeadMagnet" className="cursor-pointer text-neutral-200">
                  Rendre ce Lead Magnet actif et accessible publiquement
                </label>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-neutral-800 px-4 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2 font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingLm ? 'Enregistrer les modifications' : 'Créer le Lead Magnet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

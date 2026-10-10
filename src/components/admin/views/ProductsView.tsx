import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  Check,
  Star,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  Link,
  Volume2,
  Gift,
  ListChecks,
  AlertTriangle,
  RotateCw,
  Wand2,
  Bot,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Copy,
  Lock,
  Headphones,
  Package,
  Flame,
  Tag,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Product, CategorySuggestion } from '../../../types';
import { api } from '../../../services/api';
import { ImageUploader } from '../ImageUploader';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    toggleProductActive,
    toggleProductBestSeller,
    deleteProduct,
    addCategory,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [bestSellerOnly, setBestSellerOnly] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form states - ALL required product fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [slug, setSlug] = useState('');
  const [cover, setCover] = useState('/src/assets/images/cover_business_empire_1790615532791.jpg');
  const [category, setCategory] = useState(categories[0]?.slug || 'business-entrepreneuriat');
  const [normalPrice, setNormalPrice] = useState('49.90');
  const [salePrice, setSalePrice] = useState('29.90');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>(['', '']);
  const [bonus, setBonus] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioDownloadUrl, setAudioDownloadUrl] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Format du contenu (Livre audio 🎧, Ebook 📚, Autre format 📦)
  const [format, setFormat] = useState<'audiobook' | 'ebook' | 'other'>('audiobook');

  // Urgence Marketing configurable
  const [urgencyActive, setUrgencyActive] = useState(false);
  const [urgencyEndDate, setUrgencyEndDate] = useState('');
  const [urgencyText, setUrgencyText] = useState('');
  const [urgencyBadge, setUrgencyBadge] = useState('Offre limitée');

  const handleCopyLink = (textToCopy: string, successMsg = 'Lien copié dans le presse-papier !') => {
    if (!textToCopy) {
      showToast('Aucun lien à copier.', 'error');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      showToast(successMsg, 'success');
    }
  };

  // AI Generator state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiAuthor, setAiAuthor] = useState('');
  const [aiCategory, setAiCategory] = useState('');
  const [aiBonus, setAiBonus] = useState('');
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState<CategorySuggestion | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<{
    full_description: string;
    key_points: string[];
    bonus_presentation: string;
    short_description: string;
    cta_text: string;
  } | null>(null);

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.is_active) ||
      (statusFilter === 'inactive' && !p.is_active);
    const matchesBS = !bestSellerOnly || p.is_best_seller;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesStatus && matchesBS && matchesSearch;
  });

  const getCategoryName = (catSlugOrId: string) => {
    const found = categories.find((c) => c.slug === catSlugOrId || c.id === catSlugOrId);
    return found ? `${found.icon} ${found.name}` : catSlugOrId;
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingProduct) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
      setProductUrl(`/produits/${generatedSlug}`);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setAuthor('');
    setSlug('');
    setCover('/src/assets/images/cover_business_empire_1790615532791.jpg');
    setCategory(categories[0]?.slug || 'business-entrepreneuriat');
    setNormalPrice('49.90');
    setSalePrice('29.90');
    setShortDescription('');
    setFullDescription('');
    setKeyPoints(['', '']);
    setBonus('');
    setCtaText('');
    setAudioUrl('');
    setAudioDownloadUrl('');
    setProductDetails('');
    setProductUrl('');
    setIsBestSeller(false);
    setIsActive(true);
    setFormat('audiobook');
    setUrgencyActive(false);
    setUrgencyEndDate('');
    setUrgencyText('');
    setUrgencyBadge('Offre limitée');
    setAiGeneratedData(null);
    setAiSuggestedCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setAuthor(p.author);
    setSlug(p.slug);
    setCover(p.cover || p.coverUrl || '');
    setCategory(p.category);
    setNormalPrice(p.normal_price.toString());
    setSalePrice(p.sale_price !== null && p.sale_price !== undefined ? p.sale_price.toString() : '');
    setShortDescription(p.short_description || p.summary || '');
    setFullDescription(p.full_description || '');
    setKeyPoints(p.key_points && p.key_points.length > 0 ? [...p.key_points] : ['', '']);
    setBonus(p.bonus || '');
    setCtaText(p.cta_text || '');
    setAudioUrl(p.audio_url || '');
    setAudioDownloadUrl(p.audio_download_url || '');
    setProductDetails(p.product_details || '');
    setProductUrl(p.product_url || '');
    setIsBestSeller(Boolean(p.is_best_seller));
    setIsActive(Boolean(p.is_active));
    setFormat((p.format as any) || (p.audio_url ? 'audiobook' : 'ebook'));
    setUrgencyActive(Boolean(p.urgency_active));
    setUrgencyEndDate(p.urgency_end_date || '');
    setUrgencyText(p.urgency_text || '');
    setUrgencyBadge(p.urgency_badge || 'Offre limitée');
    setAiGeneratedData(null);
    setAiSuggestedCategory(null);
    setIsModalOpen(true);
  };

  // Open AI Generator prefilled with current form values
  const handleOpenAiGenerator = () => {
    setAiTitle(title);
    setAiAuthor(author);
    setAiCategory(category);
    setAiBonus(bonus);
    setAiSuggestedCategory(null);
    setIsAiModalOpen(true);
  };

  // Launch AI copywriting generation with Gemini including category suggestion
  const handleGenerateAI = async () => {
    if (!aiTitle.trim()) {
      showToast('Veuillez renseigner le Titre du livre.', 'error');
      return;
    }
    if (!aiAuthor.trim()) {
      showToast('Veuillez renseigner le Nom de l\'auteur.', 'error');
      return;
    }

    setIsAiGenerating(true);
    try {
      const result = await api.generateProductAI({
        title: aiTitle.trim(),
        author: aiAuthor.trim(),
        category: aiCategory || category,
        bonus: aiBonus.trim(),
        existing_categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
      });

      setAiGeneratedData({
        full_description: result.full_description,
        key_points: result.key_points || ['', '', ''],
        bonus_presentation: result.bonus_presentation,
        short_description: result.short_description,
        cta_text: result.cta_text,
      });

      if (result.suggested_category) {
        setAiSuggestedCategory(result.suggested_category);
        // If matched existing category, pre-select it
        if (!result.suggested_category.is_new) {
          const match = categories.find(
            (c) =>
              c.slug === result.suggested_category?.slug ||
              c.name.toLowerCase() === result.suggested_category?.name.toLowerCase()
          );
          if (match) {
            setAiCategory(match.slug);
          }
        }
      }

      showToast('Contenu généré par l\'IA avec succès ! Relisez et confirmez la catégorie avant d\'appliquer.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la génération IA', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handle explicit creation of a new category proposed by AI
  const handleCreateSuggestedCategory = async () => {
    if (!aiSuggestedCategory || !aiSuggestedCategory.new_category_details) return;
    const details = aiSuggestedCategory.new_category_details;
    const catName = details.name.trim();
    if (!catName) return;

    // Duplicate check
    const existingCat = categories.find(
      (c) =>
        c.name.toLowerCase() === catName.toLowerCase() ||
        c.slug.toLowerCase() === (details.slug || '').toLowerCase()
    );
    if (existingCat) {
      setAiCategory(existingCat.slug);
      showToast(`La catégorie "${existingCat.name}" existe déjà et a été sélectionnée.`, 'info');
      return;
    }

    setIsCreatingCategory(true);
    try {
      const created = await addCategory({
        name: catName,
        slug: details.slug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: details.icon || '📁',
        description: details.description || `Catégorie dédiée : ${catName}`,
        is_active: true,
      });
      setAiCategory(created.slug);
      setCategory(created.slug);
      setAiSuggestedCategory({
        ...aiSuggestedCategory,
        is_new: false,
        name: created.name,
        slug: created.slug,
        rationale: 'Catégorie créée avec succès dans VISION BOOKS et sélectionnée.',
      });
      showToast(`Nouvelle catégorie "${created.name}" créée et enregistrée avec succès !`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la création de la catégorie', 'error');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Transfer AI content to the main form (still requires explicit admin save)
  const handleApplyAiContent = () => {
    if (!aiGeneratedData) return;
    if (aiGeneratedData.short_description) setShortDescription(aiGeneratedData.short_description);
    if (aiGeneratedData.full_description) setFullDescription(aiGeneratedData.full_description);
    if (aiGeneratedData.key_points && aiGeneratedData.key_points.length > 0) {
      setKeyPoints(aiGeneratedData.key_points);
    }
    if (aiGeneratedData.bonus_presentation) {
      setBonus(aiGeneratedData.bonus_presentation);
    }
    if (aiGeneratedData.cta_text) {
      setCtaText(aiGeneratedData.cta_text);
    }
    if (aiTitle.trim()) setTitle(aiTitle.trim());
    if (aiAuthor.trim()) setAuthor(aiAuthor.trim());
    if (aiCategory) setCategory(aiCategory);

    setIsAiModalOpen(false);
    showToast('Contenu IA appliqué au formulaire. Relisez et modifiez librement avant d\'enregistrer.', 'success');
  };

  const handleAddKeyPoint = () => {
    setKeyPoints([...keyPoints, '']);
  };

  const handleKeyPointChange = (index: number, val: string) => {
    const updated = [...keyPoints];
    updated[index] = val;
    setKeyPoints(updated);
  };

  const handleRemoveKeyPoint = (index: number) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const cleanedKeyPoints = keyPoints.filter((kp) => kp.trim().length > 0);
    const parsedNormalPrice = parseFloat(normalPrice) || 0;
    const parsedSalePrice = salePrice.trim() !== '' ? parseFloat(salePrice) : null;

    const payload: Partial<Product> = {
      title: title.trim(),
      author: author.trim(),
      slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      cover: cover.trim(),
      category: category,
      normal_price: parsedNormalPrice,
      sale_price: parsedSalePrice,
      short_description: shortDescription.trim(),
      full_description: fullDescription.trim(),
      key_points: cleanedKeyPoints,
      bonus: bonus.trim(),
      cta_text: ctaText.trim(),
      audio_url: audioUrl.trim(),
      audio_download_url: audioDownloadUrl.trim(),
      product_details: productDetails.trim(),
      product_url: productUrl.trim() || `/produits/${slug}`,
      is_best_seller: isBestSeller,
      is_active: isActive,
      format: format,
      urgency_active: urgencyActive,
      urgency_end_date: urgencyEndDate,
      urgency_text: urgencyText.trim(),
      urgency_badge: urgencyBadge.trim(),
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await addProduct(payload);
    }

    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Gestion des Produits</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Gestion complète du catalogue : prix normal, promotionnel, statuts d'activation, Best-Sellers et persistance SQLite.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Ajouter un Produit</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, auteur, slug..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs uniquement</option>
            <option value="inactive">Inactifs uniquement</option>
          </select>
        </div>

        <button
          onClick={() => setBestSellerOnly(!bestSellerOnly)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            bestSellerOnly
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${bestSellerOnly ? 'fill-amber-400' : ''}`} />
          <span>Best-Sellers ({products.filter((p) => p.is_best_seller).length})</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
              <tr>
                <th className="py-3.5 pl-6 pr-3 font-semibold">Produit</th>
                <th className="px-3 py-3.5 font-semibold text-center">Format</th>
                <th className="px-3 py-3.5 font-semibold">Catégorie</th>
                <th className="px-3 py-3.5 font-semibold">Tarification (Normal / Promo)</th>
                <th className="px-3 py-3.5 font-semibold text-center">Best-Seller</th>
                <th className="px-3 py-3.5 font-semibold text-center">Lien Privé Client</th>
                <th className="px-3 py-3.5 font-semibold text-center">Statut</th>
                <th className="py-3.5 pl-3 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const hasPromo = p.sale_price !== null && p.sale_price !== undefined && p.sale_price < p.normal_price;
                  const isUrgent = Boolean(
                    p.urgency_active &&
                    (!p.urgency_end_date || new Date(p.urgency_end_date) > new Date())
                  );
                  return (
                    <tr key={p.id} className="hover:bg-neutral-900/60 transition-colors">
                      {/* Product cover & title */}
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.cover || p.coverUrl}
                            alt={p.title}
                            className="h-14 w-10 shrink-0 rounded object-cover shadow-sm bg-neutral-950"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-white truncate max-w-xs">{p.title}</span>
                              {isUrgent && (
                                <span className="inline-flex items-center gap-1 rounded bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 text-[9px] font-bold text-red-300 shrink-0">
                                  <Flame className="h-2.5 w-2.5 text-red-400" />
                                  <span>{p.urgency_badge || 'Offre limitée'}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate">Par {p.author}</div>
                            <div className="font-mono text-[10px] text-neutral-500 truncate">/{p.slug}</div>
                          </div>
                        </div>
                      </td>

                      {/* Format Badge */}
                      <td className="px-3 py-4 text-center whitespace-nowrap">
                        {p.format === 'ebook' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                            <BookOpen className="h-3 w-3 text-blue-400" />
                            <span>Ebook 📚</span>
                          </span>
                        ) : p.format === 'other' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                            <Package className="h-3 w-3 text-purple-400" />
                            <span>Autre 📦</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            <Headphones className="h-3 w-3 text-amber-400" />
                            <span>Livre audio 🎧</span>
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-4 text-neutral-300 whitespace-nowrap">
                        <span className="rounded bg-neutral-800/80 px-2 py-1 text-[11px]">
                          {getCategoryName(p.category)}
                        </span>
                      </td>

                      {/* Pricing display with strikethrough when promo exists */}
                      <td className="px-3 py-4 whitespace-nowrap font-mono tabular-nums">
                        {hasPromo ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-amber-400">
                              {p.sale_price!.toFixed(2)} €
                            </span>
                            <span className="text-[11px] text-neutral-500 line-through">
                              {p.normal_price.toFixed(2)} €
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-white">
                            {p.normal_price.toFixed(2)} €
                          </div>
                        )}
                        <div className="text-[10px] text-neutral-500 font-sans">
                          {hasPromo ? 'Prix promotionnel actif' : 'Prix standard'}
                        </div>
                      </td>

                      {/* Best-Seller toggle */}
                      <td className="px-3 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleProductBestSeller(p.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            p.is_best_seller
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-neutral-800/70 text-neutral-400 border border-neutral-700/60 hover:text-white'
                          }`}
                          title="Cliquer pour basculer Best-Seller"
                        >
                          <Star className={`h-3 w-3 ${p.is_best_seller ? 'fill-amber-400' : ''}`} />
                          <span>{p.is_best_seller ? 'Oui' : 'Non'}</span>
                        </button>
                      </td>

                      {/* Lien Privé Audio Client (Admin copy) */}
                      <td className="px-3 py-4 text-center whitespace-nowrap">
                        {p.audio_download_url ? (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(p.audio_download_url!, `Lien audio privé de "${p.title}" copié ! Vous pouvez le transmettre au client.`)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all"
                            title="Copier le lien audio privé à transmettre au client après paiement"
                          >
                            <Copy className="h-3 w-3 text-amber-400" />
                            <span>Copier le lien</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-neutral-500 italic">Non renseigné</span>
                        )}
                      </td>

                      {/* Active / Inactive toggle */}
                      <td className="px-3 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleProductActive(p.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            p.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white'
                          }`}
                          title="Cliquer pour activer/désactiver le produit"
                        >
                          {p.is_active ? (
                            <>
                              <Eye className="h-3 w-3 text-emerald-400" />
                              <span>Actif</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 text-neutral-400" />
                              <span>Inactif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                            title="Modifier tous les champs"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="rounded p-1.5 text-neutral-400 hover:bg-red-950/40 hover:text-red-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    Aucun produit ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Full Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative my-8 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <BookOpen className="h-4 w-4" />
              <span>{editingProduct ? 'Modifier le livre audio' : 'Nouveau livre audio'}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
              <div>
                <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                  {editingProduct ? `Modifier : ${editingProduct.title}` : 'Ajouter un Livre Audio'}
                </h2>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Remplissez les informations complètes du produit pour l'enregistrer dans la base de données.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAiGenerator}
                className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent hover:bg-amber-500/30 px-4 py-2.5 text-xs font-bold text-amber-300 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                <span>Générer avec IA</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-xs">
              {/* Section 1: Identification */}
              <div className="space-y-4 rounded-xl border border-neutral-850 bg-neutral-900/30 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  1. Identification du Livre
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-medium text-neutral-300">Titre du Livre *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Ex : L'Empire du Business Moderne"
                      className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-300">Auteur *</label>
                    <input
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Ex : Marc de Saint-Clair"
                      className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-medium text-neutral-300">Slug URL *</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="l-empire-du-business-moderne"
                      className="mt-1.5 w-full font-mono rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-300">Catégorie *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Format du Contenu (Obligatoire / Sélectionnable) */}
                <div className="pt-2 border-t border-neutral-800/80">
                  <label className="block font-medium text-neutral-300 mb-2">
                    Format du contenu *
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'audiobook', label: 'Livre audio 🎧', icon: Headphones, desc: 'Fichier audio & écoute' },
                      { id: 'ebook', label: 'Ebook 📚', icon: BookOpen, desc: 'Livre numérique PDF / ePub' },
                      { id: 'other', label: 'Autre format 📦', icon: Package, desc: 'Bundle ou masterclass' },
                    ].map((fmt) => {
                      const Icon = fmt.icon;
                      const isSelected = format === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setFormat(fmt.id as any)}
                          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm ring-1 ring-amber-500/50'
                              : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                          <span className="font-semibold text-xs">{fmt.label}</span>
                          <span className="text-[10px] text-neutral-500">{fmt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 2: Tarification */}
              <div className="space-y-4 rounded-xl border border-neutral-850 bg-neutral-900/30 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  2. Tarification (Prix Normal & Promotionnel)
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-medium text-neutral-300">
                      Prix Normal (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={normalPrice}
                      onChange={(e) => setNormalPrice(e.target.value)}
                      placeholder="49.90"
                      className="mt-1.5 w-full font-mono rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-neutral-500">
                      Affiché barré si un prix promotionnel inférieur est renseigné.
                    </span>
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-300">
                      Prix Promotionnel (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="29.90 (laisser vide si pas de promo)"
                      className="mt-1.5 w-full font-mono rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-neutral-500">
                      Prix facturé aux clients.
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2b: Urgence Commerciale & Marketing Configurable */}
              <div className="space-y-4 rounded-xl border border-neutral-850 bg-neutral-900/30 p-4">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className={`h-4 w-4 ${urgencyActive ? 'text-red-400' : 'text-neutral-500'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Urgence Marketing (Optionnel)
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={urgencyActive}
                      onChange={(e) => setUrgencyActive(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-neutral-200">
                      {urgencyActive ? 'Urgence active' : 'Désactivée'}
                    </span>
                  </label>
                </div>

                {urgencyActive && (
                  <div className="space-y-3.5 pt-1">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block font-medium text-neutral-300">
                          Badge Promotionnel
                        </label>
                        <input
                          type="text"
                          value={urgencyBadge}
                          onChange={(e) => setUrgencyBadge(e.target.value)}
                          placeholder="Ex : Offre de lancement • Vente Flash"
                          className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-neutral-300">
                          Date et Heure de Fin (Expiration)
                        </label>
                        <input
                          type="datetime-local"
                          value={urgencyEndDate}
                          onChange={(e) => setUrgencyEndDate(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-neutral-300">
                        Texte d'Urgence Commerciale
                      </label>
                      <input
                        type="text"
                        value={urgencyText}
                        onChange={(e) => setUrgencyText(e.target.value)}
                        placeholder="Ex : Tarif préférentiel garanti jusqu'à expiration de l'offre"
                        className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <p className="text-[11px] leading-relaxed text-neutral-400 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-850">
                      ℹ️ <strong>Règle éthique :</strong> Le badge et le message d'urgence ne s'affichent que si l'offre est active et que la date limite n'est pas dépassée. À expiration, ils sont automatiquement masqués du site sans fausse rareté ni manipulation de prix.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 3: Visuel & Médias */}
              <div className="space-y-4 rounded-xl border border-neutral-850 bg-neutral-900/30 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  3. Couverture & Médias Audio
                </div>

                {/* Téléversement d'image depuis l'ordinateur avec prévisualisation et remplacement */}
                <div>
                  <ImageUploader
                    value={cover}
                    onChange={setCover}
                    label="Image de Couverture du Livre Audio *"
                    helpText="Téléversez la couverture (PNG, JPG, WebP) depuis votre ordinateur"
                    aspectRatio="3/4"
                  />

                  {/* Presets rapides de secours */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-neutral-500">Préréglages rapides :</span>
                    {[
                      {
                        label: 'Business',
                        url: '/src/assets/images/cover_business_empire_1790615532791.jpg',
                      },
                      {
                        label: 'Finance',
                        url: '/src/assets/images/cover_financial_liberty_1790615544438.jpg',
                      },
                      {
                        label: 'Mindset',
                        url: '/src/assets/images/cover_mindset_power_1790615556990.jpg',
                      },
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset.url}
                        onClick={() => setCover(preset.url)}
                        className={`rounded border px-2 py-0.5 text-[10px] transition-all ${
                          cover === preset.url
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-semibold'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lien privé de téléchargement du livre audio (Strictement confidentiel - visible uniquement en admin) */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Lien privé de téléchargement du livre audio (Confidentiel)</span>
                    </label>
                    {audioDownloadUrl && (
                      <button
                        type="button"
                        onClick={() => handleCopyLink(audioDownloadUrl, 'Lien audio privé copié avec succès !')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copier le lien</span>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={audioDownloadUrl}
                      onChange={(e) => setAudioDownloadUrl(e.target.value)}
                      placeholder="Ex: https://drive.google.com/file/d/... ou lien privé Dropbox / Cloud"
                      className="flex-1 font-mono text-[11px] rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                    {audioDownloadUrl && (
                      <button
                        type="button"
                        onClick={() => handleCopyLink(audioDownloadUrl, 'Lien audio privé copié !')}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all shrink-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copier</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-300/80">
                    🔒 <strong>Important :</strong> Ce lien NE DOIT JAMAIS ÊTRE AFFICHÉ PUBLIQUEMENT. Il est visible uniquement dans l’administration. Après paiement, l’administrateur pourra copier manuellement ce lien et le transmettre au client.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-1.5 font-medium text-neutral-300">
                      <Volume2 className="h-3.5 w-3.5 text-amber-500" />
                      <span>URL Audio d'Extrait Public (audio_url)</span>
                    </label>
                    <input
                      type="text"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="https://.../extrait.mp3 (échantillon de 2 min)"
                      className="mt-1.5 w-full font-mono text-[11px] rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 font-medium text-neutral-300">
                      <Link className="h-3.5 w-3.5 text-amber-500" />
                      <span>URL Produit / Slug (product_url)</span>
                    </label>
                    <input
                      type="text"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="/produits/mon-livre"
                      className="mt-1.5 w-full font-mono text-[11px] rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Descriptions & Contenu */}
              <div className="space-y-4 rounded-xl border border-neutral-850 bg-neutral-900/30 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      4. Contenu Éditorial & Bonus
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Textes commerciaux, 3 bénéfices auditeurs, valorisation du bonus et CTA.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAiGenerator}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-neutral-950 fill-neutral-950/20" />
                    <span>Générer avec IA</span>
                  </button>
                </div>

                <div>
                  <label className="block font-medium text-neutral-300">
                    Description Courte (short_description) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Accroche en 1 à 2 phrases pour les cartes de la bibliothèque..."
                    className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-300">
                    Description Complète (full_description)
                  </label>
                  <textarea
                    rows={4}
                    value={fullDescription}
                    onChange={(e) => setFullDescription(e.target.value)}
                    placeholder="Présentation détaillée des concepts, méthode et chapitres..."
                    className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Key Points */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 font-medium text-neutral-300">
                      <ListChecks className="h-3.5 w-3.5 text-amber-500" />
                      <span>Points Clés Appris (key_points)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddKeyPoint}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                    >
                      + Ajouter un point clé
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {keyPoints.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-neutral-500">{idx + 1}.</span>
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => handleKeyPointChange(idx, e.target.value)}
                          placeholder={`Point clé n°${idx + 1}`}
                          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                        />
                        {keyPoints.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyPoint(idx)}
                            className="p-1.5 text-neutral-500 hover:text-red-400"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bonus */}
                <div>
                  <label className="flex items-center gap-1.5 font-medium text-neutral-300">
                    <Gift className="h-3.5 w-3.5 text-amber-500" />
                    <span>Bonus Inclus (bonus)</span>
                  </label>
                  <input
                    type="text"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    placeholder="Ex : Guide PDF de 24 pages + Fiche de synthèse imprimable"
                    className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* CTA de Conversion */}
                <div>
                  <label className="flex items-center gap-1.5 font-medium text-neutral-300">
                    <ArrowRight className="h-3.5 w-3.5 text-amber-500" />
                    <span>CTA de Conversion Personnalisé (cta_text)</span>
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Ex : Commander le livre audio sur WhatsApp & débloquer le bonus exclusif"
                    className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-500">
                    Appel à l'action vendeur généré par l'IA ou personnalisé pour maximiser les conversions.
                  </span>
                </div>

                {/* Contenu / Détails du produit */}
                <div>
                  <label className="flex items-center gap-1.5 font-medium text-neutral-300">
                    <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                    <span>Contenu & Détails du Produit (product_details)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={productDetails}
                    onChange={(e) => setProductDetails(e.target.value)}
                    placeholder="Ex : 4h30 d'écoute studio HD (320 kbps) • 12 chapitres progressifs • Fiche récapitulative PDF de 18 pages incluse • Accès à vie sur smartphone et ordinateur"
                    className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-500">
                    Détails techniques, livrables concrets et spécifications du contenu audio.
                  </span>
                </div>
              </div>

              {/* Section 5: Statuts & Visibilité */}
              <div className="space-y-3 rounded-xl border border-neutral-850 bg-neutral-900/30 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  5. Statuts & Visibilité
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-neutral-800 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-white">Produit Actif (is_active)</span>
                      <p className="text-[11px] text-neutral-400">
                        Visible dans la boutique publique de VISION BOOKS.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="rounded border-neutral-800 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-amber-400">Marquer comme Best-Seller (is_best_seller)</span>
                      <p className="text-[11px] text-neutral-400">
                        Mise en avant prioritaire dans la section Best-Sellers de l'accueil.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="mt-8 flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-neutral-800 px-4 py-2.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-sm active:scale-95"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>{editingProduct ? 'Mettre à jour le produit' : 'Créer et Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Avoids window.confirm) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-950/80 text-red-400 border border-red-800/60 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="font-display text-lg font-bold text-white">
              Supprimer définitivement ce produit ?
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              Êtes-vous sûr de vouloir supprimer le livre audio{' '}
              <strong className="text-white">"{productToDelete.title}"</strong> ? Cette action est irréversible et supprimera le livre de la base de données.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="rounded-lg border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DU GÉNÉRATEUR IA DE PRODUIT                        */}
      {/* ======================================================== */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative my-8 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-2 border-amber-500/40 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsAiModalOpen(false)}
              className="absolute right-5 top-5 rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-4 w-4 fill-amber-400/20" />
              <span>Assistant Rédaction IA • VISION BOOKS</span>
            </div>

            <h3 className="mt-1.5 font-display text-xl sm:text-2xl font-extrabold text-white">
              Générateur IA de Fiche Produit
            </h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              Renseignez les 4 paramètres pour générer une description captivante, 3 bénéfices auditeurs, la valorisation du bonus, un texte marketing court et un CTA de conversion.
            </p>

            {/* PARAMÈTRES FOURNIS PAR L'ADMINISTRATEUR */}
            <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-amber-400 text-[11px]">
                  Paramètres de génération (fournis par l'administrateur)
                </span>
                <span className="text-[10px] text-neutral-500">Obligatoire : Titre & Auteur</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-neutral-300">
                    Titre du livre *
                  </label>
                  <input
                    type="text"
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    placeholder="Ex : L'Art de la Négociation Stratégique"
                    className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-300">
                    Nom de l'auteur *
                  </label>
                  <input
                    type="text"
                    value={aiAuthor}
                    onChange={(e) => setAiAuthor(e.target.value)}
                    placeholder="Ex : Alexandre Morel"
                    className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-neutral-300">
                    Catégorie *
                  </label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-300">
                    Bonus disponible (optionnel)
                  </label>
                  <input
                    type="text"
                    value={aiBonus}
                    onChange={(e) => setAiBonus(e.target.value)}
                    placeholder="Ex : Fiche récapitulative des 10 leviers"
                    className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Button: Générer / Régénérer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-neutral-400">
                  {aiGeneratedData ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Contenu prêt • Modifiable ci-dessous ou régénérable
                    </span>
                  ) : (
                    <span>L'IA utilise Gemini pour générer des textes commerciaux personnalisés</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isAiGenerating}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isAiGenerating ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      <span>Génération en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 fill-neutral-950/20" />
                      <span>{aiGeneratedData ? 'Régénérer avec IA' : 'Générer avec IA'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CONTENUS GÉNÉRÉS PAR L'IA (100% MODIFIABLES AVANT PUBLICATION) */}
            {aiGeneratedData && (
              <div className="mt-6 space-y-5 rounded-2xl border border-amber-500/30 bg-neutral-900/40 p-4 sm:p-6 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Contenus Générés • Modifiables avant application</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Contenu & Catégorie</span>
                </div>

                {/* PROPOSITION DE CATÉGORIE PAR L'IA */}
                {aiSuggestedCategory && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-amber-400" />
                        <span className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                          Recommandation de Catégorie par l'IA
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        aiSuggestedCategory.is_new
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {aiSuggestedCategory.is_new ? 'Nouvelle Catégorie Proposée' : 'Catégorie Existante Recommandée'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/70 p-3 rounded-lg border border-neutral-800">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{aiSuggestedCategory.name}</span>
                          {aiSuggestedCategory.new_category_details?.icon && (
                            <span>{aiSuggestedCategory.new_category_details.icon}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {aiSuggestedCategory.rationale}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {aiSuggestedCategory.is_new ? (
                          <button
                            type="button"
                            onClick={handleCreateSuggestedCategory}
                            disabled={isCreatingCategory}
                            className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{isCreatingCategory ? 'Création...' : 'Créer et associer'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const match = categories.find(
                                (c) =>
                                  c.slug === aiSuggestedCategory.slug ||
                                  c.name.toLowerCase() === aiSuggestedCategory.name.toLowerCase()
                              );
                              if (match) {
                                setAiCategory(match.slug);
                                setCategory(match.slug);
                                showToast(`Catégorie "${match.name}" confirmée et sélectionnée !`, 'success');
                              }
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Confirmer la catégorie</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400">
                      <span className="font-medium text-neutral-300">Catégorie finale choisie :</span>
                      <select
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value)}
                        className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs text-white focus:border-amber-500 focus:outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 1. Description commerciale captivante */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white text-xs">
                      1. Description commerciale captivante
                    </label>
                    <span className="text-[10px] text-neutral-400">Présentation valorisante du livre</span>
                  </div>
                  <textarea
                    rows={4}
                    value={aiGeneratedData.full_description}
                    onChange={(e) =>
                      setAiGeneratedData({
                        ...aiGeneratedData,
                        full_description: e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* 2. 3 Key Points / bénéfices principaux */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white text-xs">
                      2. 3 Key Points / Bénéfices principaux
                    </label>
                    <span className="text-[10px] text-neutral-400">3 points clés auditeur</span>
                  </div>
                  <div className="mt-1.5 space-y-2">
                    {aiGeneratedData.key_points.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold w-4 text-center">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => {
                            const updated = [...aiGeneratedData.key_points];
                            updated[idx] = e.target.value;
                            setAiGeneratedData({ ...aiGeneratedData, key_points: updated });
                          }}
                          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Présentation du bonus */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white text-xs">
                      3. Présentation du bonus
                    </label>
                    <span className="text-[10px] text-neutral-400">Argument d'accélération</span>
                  </div>
                  <textarea
                    rows={2}
                    value={aiGeneratedData.bonus_presentation}
                    onChange={(e) =>
                      setAiGeneratedData({
                        ...aiGeneratedData,
                        bonus_presentation: e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* 4. Texte marketing court */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white text-xs">
                      4. Texte marketing court (Accroche catalogue)
                    </label>
                    <span className="text-[10px] text-neutral-400">1 à 2 phrases percutantes</span>
                  </div>
                  <textarea
                    rows={2}
                    value={aiGeneratedData.short_description}
                    onChange={(e) =>
                      setAiGeneratedData({
                        ...aiGeneratedData,
                        short_description: e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* 5. CTA de conversion */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white text-xs">
                      5. CTA de conversion
                    </label>
                    <span className="text-[10px] text-neutral-400">Appel à la commande WhatsApp</span>
                  </div>
                  <input
                    type="text"
                    value={aiGeneratedData.cta_text}
                    onChange={(e) =>
                      setAiGeneratedData({
                        ...aiGeneratedData,
                        cta_text: e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Action Buttons: Régénérer & Valider/Appliquer */}
                <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isAiGenerating}
                    className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-300 hover:border-amber-500/50 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`h-3.5 w-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                    <span>Régénérer avec IA</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(false)}
                      className="rounded-lg border border-neutral-800 px-3.5 py-2 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyAiContent}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Valider et appliquer au produit</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

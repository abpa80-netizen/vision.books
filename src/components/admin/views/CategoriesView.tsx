import React, { useState } from 'react';
import { Layers, Plus, Trash2, Edit3, X, Check, BookOpen, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Category } from '../../../types';

export const CategoriesView: React.FC = () => {
  const { categories, addCategory, updateCategory, toggleCategoryStatus, deleteCategory, products } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('📚');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const openAddModal = () => {
    setName('');
    setSlug('');
    setIcon('📚');
    setDescription('');
    setIsActive(true);
    setEditingCategory(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon);
    setDescription(cat.description);
    setIsActive(Boolean(cat.is_active));
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Partial<Category> = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: icon.trim() || '📚',
      description: description.trim(),
      is_active: isActive,
    };

    if (editingCategory) {
      await updateCategory(editingCategory.id, payload);
    } else {
      await addCategory(payload);
    }

    setIsAddModalOpen(false);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  const getProductCount = (categorySlug: string, categoryId: string) => {
    return products.filter((p) => p.category === categorySlug || p.category === categoryId || (p as any).categoryId === categoryId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Gestion des Catégories</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Structurez les thématiques de VISION BOOKS. Les catégories sont persistées en base de données et peuvent être activées ou désactivées en un clic.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-neutral-950 transition-colors hover:bg-amber-400 shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Nouvelle Catégorie</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
              <tr>
                <th className="py-3.5 pl-6 pr-3 font-semibold">Icône</th>
                <th className="px-3 py-3.5 font-semibold">Nom de la Catégorie</th>
                <th className="px-3 py-3.5 font-semibold">Description</th>
                <th className="px-3 py-3.5 font-semibold text-center">Livres Associés</th>
                <th className="px-3 py-3.5 font-semibold text-center">Statut</th>
                <th className="py-3.5 pl-3 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {categories.map((cat) => {
                const count = getProductCount(cat.slug, cat.id);
                return (
                  <tr key={cat.id} className="hover:bg-neutral-900/60 transition-colors">
                    <td className="py-4 pl-6 pr-3 text-2xl">
                      <span>{cat.icon}</span>
                    </td>
                    <td className="px-3 py-4 font-semibold text-white whitespace-nowrap">
                      <div>{cat.name}</div>
                      <div className="font-mono text-[10px] text-neutral-500">/{cat.slug}</div>
                    </td>
                    <td className="max-w-xs px-3 py-4 text-neutral-400 truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="px-3 py-4 text-center font-mono tabular-nums text-white whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded bg-neutral-800/80 px-2 py-0.5 text-[11px]">
                        <BookOpen className="h-3 w-3 text-amber-500" />
                        {count}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleCategoryStatus(cat.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          cat.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white'
                        }`}
                        title="Cliquer pour activer/désactiver"
                      >
                        {cat.is_active ? (
                          <>
                            <Eye className="h-3 w-3 text-emerald-400" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 text-neutral-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                          title="Modifier"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(cat)}
                          className="rounded p-1.5 text-neutral-400 hover:bg-red-950/40 hover:text-red-400 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-7 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Layers className="h-4 w-4" />
              <span>{editingCategory ? 'Modifier la catégorie' : 'Créer une catégorie'}</span>
            </div>

            <h2 className="mt-2 font-display text-xl font-bold text-white">
              {editingCategory ? editingCategory.name : 'Nouvelle Catégorie'}
            </h2>

            <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex : Immobilier & Patrimoine"
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300">
                  Slug URL *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="immobilier-patrimoine"
                  className="mt-1.5 w-full font-mono rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300">
                  Emoji ou Symbole *
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="text"
                    required
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-16 text-center rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-lg text-white focus:border-amber-500 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 text-base">
                    {['📈', '💰', '📊', '💻', '🧠', '🕊️', '❤️', '⚡', '✨', '🏢', '🚀', '🎯', '💎', '🔑'].map(
                      (emoji) => (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => setIcon(emoji)}
                          className="rounded border border-neutral-800 p-1 hover:bg-neutral-800 transition-colors"
                        >
                          {emoji}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300">
                  Description courte
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objectif d'apprentissage de cette thématique..."
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCat"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-neutral-800 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isActiveCat" className="text-neutral-300 cursor-pointer font-medium">
                  Catégorie active (visible dans la boutique)
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-neutral-800 px-4 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2 font-semibold text-neutral-950 hover:bg-amber-400 transition-colors active:scale-95"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>{editingCategory ? 'Mettre à jour' : 'Créer la catégorie'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-950/80 text-red-400 border border-red-800/60 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="font-display text-lg font-bold text-white">
              Supprimer cette catégorie ?
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              Êtes-vous sûr de vouloir supprimer la catégorie{' '}
              <strong className="text-white">"{categoryToDelete.icon} {categoryToDelete.name}"</strong> ? Les livres audio associés ne seront pas supprimés mais devront être réassignés.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
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
    </div>
  );
};

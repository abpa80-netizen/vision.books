import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Check, Shield, MessageCircle, HelpCircle, Phone } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, showToast } = useApp();

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [platformName, setPlatformName] = useState('VISION BOOKS');
  const [tagline, setTagline] = useState('Bibliothèque professionnelle de livres audio');
  const [supportEmail, setSupportEmail] = useState('contact@visionbooks.audio');
  const [currency, setCurrency] = useState('EUR');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Sync local form state when settings load or change from server
  useEffect(() => {
    if (settings) {
      if (settings.whatsapp_number !== undefined) setWhatsappNumber(settings.whatsapp_number);
      if (settings.platform_name) setPlatformName(settings.platform_name);
      if (settings.tagline) setTagline(settings.tagline);
      if (settings.support_email) setSupportEmail(settings.support_email);
      if (settings.currency) setCurrency(settings.currency);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        whatsapp_number: whatsappNumber.trim(),
        platform_name: platformName.trim(),
        tagline: tagline.trim(),
        support_email: supportEmail.trim(),
        currency: currency.trim(),
      });
      setSavedSuccess(true);
      showToast('Paramètres enregistrés avec succès dans la base de données.', 'success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la sauvegarde des paramètres', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const executeResetData = () => {
    localStorage.removeItem('vision_books_categories');
    localStorage.removeItem('vision_books_products');
    localStorage.removeItem('vision_books_testimonials');
    localStorage.removeItem('vision_books_blog');
    localStorage.removeItem('vision_books_leads');
    localStorage.removeItem('vision_books_lead_magnets');
    showToast('Données réinitialisées.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const cleanPhonePreview = whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Paramètres Généraux</h1>
        <p className="mt-1 text-xs text-neutral-400">
          Configuration générale de la plateforme VISION BOOKS et canal WhatsApp de commande.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* WHATSAPP ORDER SETTINGS BLOCK */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <label htmlFor="whatsapp-number-input" className="block text-sm font-bold text-white">
                    Numéro WhatsApp de commande
                  </label>
                  <span className="text-[11px] text-emerald-400/90">
                    Paramètre officiel de réception des commandes clients
                  </span>
                </div>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-neutral-300">
                L'administrateur peut modifier ce numéro. Il est automatiquement utilisé par tous les boutons « Commander sur WhatsApp » des fiches produits avec message pré-rempli.
              </p>

              <div className="mt-3.5">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                    <Phone className="h-4 w-4 text-emerald-400" />
                  </div>
                  <input
                    id="whatsapp-number-input"
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+33 6 12 34 56 78 ou +225 07 12 34 56 78"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-3.5 py-2.5 text-sm font-mono text-white placeholder-neutral-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Format international recommandé (ex : +33 6 12 34 56 78 ou +225 07 ...)</span>
                  </div>
                  {cleanPhonePreview && (
                    <span className="font-mono text-[10px] text-emerald-400">
                      Lien direct généré : wa.me/{cleanPhonePreview}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* General Settings */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block font-medium text-neutral-300">
                  Nom de la Plateforme
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300">
                  Slogan / Promesse de Marque
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-neutral-300">
                    Email du Support Client
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-300">
                    Devise d'Affichage
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar US ($)</option>
                    <option value="XOF">Franc CFA (FCFA)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              {savedSuccess ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Check className="h-4 w-4" />
                  <span>Modifications enregistrées avec succès</span>
                </div>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Side Info & Data Reset */}
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Shield className="h-4 w-4" />
              <span>Commande WhatsApp Intégrée</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-300">
              Le numéro WhatsApp configuré ici est immédiatement synchronisé dans la base de données.
            </p>
            <div className="mt-4 rounded-lg bg-neutral-950 p-3 text-[11px] text-neutral-400 border border-neutral-800 space-y-1.5">
              <div className="text-neutral-200 font-semibold">Garanties du système :</div>
              <div>• Numéro stocké en base de données, jamais hardcodé dans le code.</div>
              <div>• Message pré-rempli avec titre, prix et URL de la fiche.</div>
              <div>• Compatible smartphone, tablette et WhatsApp Web.</div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
            <h3 className="font-display text-sm font-semibold text-white">Maintenance des Données</h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              Réinitialiser les listes de catégories et livres audio aux valeurs initiales par défaut.
            </p>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-medium text-neutral-400 hover:border-red-900 hover:text-red-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Réinitialiser les données de démo</span>
              </button>
            ) : (
              <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 p-3 space-y-2">
                <p className="text-[11px] text-red-300">
                  Confirmer la réinitialisation de toutes les données de démo ?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={executeResetData}
                    className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500 cursor-pointer"
                  >
                    Oui, réinitialiser
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700 cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


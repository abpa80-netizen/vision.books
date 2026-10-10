import React, { useState, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Gift,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Plus,
  X,
  MessageCircle,
  Flame,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ImageUploader } from '../ImageUploader';

export const VipPackView: React.FC = () => {
  const { vipPack, updateVipPack, toggleVipPackActive, deleteVipPack, showToast, settings } = useApp();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState('');
  const [normalPrice, setNormalPrice] = useState('149.00');
  const [salePrice, setSalePrice] = useState('79.00');
  const [description, setDescription] = useState('');
  const [contentLines, setContentLines] = useState<string[]>([]);
  const [ctaText, setCtaText] = useState('Commander le Pack VIP sur WhatsApp');
  const [showOnHome, setShowOnHome] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Urgence Marketing configurable
  const [urgencyActive, setUrgencyActive] = useState(false);
  const [urgencyEndDate, setUrgencyEndDate] = useState('');
  const [urgencyText, setUrgencyText] = useState('');
  const [urgencyBadge, setUrgencyBadge] = useState('Offre Privilège VIP');

  // Sync state from context when vipPack loads or changes
  useEffect(() => {
    if (vipPack) {
      setTitle(vipPack.title || '');
      setSubtitle(vipPack.subtitle || '');
      setImage(vipPack.image || '/src/assets/images/cover_business_empire_1790615532791.jpg');
      setNormalPrice(vipPack.normal_price ? vipPack.normal_price.toString() : '149.00');
      setSalePrice(vipPack.sale_price !== null && vipPack.sale_price !== undefined ? vipPack.sale_price.toString() : '');
      setDescription(vipPack.description || '');
      setCtaText(vipPack.cta_text || 'Commander le Pack VIP sur WhatsApp');
      setShowOnHome(vipPack.show_on_home !== false);
      setIsActive(vipPack.is_active !== false);
      setUrgencyActive(Boolean(vipPack.urgency_active));
      setUrgencyEndDate(vipPack.urgency_end_date || '');
      setUrgencyText(vipPack.urgency_text || '');
      setUrgencyBadge(vipPack.urgency_badge || 'Offre Privilège VIP');

      let lines: string[] = [];
      try {
        lines = typeof vipPack.content === 'string' && vipPack.content.startsWith('[')
          ? JSON.parse(vipPack.content)
          : (vipPack.content ? vipPack.content.split('\n').filter(Boolean) : []);
      } catch {
        lines = vipPack.content ? vipPack.content.split('\n').filter(Boolean) : [];
      }
      setContentLines(lines.length > 0 ? lines : [
        "Les 6 Livres Audio Intégraux en Haute Définition Studio (320 kbps)",
        "Fiches Mémos & Plans d'Action Exécutifs condensés en format PDF",
        "Scripts confidentiels de vente et modèles de négociation à haute valeur",
        "Mises à jour gratuites et accès prioritaire aux futures parutions",
        "Assistance et conciergerie privée sur WhatsApp"
      ]);
    } else {
      // Default template
      setTitle('Pack VIP — La Bibliothèque Privée des Dirigeants');
      setSubtitle('Accès immédiat et illimité à l\'intégralité de nos masterclasses audio et fiches d\'action exclusives');
      setImage('/src/assets/images/cover_business_empire_1790615532791.jpg');
      setNormalPrice('149.00');
      setSalePrice('79.00');
      setDescription('Un investissement unique pour acquérir les modèles mentaux des plus grands stratèges et investisseurs mondiaux. Sans abonnement, écoute à vie.');
      setContentLines([
        "Les 6 Livres Audio Intégraux en Haute Définition Studio (320 kbps)",
        "Fiches Mémos & Plans d'Action Exécutifs condensés en format PDF",
        "Scripts confidentiels de vente et modèles de négociation à haute valeur",
        "Mises à jour gratuites et accès prioritaire aux futures parutions",
        "Assistance et conciergerie privée sur WhatsApp"
      ]);
      setCtaText('Commander le Pack VIP sur WhatsApp');
      setShowOnHome(true);
      setIsActive(true);
    }
  }, [vipPack]);

  const handleAddContentLine = () => {
    setContentLines([...contentLines, '']);
  };

  const handleRemoveContentLine = (index: number) => {
    setContentLines(contentLines.filter((_, i) => i !== index));
  };

  const handleContentLineChange = (index: number, val: string) => {
    const updated = [...contentLines];
    updated[index] = val;
    setContentLines(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Veuillez renseigner le titre du Pack VIP.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const parsedNormal = parseFloat(normalPrice) || 0;
      const parsedSale = salePrice.trim() !== '' ? parseFloat(salePrice) : null;
      const cleanedContent = contentLines.filter((c) => c.trim().length > 0);

      await updateVipPack({
        title: title.trim(),
        subtitle: subtitle.trim(),
        image: image.trim(),
        normal_price: parsedNormal,
        sale_price: parsedSale,
        description: description.trim(),
        content: JSON.stringify(cleanedContent),
        cta_text: ctaText.trim() || 'Commander le Pack VIP sur WhatsApp',
        show_on_home: showOnHome,
        is_active: isActive,
        urgency_active: urgencyActive,
        urgency_end_date: urgencyEndDate,
        urgency_text: urgencyText.trim(),
        urgency_badge: urgencyBadge.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteVipPack();
    setConfirmDelete(false);
  };

  const numNormal = parseFloat(normalPrice) || 0;
  const numSale = salePrice.trim() !== '' ? parseFloat(salePrice) : null;
  const hasPromo = numSale !== null && numSale < numNormal;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Crown className="h-4 w-4 stroke-[2.4]" />
            </span>
            <h1 className="font-display text-2xl font-bold text-white">Gestion du Pack VIP</h1>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Configurez l'offre groupée premium tout-en-un. Le Pack VIP s'affiche sur la page d'accueil uniquement lorsqu'il est activé.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleVipPackActive}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
              isActive
                ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {isActive ? <Eye className="h-4 w-4 text-emerald-400" /> : <EyeOff className="h-4 w-4" />}
            <span>{isActive ? 'Pack VIP Activé' : 'Pack VIP Désactivé'}</span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Col: Edit Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-7 backdrop-blur-sm">
            {/* Actif & Affichage sur l'accueil */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Pack VIP Actif</div>
                  <div className="text-[10px] text-neutral-400">Rendre l'offre opérationnelle</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnHome}
                  onChange={(e) => setShowOnHome(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Afficher sur l'accueil</div>
                  <div className="text-[10px] text-neutral-400">Visible dans la section dédiée</div>
                </div>
              </label>
            </div>

            {/* Titre & Sous-titre */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300">
                  Titre du Pack VIP <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pack VIP — La Bibliothèque Privée des Dirigeants"
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">Sous-titre / Accroche</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: Accès immédiat et illimité à l'intégralité de nos masterclasses audio"
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Image avec téléversement */}
            <ImageUploader
              value={image}
              onChange={setImage}
              label="Image de couverture du Pack VIP"
              helpText="Sélectionnez une illustration ou couverture pour le pack (PNG, JPG, WebP)"
              aspectRatio="16/9"
            />

            {/* Tarifs : Prix normal barré & Prix promotionnel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300">
                  Prix normal / Prix barré (€) <span className="text-amber-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={normalPrice}
                  onChange={(e) => setNormalPrice(e.target.value)}
                  placeholder="149.00"
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">
                  Prix promotionnel (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="79.00"
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-neutral-300">Description marketing du Pack</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explication claire de la valeur de l'offre groupée..."
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Urgence Commerciale & Marketing Configurable pour le Pack VIP */}
            <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className={`h-4 w-4 ${urgencyActive ? 'text-red-400' : 'text-neutral-500'}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                    Urgence Marketing du Pack VIP
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={urgencyActive}
                    onChange={(e) => setUrgencyActive(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-neutral-300">
                    {urgencyActive ? 'Urgence active' : 'Désactivée'}
                  </span>
                </label>
              </div>

              {urgencyActive && (
                <div className="space-y-3.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-neutral-300">
                        Badge promotionnel d'urgence
                      </label>
                      <input
                        type="text"
                        value={urgencyBadge}
                        onChange={(e) => setUrgencyBadge(e.target.value)}
                        placeholder="Ex : Offre de lancement • Vente Flash VIP"
                        className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-300">
                        Date et Heure d'expiration (fin de l'offre)
                      </label>
                      <input
                        type="datetime-local"
                        value={urgencyEndDate}
                        onChange={(e) => setUrgencyEndDate(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-300">
                      Message d'urgence affiché sur le site
                    </label>
                    <input
                      type="text"
                      value={urgencyText}
                      onChange={(e) => setUrgencyText(e.target.value)}
                      placeholder="Ex : Offre limitée aux prochains membres • Tarif garanti jusqu'à expiration"
                      className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <p className="text-[11px] leading-relaxed text-neutral-400 bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-850">
                    ℹ️ <strong>Règle éthique :</strong> Le badge et le message d'urgence ne s'affichent sur la page d'accueil que si l'urgence est active et que la date de fin n'est pas expirée. Dès l'expiration, ils disparaissent automatiquement sans modifier le tarif configuré.
                  </p>
                </div>
              )}
            </div>

            {/* Contenu du Pack VIP (Liste des éléments inclus) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300">
                  Contenu du Pack VIP (Éléments inclus)
                </label>
                <button
                  type="button"
                  onClick={handleAddContentLine}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ajouter un élément</span>
                </button>
              </div>

              <div className="space-y-2">
                {contentLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-neutral-500 w-5 text-right">{idx + 1}.</span>
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => handleContentLineChange(idx, e.target.value)}
                      placeholder="Ex: Les 6 Livres Audio Intégraux en Haute Définition Studio"
                      className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveContentLine(idx)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                      title="Supprimer la ligne"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Texte du bouton CTA */}
            <div>
              <label className="text-xs font-semibold text-neutral-300">Texte du bouton CTA</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Ex: Commander le Pack VIP sur WhatsApp"
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800/80 pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-xs font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Enregistrement...' : 'Enregistrer le Pack VIP'}</span>
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">Confirmer la réinitialisation ?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500"
                  >
                    Oui, réinitialiser
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Col: Live Preview on Homepage */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Aperçu en direct (Rendu Accueil)</span>
            </h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              isActive && showOnHome
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-neutral-800 text-neutral-400'
            }`}>
              {isActive && showOnHome ? 'Visible sur l\'accueil' : 'Masqué sur l\'accueil'}
            </span>
          </div>

          {/* Live Preview Card */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/20 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                <Crown className="h-3 w-3 fill-amber-400" />
                <span>Offre Privilège VIP</span>
              </span>

              {hasPromo && (
                <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-neutral-950">
                  ÉCONOMISEZ {(numNormal - (numSale || 0)).toFixed(0)} €
                </span>
              )}
            </div>

            {image && (
              <div className="mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
                <img src={image} alt={title} className="h-full w-full object-cover" />
              </div>
            )}

            <h4 className="mt-4 font-display text-lg sm:text-xl font-extrabold text-white leading-tight">
              {title || 'Titre du Pack VIP'}
            </h4>

            {subtitle && (
              <p className="mt-1 text-xs text-amber-400/90 font-medium leading-relaxed">
                {subtitle}
              </p>
            )}

            {description && (
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                {description}
              </p>
            )}

            {/* Inclusions */}
            {contentLines.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-neutral-800/80 pt-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                  Ce que vous recevez immédiatement :
                </div>
                <ul className="space-y-1.5 text-xs text-neutral-300">
                  {contentLines.filter(Boolean).map((line, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pricing */}
            <div className="mt-6 border-t border-neutral-800/80 pt-4 flex items-baseline justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-neutral-400">Tarif Unique • Accès à vie</div>
                <div className="mt-1 flex items-baseline gap-2">
                  {hasPromo ? (
                    <>
                      <span className="font-mono text-3xl font-extrabold text-amber-400 tabular-nums">
                        {numSale!.toFixed(2)} €
                      </span>
                      <span className="font-mono text-sm text-neutral-500 line-through tabular-nums">
                        {numNormal.toFixed(2)} €
                      </span>
                    </>
                  ) : (
                    <span className="font-mono text-3xl font-extrabold text-white tabular-nums">
                      {numNormal.toFixed(2)} €
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Preview CTA */}
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-xs font-bold text-white shadow-xl shadow-emerald-950/50"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{ctaText || 'Commander le Pack VIP sur WhatsApp'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

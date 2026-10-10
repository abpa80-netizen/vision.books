import React, { useState } from 'react';
import {
  Sparkles,
  X,
  RotateCw,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Send,
  MessageCircle,
  HelpCircle,
  Share2,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { LeadMagnetMarketingContent } from '../../../types';
import { api } from '../../../services/api';

interface LeadMagnetAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    title?: string;
    topic?: string;
    target_audience?: string;
    raw_content?: string;
    format?: string;
  };
  onApply: (data: Partial<LeadMagnetMarketingContent> & { benefits?: string[] }) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LeadMagnetAiGeneratorModal: React.FC<LeadMagnetAiGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onApply,
  showToast,
}) => {
  const [topic, setTopic] = useState(initialData.topic || initialData.title || '');
  const [title, setTitle] = useState(initialData.title || '');
  const [targetAudience, setTargetAudience] = useState(
    initialData.target_audience || 'Entrepreneurs, investisseurs, professionnels et cadres ambitieux'
  );
  const [rawContent, setRawContent] = useState(initialData.raw_content || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'social' | 'hooks'>('content');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Editable generated state
  const [generated, setGenerated] = useState<LeadMagnetMarketingContent | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (fieldToRegenerate?: string) => {
    if (!topic.trim() && !title.trim() && !rawContent.trim()) {
      showToast('Veuillez au moins renseigner le sujet, le titre ou le contenu réel du Lead Magnet.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const data = await api.generateLeadMagnetAI({
        title: title.trim(),
        topic: topic.trim(),
        target_audience: targetAudience.trim(),
        raw_content: rawContent.trim(),
        field_to_regenerate: fieldToRegenerate,
        existing_values: generated || undefined,
      });

      setGenerated(data);
      showToast(
        fieldToRegenerate
          ? `Section "${fieldToRegenerate}" régénérée avec succès !`
          : 'Contenu marketing du Lead Magnet généré avec succès !',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la génération IA', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast('Texte copié dans le presse-papier !', 'info');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleApplyToForm = () => {
    if (!generated) return;
    onApply(generated);
    showToast('Contenu marketing appliqué au formulaire !', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-4 backdrop-blur-md">
      <div className="relative my-6 max-h-[92vh] w-full max-w-4xl flex flex-col rounded-2xl border border-amber-500/30 bg-neutral-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Générateur Marketing IA du Lead Magnet</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  Gemini Flash
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Génération persuasive complète : accroche, bénéfices, page de capture, posts WhatsApp & réseaux sociaux
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Form inputs for generation */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Lightbulb className="h-4 w-4" />
              <span>Données sources du Lead Magnet</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Sujet principal du Lead Magnet *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex : Gestion financière, Psychologie de la négociation, Investissement..."
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Titre actuel ou indicatif
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Les 10 Secrets Inviolables de l'Indépendance Financière"
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300">
                Cible / Public visé
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex : Cadres, freelances, débutants en bourse, entrepreneurs..."
                className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300">
                Contenu réel ou résumé des thèmes abordés
              </label>
              <textarea
                rows={2}
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Ex : Guide de 15 pages détaillant le calcul du cashflow réel, les 3 erreurs des débutants, la formule pour réinvestir sans risque et la feuille de route 90 jours..."
                className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-amber-500/20"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Génération en cours via Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Générer tous les contenus marketing</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated results area */}
          {generated && (
            <div className="space-y-4">
              {/* Navigation tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('content')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTab === 'content'
                        ? 'bg-amber-500 text-neutral-950'
                        : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    1. Page de Capture & Contenu
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('social')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTab === 'social'
                        ? 'bg-amber-500 text-neutral-950'
                        : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    2. Partage WhatsApp & Réseaux
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('hooks')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTab === 'hooks'
                        ? 'bg-amber-500 text-neutral-950'
                        : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    3. Accroches & Curiosité
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Régénérer tout</span>
                </button>
              </div>

              {/* TAB 1: Content and Landing Page */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  {/* Titre captivant */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Titre captivant :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.title, 'title')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'title' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={generated.title}
                      onChange={(e) => setGenerated({ ...generated, title: e.target.value })}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Sous-titre */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Sous-titre prometteur :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.subtitle, 'subtitle')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'subtitle' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={generated.subtitle}
                      onChange={(e) => setGenerated({ ...generated, subtitle: e.target.value })}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Description persuasive */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Description persuasive :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.description, 'description')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'description' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={generated.description}
                      onChange={(e) => setGenerated({ ...generated, description: e.target.value })}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Bénéfices concrets */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Bénéfices annoncés :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.benefits.join('\n'), 'benefits')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'benefits' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier la liste</span>
                      </button>
                    </div>
                    {generated.benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const updated = [...generated.benefits];
                            updated[i] = e.target.value;
                            setGenerated({ ...generated, benefits: updated });
                          }}
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Points clés */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Points clés à retenir :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.key_points.join('\n'), 'key_points')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'key_points' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    {generated.key_points.map((kp, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-amber-500 font-bold shrink-0">{i + 1}.</span>
                        <input
                          type="text"
                          value={kp}
                          onChange={(e) => {
                            const updated = [...generated.key_points];
                            updated[i] = e.target.value;
                            setGenerated({ ...generated, key_points: updated });
                          }}
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Contenu présenté au visiteur & Texte page de capture */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Contenu présenté au visiteur & texte de page :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.visitor_content, 'visitor_content')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'visitor_content' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={generated.visitor_content}
                      onChange={(e) => setGenerated({ ...generated, visitor_content: e.target.value })}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Appel à l'action (CTA) */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Appel à l'action (CTA) :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.cta_text, 'cta_text')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'cta_text' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={generated.cta_text}
                      onChange={(e) => setGenerated({ ...generated, cta_text: e.target.value })}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Social Posts & WhatsApp */}
              {activeTab === 'social' && (
                <div className="space-y-4">
                  {/* Légende pour partager le Lead Magnet */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Légende de partage rapide :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.share_caption, 'share_caption')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'share_caption' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={generated.share_caption}
                      onChange={(e) => setGenerated({ ...generated, share_caption: e.target.value })}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Publication WhatsApp & Réseaux sociaux */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <MessageCircle className="h-4 w-4" />
                        <span>Texte complet pour WhatsApp & Réseaux Sociaux :</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.social_post, 'social_post')}
                        className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1 font-semibold"
                      >
                        {copiedKey === 'social_post' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier pour WhatsApp</span>
                      </button>
                    </div>
                    <textarea
                      rows={7}
                      value={generated.social_post}
                      onChange={(e) => setGenerated({ ...generated, social_post: e.target.value })}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none leading-relaxed font-sans"
                    />
                    <p className="text-[11px] text-neutral-400">
                      Prêt à être copié/collé dans vos statuts, groupes de diffusion WhatsApp, LinkedIn, Instagram ou Facebook avec le lien de capture.
                    </p>
                  </div>

                  {/* Texte de présentation court */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Pitch court (elevator pitch) :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.short_pitch, 'short_pitch')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'short_pitch' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={generated.short_pitch}
                      onChange={(e) => setGenerated({ ...generated, short_pitch: e.target.value })}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Hooks and Curiosity */}
              {activeTab === 'hooks' && (
                <div className="space-y-4">
                  {/* Accroche forte */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Accroche percutante (Hook) :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.hook, 'hook')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'hook' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={generated.hook}
                      onChange={(e) => setGenerated({ ...generated, hook: e.target.value })}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Phrase créant la curiosité */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300">Courte phrase créant la curiosité irrésistible :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.curiosity_hook, 'curiosity_hook')}
                        className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-semibold"
                      >
                        {copiedKey === 'curiosity_hook' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={generated.curiosity_hook}
                      onChange={(e) => setGenerated({ ...generated, curiosity_hook: e.target.value })}
                      className="w-full rounded-lg border border-amber-500/40 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-medium"
                    />
                  </div>

                  {/* Texte additionnel pour page de capture */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Texte argumentaire pour la page de capture :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generated.landing_text, 'landing_text')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'landing_text' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={generated.landing_text}
                      onChange={(e) => setGenerated({ ...generated, landing_text: e.target.value })}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-800 px-4 py-2 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white"
          >
            Fermer
          </button>

          {generated && (
            <button
              type="button"
              onClick={handleApplyToForm}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>Appliquer au formulaire du Lead Magnet</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Gift,
  ArrowRight,
  CheckCircle2,
  Lock,
  Download,
  ShieldCheck,
  Sparkles,
  Headphones,
  FileText,
  Clock,
  ChevronLeft,
  MessageCircle,
  HelpCircle,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LeadMagnet } from '../../types';
import { api } from '../../services/api';
import {
  trackLeadSubmit,
  trackLeadMagnetDownload,
  trackLeadMagnetView,
  trackLeadMagnetClick,
  trackLeadMagnetFormStart,
} from '../../services/analytics';

interface LeadMagnetCapturePageProps {
  slug: string;
}

export const LeadMagnetCapturePage: React.FC<LeadMagnetCapturePageProps> = ({ slug }) => {
  const { leadMagnets, addLead, navigateTo } = useApp();

  const [leadMagnet, setLeadMagnet] = useState<LeadMagnet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasStartedForm, setHasStartedForm] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Form Fields (Obligatoires)
  const [firstName, setFirstName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // Load Lead Magnet by slug and track view
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg('');

    // First try from context state
    const foundLocal = leadMagnets.find(
      (lm) => lm.slug.toLowerCase() === slug.toLowerCase() || lm.id === slug
    );

    if (foundLocal) {
      setLeadMagnet(foundLocal);
      setLoading(false);
      trackLeadMagnetView(foundLocal.slug || slug, `/lead-magnet/${foundLocal.slug || slug}`);
      return;
    }

    // Otherwise fetch from API
    api
      .getLeadMagnet(slug)
      .then((data) => {
        if (isMounted) {
          setLeadMagnet(data);
          setLoading(false);
          trackLeadMagnetView(data.slug || slug, `/lead-magnet/${data.slug || slug}`);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Lead magnet not found via API, searching fallback:', err);
          if (leadMagnets.length > 0) {
            setLeadMagnet(leadMagnets[0]);
            trackLeadMagnetView(leadMagnets[0].slug, `/lead-magnet/${leadMagnets[0].slug}`);
          }
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug, leadMagnets]);

  const handleInputFocus = () => {
    if (!hasStartedForm && leadMagnet) {
      setHasStartedForm(true);
      trackLeadMagnetFormStart(leadMagnet.slug, `/lead-magnet/${leadMagnet.slug}`);
    }
  };

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim()) {
      setErrorMsg('Veuillez renseigner votre prénom.');
      return;
    }

    // Validate WhatsApp: at least 8 digits with international country code
    const cleanDigits = whatsapp.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 8 || cleanDigits.length > 16) {
      setErrorMsg('Veuillez renseigner un numéro WhatsApp valide avec votre indicatif pays (ex: +33 6 12 34 56 78 ou +221 77 123 45 67) comprenant au moins 8 chiffres.');
      return;
    }

    setSubmitting(true);
    trackLeadMagnetClick(leadMagnet?.slug || slug, `/lead-magnet/${leadMagnet?.slug || slug}`);

    try {
      const lmId = leadMagnet?.id || null;
      const downloadPath = leadMagnet?.file_url || `/downloads/${leadMagnet?.slug || 'guide'}.pdf`;

      // 1. Enregistrer le prospect
      const res = await addLead({
        first_name: firstName.trim(),
        whatsapp: whatsapp.trim(),
        lead_magnet_id: lmId,
        source: `Page de capture /lead-magnet/${leadMagnet?.slug || slug}`,
      });

      // 2. Enregistrer l'événement de téléchargement
      trackLeadSubmit(res.lead?.id || `lead-${Date.now()}`, `/lead-magnet/${leadMagnet?.slug || slug}`);
      trackLeadMagnetDownload(lmId || 'guide', `/lead-magnet/${leadMagnet?.slug || slug}`);

      const effectiveDownloadUrl = res.download_url || downloadPath;

      // 3. Permettre immédiatement le téléchargement du Lead Magnet (et uniquement du Lead Magnet)
      try {
        const link = document.createElement('a');
        link.href = effectiveDownloadUrl;
        link.download = `${(leadMagnet?.slug || 'guide-visionbooks')}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.warn('Direct download trigger error:', dlErr);
      }

      setDownloadSuccess(true);

      // Stocker les détails pour la page de vente / confirmation
      try {
        sessionStorage.setItem(
          'vision_books_last_lead',
          JSON.stringify({
            firstName: firstName.trim(),
            whatsapp: whatsapp.trim(),
            leadMagnetTitle: leadMagnet?.title || 'Ressource VIP',
            downloadUrl: effectiveDownloadUrl,
            downloadInitiated: true,
            timestamp: Date.now(),
          })
        );
      } catch {}

      // 4. Rediriger automatiquement vers la page de vente VISION BOOKS après un bref instant
      setTimeout(() => {
        navigateTo('/merci');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de la validation. Veuillez réessayer.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-xs text-neutral-400">Chargement de votre ressource exclusive...</p>
        </div>
      </div>
    );
  }

  if (!leadMagnet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center text-white">
        <Gift className="h-12 w-12 text-amber-500" />
        <h1 className="mt-4 font-display text-2xl font-bold">Ressource introuvable</h1>
        <p className="mt-2 max-w-md text-xs text-neutral-400">
          Ce Lead Magnet n'est plus actif ou l'adresse demandée est incorrecte.
        </p>
        <button
          onClick={() => navigateTo('/')}
          className="mt-6 rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-amber-400"
        >
          Retour au catalogue VISION BOOKS
        </button>
      </div>
    );
  }

  // Parse benefits list safely
  const parseBenefits = (): string[] => {
    const raw = leadMagnet.benefits;
    if (!raw) {
      return [
        'Accès immédiat et sans frais',
        'Synthèse actionnable en 20 minutes',
        'Fiche mémo et modèle décisionnel inclus',
      ];
    }
    if (Array.isArray(raw)) {
      return raw.filter((b): b is string => Boolean(b));
    }
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((b): b is string => Boolean(b));
        }
      } catch {
        // Not JSON, split by lines or bullets
        const lines = raw
          .split(/\r?\n/)
          .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
          .filter(Boolean);
        if (lines.length > 0) return lines;
      }
    }
    return [
      'Accès immédiat et sans frais',
      'Synthèse actionnable en 20 minutes',
      'Fiche mémo et modèle décisionnel inclus',
    ];
  };

  const benefitsList = parseBenefits();

  const defaultFaq = [
    {
      q: 'Comment et quand vais-je recevoir ma ressource ?',
      a: 'Le téléchargement démarre immédiatement dès la validation de votre formulaire. Vous accédez au fichier complet sans délai.',
    },
    {
      q: 'Pourquoi demandez-vous mon numéro WhatsApp ?',
      a: 'Votre numéro WhatsApp nous permet uniquement de vous transmettre votre lien d\'accès sécurisé et de vous avertir de nos prochaines parutions stratégiques. Zéro spam, données strictement confidentielles.',
    },
    {
      q: 'Cette ressource est-elle réellement 100% gratuite ?',
      a: 'Oui, aucun moyen de paiement n\'est requis. C\'est un cadeau offert par VISION BOOKS pour vous permettre d\'expérimenter l\'exigence de nos contenus avant d\'explorer nos livres audio complets.',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Banner Navigation */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => navigateTo('/')}
            className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Catalogue VISION BOOKS</span>
          </button>

          <div
            onClick={() => navigateTo('/')}
            className="cursor-pointer flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-neutral-950 shadow-sm">
              <Headphones className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-white">
              VISION BOOKS
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Offert 100% Gratuit</span>
          </div>
        </div>
      </header>

      {/* Main Landing Page Structure (11 sections requises) */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Présentation & Contenu Marketing */}
          <div className="lg:col-span-7 space-y-8">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ressource Privée Téléchargeable Immédiatement</span>
            </div>

            {/* 2. Titre Accrocheur */}
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                {leadMagnet.title}
              </h1>

              {/* 3. Sous-titre */}
              <p className="mt-3 text-base sm:text-lg font-medium text-amber-400 leading-relaxed">
                {leadMagnet.subtitle || "Guide stratégique et plan d'action prêt à l'emploi pour accélérer vos résultats"}
              </p>
            </div>

            {/* 1. Image du Lead Magnet (Mockup 3D soigné) */}
            <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-amber-500/10 group">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  src={leadMagnet.image || '/src/assets/images/cover_financial_liberty_1790615544438.jpg'}
                  alt={leadMagnet.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
                <span className="rounded-lg bg-neutral-950/80 px-2.5 py-1 font-mono text-[11px] backdrop-blur-md border border-neutral-800">
                  Édition Exclusive VISION BOOKS
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400 font-semibold">
                  <Download className="h-3.5 w-3.5" />
                  <span>Téléchargement Direct Offert</span>
                </span>
              </div>
            </div>

            {/* 4. Présentation du contenu */}
            <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 sm:p-7 space-y-3">
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />
                <span>Présentation du contenu</span>
              </h2>
              <p className="text-sm leading-relaxed text-neutral-300">
                {leadMagnet.description}
              </p>

              {leadMagnet.marketing_content && (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs sm:text-sm text-neutral-300 leading-relaxed italic">
                  {leadMagnet.marketing_content}
                </div>
              )}
            </div>

            {/* 5. Ce que le prospect va découvrir */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-7">
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Ce que vous allez découvrir à l'intérieur :</span>
              </h2>

              {/* 6. Bénéfices concrets */}
              <ul className="mt-4 space-y-3.5">
                {benefitsList.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-200">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                    <span className="leading-relaxed font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 7. Ce qu'il va obtenir gratuitement */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-7">
              <h3 className="font-display text-sm font-bold text-amber-300 uppercase tracking-wider">
                Inclus gratuitement dans votre téléchargement :
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs text-neutral-300">
                <div className="flex items-center gap-2 rounded-lg bg-neutral-950/60 p-3 border border-neutral-800">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Document PDF complet haute résolution</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-neutral-950/60 p-3 border border-neutral-800">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Fiche mémo et plan d'application immédiat</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-neutral-950/60 p-3 border border-neutral-800">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Accès permanent depuis mobile et PC</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-neutral-950/60 p-3 border border-neutral-800">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Aucune publicité intrusive, 100% valeur</span>
                </div>
              </div>

              {/* 8. CTA mobile pour descendre au formulaire */}
              <div className="mt-5 lg:hidden">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 px-4 text-xs font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                >
                  <span>Télécharger gratuitement maintenant</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 11. FAQ courte de réassurance */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-6 sm:p-7">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-500" />
                <span>Questions fréquentes</span>
              </h3>

              <div className="mt-4 divide-y divide-neutral-800/80">
                {defaultFaq.map((faq, idx) => (
                  <div key={idx} className="py-3">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between text-left text-xs font-semibold text-neutral-200 hover:text-white"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-neutral-500 transition-transform ${
                          openFaq === idx ? 'rotate-180 text-amber-400' : ''
                        }`}
                      />
                    </button>
                    {openFaq === idx && (
                      <p className="mt-2 text-xs leading-relaxed text-neutral-400 pl-1">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: 9. Formulaire de capture & 10. Message de réassurance */}
          <div ref={formRef} className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="relative rounded-2xl border-2 border-amber-500/40 bg-neutral-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              {/* Highlight badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-950 shadow-md">
                100% Gratuit & Immédiat
              </div>

              <div className="text-center pt-2">
                <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                  Accéder à votre ressource
                </h3>
                <p className="mt-1.5 text-xs text-neutral-400">
                  Remplissez ce formulaire pour débloquer votre téléchargement direct.
                </p>
              </div>

              {/* 10. Message de réassurance avant formulaire (Exigence explicite de la consigne) */}
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-[11px] leading-relaxed text-amber-200/90 text-left">
                « Votre numéro WhatsApp nous permet uniquement de vous envoyer votre ressource gratuite et de vous informer lorsque nous avons de nouveaux contenus susceptibles de vous intéresser. Vos informations restent confidentielles. »
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/60 p-3 text-xs text-red-200">
                  {errorMsg}
                </div>
              )}

              {/* Success Notification */}
              {downloadSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/80 p-4 text-xs text-emerald-200 space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Téléchargement initié !</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    Redirection automatique vers la collection VISION BOOKS...
                  </p>
                </div>
              )}

              {/* 9. Formulaire de capture : Prénom + Numéro WhatsApp */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-200">
                    Votre Prénom <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onFocus={handleInputFocus}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex : Alexandre"
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-base sm:text-sm text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-200">
                    Numéro WhatsApp <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <MessageCircle className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onFocus={handleInputFocus}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+33 6 12 34 56 78 ou +221 77 123 45 67"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 pl-10 pr-4 font-mono text-base sm:text-sm text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-neutral-500">
                    Indiquez votre indicatif international pour une réception instantanée.
                  </p>
                </div>

                {/* Bouton exact requis : « Télécharger gratuitement » */}
                <button
                  type="submit"
                  disabled={submitting || downloadSuccess}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3.5 text-sm font-bold text-neutral-950 transition-all hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 shadow-lg shadow-amber-500/20 active:scale-[0.99] cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
                      <span>Validation & téléchargement...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 stroke-[2.5]" />
                      <span>Télécharger gratuitement</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Petite mention de confiance sous le formulaire */}
                <div className="pt-4 space-y-2 border-t border-neutral-800 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Téléchargement direct sans carte bancaire ni engagement.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-neutral-500 shrink-0" />
                    <span>Vos coordonnées restent strictement confidentielles. Zéro spam.</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

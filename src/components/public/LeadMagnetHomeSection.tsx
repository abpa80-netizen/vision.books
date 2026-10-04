import React, { useState } from 'react';
import { Gift, CheckCircle, ArrowRight, Download, Sparkles, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { trackLeadSubmit, trackLeadMagnetDownload } from '../../services/analytics';

export const LeadMagnetHomeSection: React.FC = () => {
  const { leadMagnets, addLead, showToast, navigateTo } = useApp();
  const [firstName, setFirstName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadReady, setDownloadReady] = useState<string | null>(null);

  // Active lead magnet
  const activeMagnet = leadMagnets.find((lm) => lm.is_active !== false) || leadMagnets[0];

  if (!activeMagnet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !whatsapp.trim()) {
      showToast('Veuillez renseigner votre prénom et votre numéro WhatsApp.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await addLead({
        first_name: firstName.trim(),
        whatsapp: whatsapp.trim(),
        lead_magnet_id: activeMagnet.id,
        source: 'Homepage Lead Magnet Section',
      });

      trackLeadSubmit(activeMagnet.id, typeof window !== 'undefined' ? window.location.pathname : '/');

      const downloadUrl = activeMagnet.file_url || activeMagnet.download_url || '/downloads/guide-visionbooks.pdf';
      trackLeadMagnetDownload(whatsapp.trim(), '/');

      setDownloadReady(downloadUrl);
      showToast('Merci ! Votre guide gratuit est prêt au téléchargement.', 'success');

      // Auto trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${activeMagnet.slug || 'guide-offert'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'enregistrement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ressource-gratuite" className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-b from-neutral-950 via-neutral-900/60 to-neutral-950 py-20">
      {/* Glow highlight */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-amber-500/30 bg-neutral-900/80 p-8 shadow-2xl backdrop-blur-md sm:p-12 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
          {/* Left Description */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Gift className="h-3.5 w-3.5 text-amber-400" />
              <span>Cadeau Exclusif · 100% Offert</span>
            </div>

            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              {activeMagnet.title || 'Guide Pratique : Les Fondements du Succès'}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-neutral-300">
              {activeMagnet.description ||
                'Téléchargez immédiatement notre dossier stratégique pour condenser les meilleures pratiques des leaders d\'affaires et multiplier vos résultats.'}
            </p>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                <CheckCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Format synthétique PDF & check-lists immédiatement applicables</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                <CheckCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Accès instantané sans carte bancaire ni engagement</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                <CheckCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Reçu directement et utilisable sur tous vos écrans</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigateTo(`/lead-magnet/${activeMagnet.slug}`)}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4 flex items-center gap-1"
              >
                <span>Voir la page complète de présentation du guide</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="mt-8 lg:col-span-5 lg:mt-0">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/90 p-6 sm:p-8 shadow-xl">
              {downloadReady ? (
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Téléchargement débloqué !
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Le guide s'est lancé automatiquement. Si ce n'est pas le cas, cliquez ci-dessous :
                  </p>
                  <a
                    href={downloadReady}
                    download
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors w-full"
                  >
                    <Download className="h-4 w-4" />
                    <span>Télécharger à nouveau</span>
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-center sm:text-left mb-2">
                    <h3 className="font-display text-base font-bold text-white">
                      Recevez votre exemplaire gratuit
                    </h3>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Remplissez ces 2 informations pour débloquer le téléchargement.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Votre prénom <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: Alexandre"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Votre numéro WhatsApp <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ex: +229 97 00 00 00"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Télécharger Mon Guide Gratuit</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 pt-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Vos coordonnées restent strictement confidentielles. Zéro spam.</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

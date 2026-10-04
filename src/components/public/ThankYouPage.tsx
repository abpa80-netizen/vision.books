import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Download,
  ArrowRight,
  Headphones,
  Sparkles,
  ShoppingBag,
  Clock,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { trackLeadMagnetDownload } from '../../services/analytics';

export const ThankYouPage: React.FC = () => {
  const { navigateTo } = useApp();

  const [leadInfo, setLeadInfo] = useState<{
    firstName?: string;
    whatsapp?: string;
    leadMagnetTitle?: string;
    downloadUrl?: string;
  }>({});

  const [countdown, setCountdown] = useState(6);
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  useEffect(() => {
    // Read from session storage
    try {
      const stored = sessionStorage.getItem('vision_books_last_lead');
      if (stored) {
        const parsed = JSON.parse(stored);
        setLeadInfo(parsed);

        // Auto trigger download once if provided and not already triggered
        if (parsed.downloadUrl && !parsed.downloadInitiated && !downloadTriggered) {
          setDownloadTriggered(true);
          const link = document.createElement('a');
          link.href = parsed.downloadUrl;
          const filename = parsed.downloadUrl.split('/').pop() || 'guide-visionbooks.pdf';
          link.download = filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch {}
  }, [downloadTriggered]);

  // Automatic countdown redirection to main sales page (homepage)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigateTo('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigateTo]);

  const handleManualDownload = () => {
    const targetUrl = leadInfo.downloadUrl || '/downloads/guide-visionbooks.pdf';
    trackLeadMagnetDownload(leadInfo.whatsapp || 'lead', '/merci');
    const link = document.createElement('a');
    link.href = targetUrl;
    const filename = targetUrl.split('/').pop() || 'guide-visionbooks.pdf';
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 antialiased selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Bar */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div
            onClick={() => navigateTo('/')}
            className="cursor-pointer flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-neutral-950">
              <Headphones className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-white">
              VISION BOOKS
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Accès confirmé</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-xl text-center">
          {/* Success Icon */}
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 stroke-[2.2]" />
            <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-neutral-950">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {leadInfo.firstName
              ? `Félicitations ${leadInfo.firstName} !`
              : 'Félicitations ! Votre accès est débloqué !'}
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-neutral-300">
            Votre ressource{' '}
            <span className="font-semibold text-amber-400">
              {leadInfo.leadMagnetTitle || 'exclusive'}
            </span>{' '}
            a été transmise et le téléchargement a été initié automatiquement.
          </p>

          {/* Fallback Download Trigger Box */}
          <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-sm space-y-3">
            <div className="text-xs text-neutral-400">
              Si le téléchargement n'a pas débuté automatiquement sur votre appareil :
            </div>
            <button
              onClick={handleManualDownload}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-md active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Cliquez ici pour télécharger le fichier manuellement</span>
            </button>
          </div>

          {/* Countdown & Auto-Redirect Box */}
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Redirection automatique en cours</span>
            </div>

            <p className="mt-2 text-xs text-neutral-300">
              Vous allez être redirigé vers notre sélection de livres audio Best-Sellers dans{' '}
              <span className="font-mono text-base font-bold text-white tabular-nums">
                {countdown}
              </span>{' '}
              secondes...
            </p>

            {/* Visual Progress Bar */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000 ease-linear"
                style={{ width: `${((6 - countdown) / 6) * 100}%` }}
              />
            </div>

            {/* Direct CTA Button */}
            <button
              onClick={() => navigateTo('/')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Accéder immédiatement aux Best-Sellers VISION BOOKS</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* WhatsApp Direct Option */}
          <div className="mt-6 text-center">
            <a
              href="https://wa.me/?text=Bonjour%20VISION%20BOOKS,%20je%20viens%20de%20t%C3%A9l%C3%A9charger%20votre%20guide%20gratuit%20!"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Échanger avec un conseiller sur WhatsApp</span>
            </a>
          </div>

          {/* Trust Footnote */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>VISION BOOKS • Téléchargement direct certifié et sécurisé.</span>
          </div>
        </div>
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Comment se passe la commande via WhatsApp ?',
    answer:
      'Lorsque vous cliquez sur "Commander sur WhatsApp", un message pré-rempli contenant le titre du livre audio, sa référence et le prix s\'ouvre directement dans votre application WhatsApp. Notre équipe vous répond immédiatement pour valider votre commande et vous envoyer votre lien d\'accès sécurisé.',
  },
  {
    question: 'Sous quel format et avec quelle qualité sont livrés les livres audio ?',
    answer:
      'Tous nos livres audio sont masterisés en studio professionnel et fournis au format MP3 haute définition (320 kbps), lisibles sur smartphone (iPhone, Android), tablette, ordinateur ou système audio de voiture. Chaque commande inclut également la synthèse texte PDF et les bonus d\'action.',
  },
  {
    question: 'Puis-je écouter les livres sans connexion Internet ?',
    answer:
      'Absolument. Dès validation de votre commande, vous recevez un lien de téléchargement direct. Vous pouvez sauvegarder les fichiers audio sur votre appareil et les écouter hors-ligne à tout moment (en avion, en déplacement, au sport).',
  },
  {
    question: 'Quels sont les modes de paiement acceptés ?',
    answer:
      'Nous acceptons les paiements Mobile Money (Orange Money, MTN MoMo, Wave, etc.), cartes bancaires et virements selon votre localisation. Les détails vous sont transmis directement en un instant sur WhatsApp lors de votre échange.',
  },
  {
    question: 'Les bonus annoncés sont-ils vraiment inclus gratuitement ?',
    answer:
      'Oui, à 100 %. Chaque livre audio commandé sur VISION BOOKS inclut l\'ensemble des bonus d\'action mentionnés sur sa fiche (guides pratiques, fiches mémo et check-lists opérationnelles) sans aucun coût supplémentaire.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { settings } = useApp();

  const toggle = (idx: number) => {
    setOpenIndex((curr) => (curr === idx ? null : idx));
  };

  return (
    <section id="faq" className="border-b border-neutral-800 bg-neutral-950 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>Questions Fréquentes</span>
          </div>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Tout Ce Que Vous Devez Savoir
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-xl mx-auto">
            Des réponses claires et immédiates pour commander vos livres audio en toute sérénité.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/40 transition-colors hover:border-neutral-700"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between p-5 sm:p-6 text-left"
                >
                  <span className="font-display text-sm sm:text-base font-semibold text-white pr-4">
                    {item.question}
                  </span>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-amber-500/20 text-amber-400' : ''
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-800/60 px-5 pb-5 pt-3 sm:px-6 sm:pb-6 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
          <div>
            <h4 className="font-display text-sm font-bold text-white">
              Vous avez une question spécifique ?
            </h4>
            <p className="mt-1 text-xs text-neutral-400">
              Notre équipe d'assistance est joignable 7j/7 directement sur WhatsApp.
            </p>
          </div>
          <a
            href={`https://wa.me/${(settings?.whatsapp_number || '22990000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Bonjour VISION BOOKS, j\'ai une question avant de commander un livre audio.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors sm:mt-0"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Discuter sur WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
};

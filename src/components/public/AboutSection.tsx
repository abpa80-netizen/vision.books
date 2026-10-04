import React from 'react';
import { Target, Mic2, Zap, Clock, BookOpen, CheckCircle2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const pillars = [
    {
      icon: Target,
      title: 'Sélection Éditoriale Sans Compromis',
      description:
        'Nous ne publions pas des centaines de titres superflus. Chaque livre audio est rigoureusement sélectionné pour son retour sur investissement concret et sa pertinence opérationnelle.',
    },
    {
      icon: Mic2,
      title: 'Narration Studio Haute Définition',
      description:
        'Fini les voix monocordes ou générées à la chaîne sans âme. Nos comédiens voix-off professionnels incarnent chaque concept avec clarté, rythme et conviction.',
    },
    {
      icon: Zap,
      title: 'Focalisation sur l\'Action Immédiate',
      description:
        'Chaque œuvre audio est complétée par des plans d\'action et des synthèses clés pour transformer chaque chapitre écouté en compétence exécutable.',
    },
    {
      icon: Clock,
      title: 'Optimisation de Votre Temps Précieux',
      description:
        'Idéal pour rentabiliser vos transports, séances sportives ou moments de transition. Apprenez en immersion sans empiéter sur votre journée de travail.',
    },
  ];

  return (
    <section id="a-propos" className="border-b border-neutral-800 bg-neutral-900/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-500">
            Manifeste & Raison d'Être
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
            Pourquoi VISION BOOKS redéfinit l'apprentissage audio professionnel
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-400">
            Dans un monde submergé par le bruit digital et l'infobésité, VISION BOOKS est née d'une exigence : offrir aux leaders, créateurs d'entreprises et visionnaires une source de savoir audio épurée, dense et profondément stimulante.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-xl border border-neutral-800 bg-neutral-950 p-6 transition-all hover:border-neutral-700 hover:bg-neutral-900/80"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-neutral-950">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Summary banner */}
        <div className="mt-12 rounded-xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/20 p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">
                  Rejoignez plus de 12 000 auditeurs exigeants
                </h4>
                <p className="text-sm text-neutral-400">
                  Accès instantané à l'ensemble des titres sur smartphone, tablette et ordinateur.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Garantie d'écoute 30 jours satisfait ou remboursé</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

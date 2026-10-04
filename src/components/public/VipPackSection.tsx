import React from 'react';
import { Crown, Sparkles, CheckCircle2, ArrowRight, MessageCircle, Gift, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { trackWhatsAppClick } from '../../services/analytics';

export const VipPackSection: React.FC = () => {
  const { vipPack, settings, showToast } = useApp();

  // Show ONLY when Pack VIP exists, is active and configured to show on home
  if (!vipPack || !vipPack.is_active || !vipPack.show_on_home) {
    return null;
  }

  const numNormal = vipPack.normal_price || 0;
  const numSale = vipPack.sale_price !== null && vipPack.sale_price !== undefined ? vipPack.sale_price : null;
  const hasPromo = numSale !== null && numSale < numNormal;
  const finalPrice = hasPromo ? numSale! : numNormal;
  const priceText = `${finalPrice % 1 === 0 ? finalPrice : finalPrice.toFixed(2)} €`;

  let inclusions: string[] = [];
  try {
    inclusions = typeof vipPack.content === 'string' && vipPack.content.startsWith('[')
      ? JSON.parse(vipPack.content)
      : (vipPack.content ? vipPack.content.split('\n').filter(Boolean) : []);
  } catch {
    inclusions = vipPack.content ? vipPack.content.split('\n').filter(Boolean) : [];
  }

  const handleOrderVipWhatsApp = () => {
    const rawPhone = settings?.whatsapp_number || '+33 6 12 34 56 78';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    const message = `Bonjour VISION BOOKS,
Je souhaite commander l'offre groupée :
👑 ${vipPack.title}

Tarif :
${priceText} (Accès à vie)

Merci de m'indiquer la marche à suivre pour débloquer immédiatement mes accès audio.`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Track click
    trackWhatsAppClick('pack-vip', '/#pack-vip');

    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="pack-vip" className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 py-20 lg:py-28">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[450px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border-2 border-amber-500/40 bg-neutral-950/90 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Visual cover column */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
                  <img
                    src={vipPack.image || '/src/assets/images/cover_business_empire_1790615532791.jpg'}
                    alt={vipPack.title}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60" />

                  {/* Top VIP Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-950 shadow-lg">
                      <Crown className="h-3.5 w-3.5 fill-neutral-950" />
                      <span>Pack VIP Tout-en-Un</span>
                    </span>
                  </div>
                </div>

                {/* Sub-badge guarantee */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400 text-center">
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  <span>Accès instantané & illimité • Pas d'abonnement récurrent</span>
                </div>
              </div>
            </div>

            {/* Content & CTA Column */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Offre Privilège Limitée</span>
                </div>

                <h2 className="mt-2 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {vipPack.title}
                </h2>

                {vipPack.subtitle && (
                  <p className="mt-2 text-sm sm:text-base font-medium text-amber-300/90 leading-relaxed">
                    {vipPack.subtitle}
                  </p>
                )}

                {vipPack.description && (
                  <p className="mt-3 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    {vipPack.description}
                  </p>
                )}
              </div>

              {/* Inclusions list */}
              {inclusions.length > 0 && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-3">
                    Inclus immédiatement dans votre accès :
                  </div>
                  <ul className="space-y-2 text-xs text-neutral-300">
                    {inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pricing & CTA */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-neutral-800 pb-5">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Tarif Privilège Unique
                    </div>
                    <div className="mt-1 flex items-baseline gap-3">
                      {hasPromo ? (
                        <>
                          <span className="font-mono text-4xl sm:text-5xl font-extrabold text-amber-400 tabular-nums">
                            {numSale!.toFixed(2)} €
                          </span>
                          <span className="font-mono text-xl sm:text-2xl text-neutral-500 line-through tabular-nums">
                            {numNormal.toFixed(2)} €
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-4xl sm:text-5xl font-extrabold text-white tabular-nums">
                          {numNormal.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </div>

                  {hasPromo && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 self-start sm:self-center">
                      <span className="text-xs font-bold text-amber-300">
                        Économisez {(numNormal - (numSale || 0)).toFixed(0)} € aujourd'hui
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <button
                    onClick={handleOrderVipWhatsApp}
                    className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-4 text-base sm:text-lg font-extrabold text-white shadow-xl shadow-emerald-950/60 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <MessageCircle className="h-6 w-6 fill-white/20 group-hover:scale-110 transition-transform" />
                    <span>{vipPack.cta_text || 'Commander le Pack VIP sur WhatsApp'}</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="mt-2 text-center text-[11px] text-neutral-400">
                    Déblocage immédiat de vos masterclasses audio et fiches d'action par notre équipe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

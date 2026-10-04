import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Eye,
  MousePointerClick,
  MessageCircle,
  UserCheck,
  Download,
  ShoppingBag,
  TrendingUp,
  RotateCw,
  Sparkles,
  Clock,
  ArrowUpRight,
  Plus,
  Headphones,
  Layers,
  Activity,
  CheckCircle2,
  Calendar,
  BookOpen,
  Gift,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { AnalyticsStats } from '../../../types';
import { trackSiteVisit, trackProductClick, trackWhatsAppClick } from '../../../services/analytics';

export const DashboardView: React.FC = () => {
  const { products, categories, leads, leadMagnets, setActiveAdminTab, showToast } = useApp();

  const [range, setRange] = useState<'all' | '30d' | '7d' | 'today'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  const fetchStats = useCallback(async (selectedRange = range, isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await api.getAnalyticsStats(selectedRange);
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching analytics stats:', err);
      showToast('Impossible de charger les statistiques analytiques', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range, showToast]);

  useEffect(() => {
    fetchStats(range);
  }, [range, fetchStats]);

  const handleRangeChange = (newRange: 'all' | '30d' | '7d' | 'today') => {
    setRange(newRange);
  };

  // Helper to trigger a quick test event so admin can verify tracking in real-time
  const handleTestEvent = async (type: 'visit' | 'click' | 'whatsapp') => {
    const firstProduct = products[0];
    if (type === 'visit') {
      trackSiteVisit('/catalogue');
      showToast('Événement « Visite du site » simulé et enregistré', 'info');
    } else if (type === 'click' && firstProduct) {
      trackProductClick(firstProduct.id, '/catalogue');
      showToast(`Événement « Clic produit : ${firstProduct.title} » simulé et enregistré`, 'info');
    } else if (type === 'whatsapp' && firstProduct) {
      trackWhatsAppClick(firstProduct.id, `/produit/${firstProduct.slug}`);
      showToast(`Événement « Clic WhatsApp : ${firstProduct.title} » simulé et enregistré`, 'info');
    }
    // Refresh stats after a brief moment
    setTimeout(() => {
      fetchStats(range);
    }, 300);
  };

  // Format event labels
  const formatEventType = (type: string) => {
    switch (type) {
      case 'site_visit':
        return { label: 'Visite du site', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'product_view':
        return { label: 'Vue fiche produit', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      case 'product_click':
        return { label: 'Clic produit', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'whatsapp_order_click':
        return { label: 'Clic WhatsApp', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'lead_form_submit':
        return { label: 'Nouveau Lead', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
      case 'lead_magnet_download':
        return { label: 'Téléchargement', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      default:
        return { label: type, color: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
    }
  };

  const totalDownloads = stats?.leadMagnetDownloads ?? leadMagnets.reduce((acc, lm) => acc + (lm.downloads_count ?? lm.downloadsCount ?? 0), 0);

  // 8 Required KPI Cards
  const kpiCards = [
    {
      id: 'visitors',
      label: 'Total Visiteurs',
      value: stats ? stats.totalVisitors : '—',
      icon: Users,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      help: 'Visiteurs uniques distincts enregistrés',
      accuracy: 'Mesuré par identifiant visiteur persistant',
    },
    {
      id: 'visits',
      label: 'Nombre de Visites',
      value: stats ? stats.totalVisits : '—',
      icon: Eye,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      help: 'Total des pages et fiches consultées',
      accuracy: 'Pages explorées sur la plateforme',
    },
    {
      id: 'prod-clicks',
      label: 'Clics Produits',
      value: stats ? stats.productClicks : '—',
      icon: MousePointerClick,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      help: 'Clics sur fiches et boutons du catalogue',
      accuracy: 'Intéractions directes avec les livres',
    },
    {
      id: 'wa-clicks',
      label: 'Clics WhatsApp',
      value: stats ? stats.whatsappClicks : '—',
      icon: MessageCircle,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      help: 'Clics sur « Commander sur WhatsApp »',
      accuracy: 'Ouvertures de wa.me avec message pré-rempli',
    },
    {
      id: 'leads',
      label: 'Nombre de Leads',
      value: stats ? stats.leadsCount : leads.length,
      icon: UserCheck,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      help: 'Contacts capturés via Lead Magnets',
      accuracy: 'Enregistrés dans la table SQLite leads',
    },
    {
      id: 'downloads',
      label: 'Téléchargements Magnets',
      value: totalDownloads,
      icon: Download,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      help: 'Guides et masterclasses offertes délivrées',
      accuracy: 'Téléchargements réels confirmés',
    },
    {
      id: 'orders',
      label: 'Commandes / Intentions',
      value: stats ? stats.ordersIntentions : '—',
      icon: ShoppingBag,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      help: 'Intentions d\'achat directes via WhatsApp',
      accuracy: 'Commandes initiées avec détails du produit',
    },
    {
      id: 'conversion',
      label: 'Taux de Conversion',
      value: stats ? `${stats.conversionRate}%` : '0%',
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      help: 'Commandes WhatsApp / Total Visiteurs',
      accuracy: stats ? `Global (Leads + Achats) : ${stats.globalConversionRate}%` : 'Ratio calculé en temps réel',
    },
  ];

  // Max value for visit chart normalization
  const maxVisitsInTrend = Math.max(...(stats?.visitsTrend?.map((v) => v.visits) || [1]), 1);
  const maxLeadsInTrend = Math.max(...(stats?.leadsTrend?.map((l) => l.leads) || [1]), 1);

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-850 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Dashboard Analytique
            </h1>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>Tracking actif</span>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Statistiques basées exclusivement sur les événements réels enregistrés dans la table{' '}
            <code className="rounded bg-neutral-900 px-1 py-0.5 font-mono text-amber-400">analytics_events</code>{' '}
            et les prospects qualifiés.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Tabs */}
          <div className="inline-flex rounded-xl border border-neutral-800 bg-neutral-900/80 p-1 text-xs font-medium">
            <button
              onClick={() => handleRangeChange('today')}
              className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                range === 'today'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => handleRangeChange('7d')}
              className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                range === '7d'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => handleRangeChange('30d')}
              className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                range === '30d'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              30 jours
            </button>
            <button
              onClick={() => handleRangeChange('all')}
              className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                range === 'all'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tout
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchStats(range, true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white active:scale-95 transition-all"
            title="Rafraîchir les statistiques"
          >
            <RotateCw className={`h-3.5 w-3.5 text-amber-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Live Event Test Bar for Admin Verification */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 shrink-0 text-amber-400" />
          <div className="text-xs">
            <span className="font-semibold text-white">Vérification du tracking en direct : </span>
            <span className="text-neutral-400">
              Déclenchez un événement pour observer l'incrémentation immédiate des compteurs ci-dessous.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTestEvent('visit')}
            className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            +1 Visite
          </button>
          <button
            onClick={() => handleTestEvent('click')}
            className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            +1 Clic Produit
          </button>
          <button
            onClick={() => handleTestEvent('whatsapp')}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
          >
            +1 Clic WhatsApp
          </button>
        </div>
      </div>

      {/* 8 Metric KPI Cards Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Métriques Clés & Conversion
          </h2>
          <span className="text-[11px] text-neutral-500">
            {range === 'today' ? "Période : Aujourd'hui" : range === '7d' ? 'Période : 7 derniers jours' : range === '30d' ? 'Période : 30 derniers jours' : 'Période : Historique complet'}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.id}
                className="group relative flex flex-col justify-between rounded-xl border border-neutral-850 bg-neutral-900/60 p-5 backdrop-blur-sm transition-all hover:border-neutral-750 hover:bg-neutral-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-300">{kpi.label}</span>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${kpi.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 font-display text-3xl font-extrabold tabular-nums tracking-tight text-white">
                    {loading ? (
                      <span className="inline-block h-8 w-16 animate-pulse rounded bg-neutral-800"></span>
                    ) : (
                      kpi.value
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-400">{kpi.help}</p>
                </div>

                <div className="mt-4 border-t border-neutral-800/60 pt-2.5 text-[10px] text-neutral-500">
                  <span className="truncate block font-mono">{kpi.accuracy}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evolution Charts Grid: Visites & Leads */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Évolution des Visites */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/50 p-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">Évolution des Visites</h3>
                <p className="text-[11px] text-neutral-400">Total consultations du catalogue & des fiches</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-display text-base font-bold text-purple-400 tabular-nums">
                {stats?.visitsTrend?.reduce((acc, v) => acc + v.visits, 0) ?? 0}
              </span>
              <span className="text-[10px] text-neutral-500 block">sur la période</span>
            </div>
          </div>

          <div className="mt-6">
            {stats?.visitsTrend && stats.visitsTrend.length > 0 ? (
              <div className="space-y-3">
                <div className="flex h-36 items-end gap-2 pt-6">
                  {stats.visitsTrend.map((item, idx) => {
                    const heightPercent = maxVisitsInTrend > 0 ? Math.max((item.visits / maxVisitsInTrend) * 100, 6) : 6;
                    return (
                      <div key={idx} className="group relative flex-1 flex flex-col items-center h-full justify-end">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-7 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-white whitespace-nowrap z-10">
                          {item.visits} visites
                        </div>
                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t transition-all duration-300 ${
                            item.visits > 0
                              ? 'bg-gradient-to-t from-purple-600 to-purple-400 group-hover:brightness-125'
                              : 'bg-neutral-800/40'
                          }`}
                        />
                        <span className="mt-2 text-[10px] text-neutral-500 truncate w-full text-center group-hover:text-neutral-300">
                          {item.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-800/60 pt-2">
                  <span>Activité journalière enregistrée</span>
                  <span className="font-mono text-neutral-400">Pic : {maxVisitsInTrend} visites</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500">
                Aucune donnée de visite pour cette période.
              </div>
            )}
          </div>
        </div>

        {/* Évolution des Leads */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/50 p-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">Évolution des Leads</h3>
                <p className="text-[11px] text-neutral-400">Contacts qualifiés capturés via formulaires</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-display text-base font-bold text-cyan-400 tabular-nums">
                {stats?.leadsTrend?.reduce((acc, l) => acc + l.leads, 0) ?? leads.length}
              </span>
              <span className="text-[10px] text-neutral-500 block">sur la période</span>
            </div>
          </div>

          <div className="mt-6">
            {stats?.leadsTrend && stats.leadsTrend.length > 0 ? (
              <div className="space-y-3">
                <div className="flex h-36 items-end gap-2 pt-6">
                  {stats.leadsTrend.map((item, idx) => {
                    const heightPercent = maxLeadsInTrend > 0 ? Math.max((item.leads / maxLeadsInTrend) * 100, 6) : 6;
                    return (
                      <div key={idx} className="group relative flex-1 flex flex-col items-center h-full justify-end">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-7 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-white whitespace-nowrap z-10">
                          {item.leads} leads
                        </div>
                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t transition-all duration-300 ${
                            item.leads > 0
                              ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:brightness-125'
                              : 'bg-neutral-800/40'
                          }`}
                        />
                        <span className="mt-2 text-[10px] text-neutral-500 truncate w-full text-center group-hover:text-neutral-300">
                          {item.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-800/60 pt-2">
                  <span>Prospects enregistrés dans SQLite</span>
                  <span className="font-mono text-neutral-400">Total : {leads.length} contacts</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500">
                Aucun lead capturé sur cette période.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          15. ANALYTIQUE DES LEAD MAGNETS
      ================================================== */}
      {(() => {
        const lmVisits = stats?.leadMagnetVisits ?? 0;
        const lmLeadsCount = stats?.leadsCount ?? leads.length;
        const lmDownloads = stats?.leadMagnetDownloads ?? totalDownloads;
        const lmConversionRate = lmVisits > 0 ? Number(Math.min(100, (lmLeadsCount / lmVisits) * 100).toFixed(1)) : (lmLeadsCount > 0 ? 100 : 0);

        const leadMagnetsRanked = (stats?.leadMagnetsPerformance && stats.leadMagnetsPerformance.length > 0)
          ? stats.leadMagnetsPerformance
          : leadMagnets.map((lm) => {
              const matchingLeads = leads.filter(
                (l) => l.lead_magnet_id === lm.id || (l.lead_magnet_title && l.lead_magnet_title.toLowerCase().includes(lm.title.toLowerCase()))
              ).length;
              const downloads = Number(lm.downloads_count ?? lm.downloadsCount ?? 0);
              return {
                id: lm.id,
                title: lm.title,
                slug: lm.slug,
                image: lm.image,
                visits_count: Math.max(downloads, matchingLeads),
                leads_count: matchingLeads,
                downloads_count: downloads,
                conversion_rate: matchingLeads > 0 ? 100 : 0,
                active: Boolean(lm.active),
              };
            }).sort((a, b) => b.leads_count - a.leads_count);

        return (
          <div className="rounded-2xl border border-amber-500/30 bg-neutral-900/60 p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20">
                  <Gift className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-white sm:text-xl">
                    Analytique des Lead Magnets
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Mesure des visites, des leads WhatsApp capturés et identification des meilleurs tunnels de conversion.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('lead-magnets')}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-850 transition-colors"
                >
                  <span>Gérer les Lead Magnets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('leads')}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors"
                >
                  <span>Voir tous les Leads ({lmLeadsCount})</span>
                </button>
              </div>
            </div>

            {/* 4 Indicateurs Requis Explicitement */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Nombre de visites Lead Magnet */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Visites Lead Magnet</span>
                  <Eye className="h-4 w-4 text-purple-400" />
                </div>
                <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                  {lmVisits}
                </div>
                <div className="mt-1 text-[11px] text-neutral-500">Visites landing pages /lead-magnet/*</div>
              </div>

              {/* 2. Nombre de Leads */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Nombre de Leads</span>
                  <UserCheck className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="mt-2 font-mono text-2xl font-bold text-cyan-400 tabular-nums">
                  {lmLeadsCount}
                </div>
                <div className="mt-1 text-[11px] text-neutral-500">Formulaires validés avec succès</div>
              </div>

              {/* 3. Nombre de téléchargements */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Téléchargements</span>
                  <Download className="h-4 w-4 text-rose-400" />
                </div>
                <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                  {lmDownloads}
                </div>
                <div className="mt-1 text-[11px] text-neutral-500">Guides gratuits délivrés</div>
              </div>

              {/* 4. Taux de conversion */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Taux de Conversion</span>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-2 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                  {lmConversionRate}%
                </div>
                <div className="mt-1 text-[11px] text-neutral-500">Ratio Leads / Visites de landing page</div>
              </div>
            </div>

            {/* Identification des Lead Magnets qui génèrent le plus de prospects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Classement des Lead Magnets (Top Générateurs de Prospects)</span>
                </h3>
                <span className="text-[11px] text-neutral-400">Classés par nombre de leads générés</span>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                      <tr>
                        <th className="py-3 pl-4 pr-3 font-semibold">Rang</th>
                        <th className="px-3 py-3 font-semibold">Lead Magnet</th>
                        <th className="px-3 py-3 font-semibold">Visites</th>
                        <th className="px-3 py-3 font-semibold">Leads Capturés</th>
                        <th className="px-3 py-3 font-semibold">Téléchargements</th>
                        <th className="px-3 py-3 font-semibold">Taux de Conversion</th>
                        <th className="py-3 pl-3 pr-4 text-right font-semibold">Lien</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
                      {leadMagnetsRanked.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-neutral-500">
                            Aucun Lead Magnet trouvé.
                          </td>
                        </tr>
                      ) : (
                        leadMagnetsRanked.map((lm, idx) => (
                          <tr key={lm.id} className="hover:bg-neutral-900/60 transition-colors">
                            <td className="py-3 pl-4 pr-3">
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                  idx === 0
                                    ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                                    : idx === 1
                                    ? 'bg-neutral-700 text-white'
                                    : 'bg-neutral-800 text-neutral-400'
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={lm.image || '/src/assets/images/cover_financial_liberty_1790615544438.jpg'}
                                  alt={lm.title}
                                  className="h-10 w-8 rounded object-cover shadow-sm bg-neutral-900 shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="min-w-0 max-w-xs">
                                  <h4 className="font-semibold text-white truncate">{lm.title}</h4>
                                  <p className="font-mono text-[10px] text-amber-400/80 truncate">
                                    /lead-magnet/{lm.slug}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 font-mono text-neutral-300 tabular-nums">
                              {lm.visits_count}
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-400 border border-cyan-500/20 tabular-nums">
                                <UserCheck className="h-3 w-3" />
                                <span>{lm.leads_count} leads</span>
                              </span>
                            </td>
                            <td className="px-3 py-3 font-mono text-neutral-300 tabular-nums">
                              {lm.downloads_count}
                            </td>
                            <td className="px-3 py-3 font-mono font-bold text-emerald-400 tabular-nums">
                              {lm.conversion_rate}%
                            </td>
                            <td className="py-3 pl-3 pr-4 text-right">
                              <a
                                href={`/lead-magnet/${lm.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded bg-neutral-800 px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors border border-neutral-700"
                                title="Tester la page publique de capture"
                              >
                                <span>Voir page</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Top Products & Top Categories Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 1. Produits les plus consultés */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/50 p-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-400" />
              <h3 className="font-display text-sm font-bold text-white">
                Produits les Plus Consultés
              </h3>
            </div>
            <button
              onClick={() => setActiveAdminTab('produits')}
              className="text-[11px] font-medium text-amber-500 hover:text-amber-400"
            >
              Catalogue ({products.length})
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {stats?.mostViewedProducts && stats.mostViewedProducts.length > 0 ? (
              stats.mostViewedProducts.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800/70 bg-neutral-950/40 p-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-bold text-neutral-400">
                      {idx + 1}
                    </span>
                    <img
                      src={p.cover}
                      alt={p.title}
                      className="h-10 w-7 rounded object-cover shadow-sm bg-neutral-950 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{p.title}</h4>
                      <p className="text-[11px] text-neutral-400 truncate">{p.author}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-purple-400 tabular-nums">
                      {p.views_count} {p.views_count > 1 ? 'vues' : 'vue'}
                    </div>
                    <span className="text-[10px] text-neutral-500">
                      {(p.sale_price || p.normal_price).toFixed(2)} €
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-neutral-500">
                Aucune consultation enregistrée.
              </div>
            )}
          </div>
        </div>

        {/* 2. Produits avec le plus de clics WhatsApp */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/50 p-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <h3 className="font-display text-sm font-bold text-white">
                Plus de Clics WhatsApp
              </h3>
            </div>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Intentions d'achat
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {stats?.mostWhatsappProducts && stats.mostWhatsappProducts.length > 0 ? (
              stats.mostWhatsappProducts.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800/70 bg-neutral-950/40 p-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                      {idx + 1}
                    </span>
                    <img
                      src={p.cover}
                      alt={p.title}
                      className="h-10 w-7 rounded object-cover shadow-sm bg-neutral-950 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{p.title}</h4>
                      <p className="text-[11px] text-neutral-400 truncate">{p.author}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                      {p.whatsapp_clicks_count} {p.whatsapp_clicks_count > 1 ? 'clics' : 'clic'}
                    </div>
                    <span className="text-[10px] text-neutral-500">WhatsApp</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-neutral-500">
                Aucun clic WhatsApp enregistré.
              </div>
            )}
          </div>
        </div>

        {/* 3. Catégories les plus consultées */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/50 p-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              <h3 className="font-display text-sm font-bold text-white">
                Catégories Consultées
              </h3>
            </div>
            <button
              onClick={() => setActiveAdminTab('categories')}
              className="text-[11px] font-medium text-amber-500 hover:text-amber-400"
            >
              Gérer ({categories.length})
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {stats?.mostViewedCategories && stats.mostViewedCategories.length > 0 ? (
              stats.mostViewedCategories.map((c, idx) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800/70 bg-neutral-950/40 p-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-bold text-neutral-400">
                      {idx + 1}
                    </span>
                    <span className="text-xl shrink-0">{c.icon || '📚'}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{c.name}</h4>
                      <p className="text-[10px] font-mono text-neutral-500 truncate">/{c.slug}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                      {c.views_count} {c.views_count > 1 ? 'vues' : 'vue'}
                    </div>
                    <span className="text-[10px] text-neutral-500">interactions</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-neutral-500">
                Aucune donnée de catégorie disponible.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Event Stream / Activity Log */}
      <div className="rounded-xl border border-neutral-850 bg-neutral-900/40 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" />
              <h3 className="font-display text-base font-semibold text-white">
                Journal d'Activité en Direct
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-neutral-400">
              Derniers événements capturés en direct dans la table <code className="font-mono text-amber-400">analytics_events</code>
            </p>
          </div>
          <div className="text-xs text-neutral-400 font-mono">
            Enregistrement automatique
          </div>
        </div>

        <div className="mt-4 divide-y divide-neutral-800/60">
          {stats?.recentEvents && stats.recentEvents.length > 0 ? (
            stats.recentEvents.map((ev) => {
              const meta = formatEventType(ev.event_type);
              const eventDate = new Date(ev.created_at);
              const formattedTime = !isNaN(eventDate.getTime())
                ? eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : ev.created_at;

              return (
                <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-400 truncate max-w-xs sm:max-w-md">
                      {ev.product_title ? `« ${ev.product_title} »` : ev.lead_name ? `Prospect : ${ev.lead_name}` : ev.page}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-neutral-500 text-[11px]">
                    <span className="font-mono truncate max-w-[120px] text-neutral-500">
                      {ev.page}
                    </span>
                    <span className="tabular-nums font-mono text-neutral-400 whitespace-nowrap">
                      {formattedTime}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-neutral-500">
              Aucun événement récent enregistré.
            </div>
          )}
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="rounded-xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 p-6">
        <h3 className="font-display text-sm font-semibold text-white">Gestion & Accès Rapides</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Pilotez l'ensemble du catalogue VISION BOOKS et les intégrations actives.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveAdminTab('produits')}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un Livre Audio</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('categories')}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 active:scale-95 transition-all"
          >
            <Layers className="h-4 w-4" />
            <span>Gérer les Catégories</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('leads')}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 active:scale-95 transition-all"
          >
            <Users className="h-4 w-4" />
            <span>Voir les Prospects ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('lead-magnets')}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Gérer les Lead Magnets</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('parametres')}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 active:scale-95 transition-all"
          >
            <span>Paramètres WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

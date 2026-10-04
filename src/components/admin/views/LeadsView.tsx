import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  MessageCircle,
  Calendar,
  Gift,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  X,
  PhoneCall,
  Sparkles,
  Eye,
  Copy,
  ExternalLink,
  Clock,
  Send,
  AlertCircle,
  RefreshCw,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Lead } from '../../../types';
import { api } from '../../../services/api';

// Helper to format date and time separately
function parseLeadDateTime(rawDate?: string) {
  if (!rawDate) return { date: '—', time: '—' };
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const date = d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const time = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return { date, time };
    }
  } catch {}

  if (rawDate.includes(' ')) {
    const parts = rawDate.split(' ');
    return { date: parts[0] || '—', time: parts[1] || '—' };
  }
  return { date: rawDate, time: '—' };
}

export const LeadsView: React.FC = () => {
  const { leads, addLead, deleteLead, leadMagnets, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [leadMagnetFilter, setLeadMagnetFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Lead Detail & AI Modal State
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // New Lead form state
  const [firstName, setFirstName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedLeadMagnetId, setSelectedLeadMagnetId] = useState(leadMagnets[0]?.id || '');
  const [source, setSource] = useState('Saisie Manuelle Admin');

  const filteredLeads = leads.filter((l) => {
    const leadFirstName = l.first_name || l.name || '';
    const leadWhatsapp = l.whatsapp || l.phone || '';
    const leadSource = l.source || '';
    const leadLmTitle = l.lead_magnet_title || '';

    const matchesSearch =
      leadFirstName.toLowerCase().includes(search.toLowerCase()) ||
      leadWhatsapp.toLowerCase().includes(search.toLowerCase()) ||
      leadSource.toLowerCase().includes(search.toLowerCase()) ||
      leadLmTitle.toLowerCase().includes(search.toLowerCase());

    const matchesLm =
      leadMagnetFilter === 'all' ||
      l.lead_magnet_id === leadMagnetFilter ||
      (l.lead_magnet_title && l.lead_magnet_title.toLowerCase().includes(leadMagnetFilter.toLowerCase()));

    return matchesSearch && matchesLm;
  });

  const handleCopyWhatsapp = (phone: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedNumber(phone);
      showToast(`Numéro ${phone} copié dans le presse-papier !`, 'success');
      setTimeout(() => setCopiedNumber(null), 2500);
    }
  };

  const handleCopyMessage = () => {
    if (!aiMessage) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(aiMessage);
      setCopiedMessage(true);
      showToast('Message de relance copié !', 'success');
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  const handleGenerateAiMessage = async (lead: Lead) => {
    setGeneratingAi(true);
    try {
      const res = await api.generateLeadFollowUpAI({
        first_name: lead.first_name || lead.name || 'Cher lecteur',
        whatsapp: lead.whatsapp || lead.phone || '',
        lead_magnet_title: lead.lead_magnet_title || 'notre guide offert',
        lead_id: lead.id,
      });
      setAiMessage(res.message);
      showToast('Message de relance IA généré avec succès !', 'success');
    } catch (err: any) {
      console.error('Error generating AI message:', err);
      // Fallback message
      const cleanName = lead.first_name || lead.name || 'Cher lecteur';
      const cleanLm = lead.lead_magnet_title || 'notre guide offert';
      setAiMessage(
        `Bonjour ${cleanName} ! 🎧 J'espère que vous allez bien.\n\nJe fais suite à votre téléchargement de « ${cleanLm} » sur VISION BOOKS.\n\nAvez-vous eu l'opportunité de parcourir les premières clés stratégiques ?\n\nSi vous souhaitez approfondir le sujet, notre collection audio complète propose des méthodologies avancées indispensables pour accélérer vos résultats. Je reste à votre écoute si vous avez des questions ! ✨`
      );
      showToast('Message généré avec modèle standard.', 'info');
    } finally {
      setGeneratingAi(false);
    }
  };

  const openLeadDetail = (lead: Lead, autoGenerateAi = false) => {
    setActiveLead(lead);
    setCopiedMessage(false);
    if (autoGenerateAi) {
      handleGenerateAiMessage(lead);
    } else {
      // Pre-fill a gentle default message or clear
      const cleanName = lead.first_name || lead.name || 'Cher lecteur';
      const cleanLm = lead.lead_magnet_title || 'votre guide offert';
      setAiMessage(
        `Bonjour ${cleanName} ! 🎧 Merci d'avoir téléchargé « ${cleanLm} » chez VISION BOOKS. Avez-vous eu le temps de découvrir les premiers conseils ? N'hésitez pas si vous avez des questions !`
      );
    }
  };

  const getWhatsAppUrl = (phoneNumber: string, customMessage?: string) => {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      customMessage || 'Bonjour, merci pour votre intérêt envers VISION BOOKS !'
    );
    return `https://wa.me/${cleaned}?text=${text}`;
  };

  const handleManualWhatsAppRelance = (lead: Lead) => {
    const phone = lead.whatsapp || lead.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      showToast('Numéro WhatsApp invalide', 'error');
      return;
    }
    const finalMsg = aiMessage.trim() || `Bonjour ${lead.first_name || ''} ! Merci d'avoir téléchargé notre guide VISION BOOKS.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMsg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !whatsapp.trim()) return;

    await addLead({
      first_name: firstName.trim(),
      whatsapp: whatsapp.trim(),
      lead_magnet_id: selectedLeadMagnetId || null,
      source: source || 'Saisie Manuelle',
    });

    setFirstName('');
    setWhatsapp('');
    setIsAddModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteLead(id);
    setDeleteConfirmId(null);
    if (activeLead?.id === id) {
      setActiveLead(null);
    }
  };

  const exportLeadsCsv = () => {
    const headers = ['Prénom', 'WhatsApp', 'Lead Magnet', 'Source', 'Date', 'Heure'];
    const rows = leads.map((l) => {
      const dt = parseLeadDateTime(l.created_at || l.createdAt);
      return [
        `"${l.first_name || l.name || ''}"`,
        `"${l.whatsapp || l.phone || ''}"`,
        `"${l.lead_magnet_title || 'Lead Magnet'}"`,
        `"${l.source || ''}"`,
        `"${dt.date}"`,
        `"${dt.time}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_visionbooks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white">Gestion des Prospects & Leads</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              {leads.length} contacts
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Contacts capturés via les Lead Magnets. Relances WhatsApp manuelles assistées par IA.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportLeadsCsv}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-850 hover:text-white transition-colors"
            title="Exporter la liste au format CSV"
          >
            <Download className="h-3.5 w-3.5 text-neutral-400" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un prospect</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Total Contacts Capturés</span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
            {leads.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Prénoms et numéros WhatsApp qualifiés</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Canal de Relance</span>
            <MessageCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            WhatsApp Direct
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Envoi 100% manuel & sécurisé par l'administrateur</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Tunnels Actifs</span>
            <Gift className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
            {leadMagnets.filter((lm) => lm.active).length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Sources de capture génératrices</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par prénom, WhatsApp, source..."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 py-2 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Lead Magnet Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-neutral-500" />
          <select
            value={leadMagnetFilter}
            onChange={(e) => setLeadMagnetFilter(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 py-1.5 px-3 text-xs text-neutral-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Tous les Lead Magnets</option>
            {leadMagnets.map((lm) => (
              <option key={lm.id} value={lm.id}>
                {lm.title.slice(0, 36)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 12. ADMIN — LISTE DES LEADS AVEC COLONNES PRÉCISES */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
              <tr>
                <th className="py-3.5 pl-6 pr-3 font-semibold">Prénom</th>
                <th className="px-3 py-3.5 font-semibold">WhatsApp</th>
                <th className="px-3 py-3.5 font-semibold">Lead Magnet téléchargé</th>
                <th className="px-3 py-3.5 font-semibold">Date</th>
                <th className="px-3 py-3.5 font-semibold">Heure</th>
                <th className="px-3 py-3.5 font-semibold">Source</th>
                <th className="py-3.5 pl-3 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    Aucun prospect trouvé correspondant à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const leadName = lead.first_name || lead.name || 'Visiteur';
                  const leadPhone = lead.whatsapp || lead.phone || 'Non renseigné';
                  const dt = parseLeadDateTime(lead.created_at || lead.createdAt);
                  const leadSource = lead.source || 'Page de capture';
                  const leadLmName = lead.lead_magnet_title || 'Lead Magnet';
                  const isCopied = copiedNumber === leadPhone;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-neutral-900/70 transition-colors group cursor-pointer"
                      onClick={() => openLeadDetail(lead)}
                    >
                      {/* 1. Prénom */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs uppercase border border-amber-500/20 shrink-0">
                            {leadName.charAt(0)}
                          </div>
                          <span className="font-semibold text-white whitespace-nowrap">
                            {leadName}
                          </span>
                        </div>
                      </td>

                      {/* 2. WhatsApp + Action Rapide Copier */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-300">
                          <span className="tabular-nums whitespace-nowrap">{leadPhone}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyWhatsapp(leadPhone, e)}
                            className="rounded p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                            title="Copier le numéro WhatsApp"
                          >
                            {isCopied ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 3. Lead Magnet téléchargé */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Gift className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span
                            className="font-medium text-white max-w-[200px] truncate"
                            title={leadLmName}
                          >
                            {leadLmName}
                          </span>
                        </div>
                      </td>

                      {/* 4. Date */}
                      <td className="px-3 py-3.5 text-neutral-400 font-mono text-[11px] tabular-nums whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-neutral-500" />
                          <span>{dt.date}</span>
                        </div>
                      </td>

                      {/* 5. Heure */}
                      <td className="px-3 py-3.5 text-neutral-400 font-mono text-[11px] tabular-nums whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-neutral-500" />
                          <span>{dt.time}</span>
                        </div>
                      </td>

                      {/* 6. Source */}
                      <td className="px-3 py-3.5">
                        <span
                          className="inline-block max-w-[140px] truncate rounded bg-neutral-800/80 px-2 py-0.5 font-mono text-[10px] text-neutral-300 border border-neutral-700"
                          title={leadSource}
                        >
                          {leadSource}
                        </span>
                      </td>

                      {/* 7. Actions requises : Voir, Copier WhatsApp, Générer message relance IA, Ouvrir WhatsApp */}
                      <td
                        className="py-3.5 pl-3 pr-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Voir */}
                          <button
                            type="button"
                            onClick={() => openLeadDetail(lead)}
                            className="inline-flex items-center gap-1 rounded bg-neutral-800 px-2 py-1 text-[11px] font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors border border-neutral-700"
                            title="Voir la fiche complète du lead"
                          >
                            <Eye className="h-3 w-3 text-neutral-400" />
                            <span>Voir</span>
                          </button>

                          {/* Copier le numéro WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleCopyWhatsapp(leadPhone)}
                            className="rounded p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                            title="Copier le numéro WhatsApp"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {/* Générer un message de relance IA */}
                          <button
                            type="button"
                            onClick={() => openLeadDetail(lead, true)}
                            className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                            title="Générer un message de relance IA personnalisé"
                          >
                            <Sparkles className="h-3 w-3 text-amber-400" />
                            <span>Relance IA</span>
                          </button>

                          {/* Ouvrir WhatsApp */}
                          <a
                            href={getWhatsAppUrl(leadPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                            title="Ouvrir WhatsApp directement"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </a>

                          {/* Supprimer */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(lead.id)}
                            className="rounded p-1 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Supprimer ce prospect"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================
          13. IA — MESSAGE DE RELANCE PERSONNALISÉ & FICHE DU LEAD
          14. BOUTON WHATSAPP POUR RELANCE MANUELLE
      ================================================== */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-7 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">
                      Fiche Prospect — {activeLead.first_name || activeLead.name || 'Visiteur'}
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Informations capturées et générateur de relance WhatsApp assisté par IA.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveLead(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Prospect Data Summary */}
            <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">Prénom</span>
                <span className="font-semibold text-white text-sm">
                  {activeLead.first_name || activeLead.name || '—'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Numéro WhatsApp</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-sm text-emerald-400 font-semibold">
                    {activeLead.whatsapp || activeLead.phone || '—'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyWhatsapp(activeLead.whatsapp || activeLead.phone || '')}
                    className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300 hover:bg-neutral-700"
                    title="Copier le numéro"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copier</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Lead Magnet téléchargé</span>
                <span className="font-medium text-amber-400 flex items-center gap-1.5 mt-0.5">
                  <Gift className="h-3.5 w-3.5 shrink-0" />
                  <span>{activeLead.lead_magnet_title || 'Lead Magnet'}</span>
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Date & Heure d'inscription</span>
                <span className="font-mono text-neutral-300 mt-0.5 block">
                  {parseLeadDateTime(activeLead.created_at || activeLead.createdAt).date} à{' '}
                  {parseLeadDateTime(activeLead.created_at || activeLead.createdAt).time}
                </span>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">Source :</span>
                <span className="font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  {activeLead.source || 'Page de capture'}
                </span>
              </div>
            </div>

            {/* 13. IA — SECTION DE GÉNÉRATION DE MESSAGE DE RELANCE */}
            <div className="rounded-xl border border-amber-500/30 bg-neutral-900/60 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-neutral-950">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white">
                      Message de Relance Personnalisé (IA)
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Généré sur mesure pour « {activeLead.lead_magnet_title || 'Lead Magnet'} »
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={generatingAi}
                  onClick={() => handleGenerateAiMessage(activeLead)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  {generatingAi ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Génération IA en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>{aiMessage ? 'Régénérer avec l\'IA' : 'Générer le texte IA'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Editable Textarea */}
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                  <span className="font-medium text-neutral-300">
                    Texte du message WhatsApp (Modifiable) :
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {aiMessage.length} caractères
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="Cliquez sur « Générer avec l'IA » pour créer un message sur mesure..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
                />
              </div>

              {/* Action Buttons for AI Message */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  disabled={!aiMessage.trim()}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors disabled:opacity-50"
                  title="Copier le message dans le presse-papier"
                >
                  {copiedMessage ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Message copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-neutral-400" />
                      <span>Copier le message</span>
                    </>
                  )}
                </button>

                {/* 14. BOUTON EXACT REQUIS : « Relancer sur WhatsApp » */}
                <button
                  type="button"
                  onClick={() => handleManualWhatsAppRelance(activeLead)}
                  disabled={!aiMessage.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  title="Ouvrir WhatsApp avec le message pré-rempli pour envoi manuel"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Relancer sur WhatsApp</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              {/* Reassurance Alert on 100% Manual Transmission */}
              <div className="rounded-lg bg-neutral-950/70 border border-neutral-800 p-3 flex items-start gap-2.5 text-[11px] text-neutral-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-neutral-300">Envoi 100% manuel & sécurisé :</span>{' '}
                  L’IA génère uniquement la proposition de texte. Aucun message n'est envoyé automatiquement.
                  Vous conservez la liberté totale de relire, d’ajuster et de déclencher l'envoi depuis votre propre compte WhatsApp.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs text-neutral-500">
              <span className="font-mono text-[11px]">ID : {activeLead.id}</span>
              <button
                type="button"
                onClick={() => setActiveLead(null)}
                className="rounded-lg border border-neutral-800 px-4 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
            <h3 className="font-display text-base font-bold text-white">
              Supprimer ce prospect ?
            </h3>
            <p className="mt-2 text-xs text-neutral-400">
              Cette entrée sera retirée définitivement de votre base de données des leads.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-neutral-800 px-3.5 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Users className="h-4 w-4" />
              <span>Nouveau Prospect</span>
            </div>

            <h2 className="mt-2 font-display text-xl font-bold text-white">
              Ajouter un prospect
            </h2>

            <form onSubmit={handleAddLead} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300">Prénom *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex : Ousmane"
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300">Numéro WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex : +221 77 123 45 67 ou +33 6 12 34 56 78"
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300">Lead Magnet téléchargé</label>
                <select
                  value={selectedLeadMagnetId}
                  onChange={(e) => setSelectedLeadMagnetId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Aucun (Contact Direct)</option>
                  {leadMagnets.map((lm) => (
                    <option key={lm.id} value={lm.id}>
                      {lm.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-300">Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Ex : Inscription directe, Instagram, WhatsApp..."
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-neutral-800 px-4 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2 font-semibold text-neutral-950 hover:bg-amber-400"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Enregistrer le prospect</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

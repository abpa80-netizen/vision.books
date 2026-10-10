import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Eye,
  Copy,
  ExternalLink,
  Clock,
  RefreshCw,
  Edit3,
  Save,
  Check,
  ShieldCheck,
  BookOpen,
  AlertCircle,
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
  const {
    leads,
    isLoadingLeads,
    leadsError,
    refreshLeads,
    addLead,
    deleteLead,
    updateLeadData,
    leadMagnets,
    showToast,
    settings,
  } = useApp();
  const [search, setSearch] = useState('');
  const [leadMagnetFilter, setLeadMagnetFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [addLeadError, setAddLeadError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto-refresh from Firestore on component mount
  useEffect(() => {
    refreshLeads();
  }, [refreshLeads]);

  // Sequence Modal State
  const [activeSequenceLead, setActiveSequenceLead] = useState<Lead | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<'all' | 'J1' | 'J2' | 'J3'>('all');
  const [generatingStep, setGeneratingStep] = useState<string | null>(null); // 'all' | 'J1' | 'J2' | 'J3' | null
  const [editingStep, setEditingStep] = useState<'J1' | 'J2' | 'J3' | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Lead Detail Profile Modal State (Basic info)
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  // New Lead form state
  const [firstName, setFirstName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedLeadMagnetId, setSelectedLeadMagnetId] = useState(leadMagnets[0]?.id || '');
  const [source, setSource] = useState('Saisie Manuelle Admin');

  // Filtered Leads
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

  const cleanPhoneNumber = (phone: string) => phone.replace(/[^0-9]/g, '');

  const handleCopyWhatsapp = (phone: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedNumber(phone);
      showToast(`Numéro ${phone} copié dans le presse-papier !`, 'success');
      setTimeout(() => setCopiedNumber(null), 2500);
    }
  };

  const handleCopyStepText = (step: 'J1' | 'J2' | 'J3', text: string) => {
    if (!text.trim()) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedStep(step);
      showToast(`Message ${step} copié dans le presse-papier !`, 'success');
      setTimeout(() => setCopiedStep(null), 2500);
    }
  };

  // Open WhatsApp with pre-filled message
  const handleOpenWhatsAppStep = async (lead: Lead, step: 'J1' | 'J2' | 'J3', messageText: string) => {
    const phone = lead.whatsapp || lead.phone || settings?.whatsapp_number || settings?.whatsapp || '';
    const cleaned = cleanPhoneNumber(phone);
    if (!cleaned) {
      showToast('Numéro WhatsApp invalide', 'error');
      return;
    }

    if (!messageText.trim()) {
      showToast(`Veuillez d'abord générer le message ${step}.`, 'error');
      return;
    }

    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(messageText.trim())}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    // Mark step as 'envoye'
    const statusField = `followup_status_${step.toLowerCase()}` as 'followup_status_j1' | 'followup_status_j2' | 'followup_status_j3';
    const updates = { [statusField]: 'envoye' as const, followup_updated_at: new Date().toISOString() };
    await updateLeadData(lead.id, updates);

    // Update active modal state
    if (activeSequenceLead && activeSequenceLead.id === lead.id) {
      setActiveSequenceLead((prev) => (prev ? { ...prev, ...updates } : null));
    }

    showToast(`WhatsApp ouvert pour ${lead.first_name || 'le prospect'}. Statut ${step} marqué comme envoyé.`, 'success');
  };

  // Generate Entire Sequence (J1, J2, J3)
  const handleGenerateFullSequence = async (lead: Lead) => {
    setGeneratingStep('all');
    try {
      const res = await api.generateLeadSequenceAI({
        lead_id: lead.id,
        first_name: lead.first_name || lead.name || 'Cher lecteur',
        whatsapp: lead.whatsapp || lead.phone || '',
        lead_magnet_id: lead.lead_magnet_id || null,
        lead_magnet_title: lead.lead_magnet_title || 'Guide offert',
        step: 'all',
      });

      const updates: Partial<Lead> = {
        followup_j1: res.j1,
        followup_j2: res.j2,
        followup_j3: res.j3,
        followup_generated_at: res.generated_at,
        followup_updated_at: res.generated_at,
        followup_status_j1: lead.followup_status_j1 || 'a_envoyer',
        followup_status_j2: lead.followup_status_j2 || 'a_envoyer',
        followup_status_j3: lead.followup_status_j3 || 'a_envoyer',
      };

      await updateLeadData(lead.id, updates);

      if (activeSequenceLead && activeSequenceLead.id === lead.id) {
        setActiveSequenceLead((prev) => (prev ? { ...prev, ...updates } : null));
      }

      showToast('Séquence J1, J2 et J3 générée avec succès avec Gemini !', 'success');
    } catch (err: any) {
      console.error('Error generating full sequence:', err);
      showToast('Erreur lors de la génération de la séquence.', 'error');
    } finally {
      setGeneratingStep(null);
    }
  };

  // Regenerate Single Step (J1, J2, or J3)
  const handleRegenerateStep = async (lead: Lead, step: 'J1' | 'J2' | 'J3') => {
    setGeneratingStep(step);
    try {
      const res = await api.generateLeadSequenceAI({
        lead_id: lead.id,
        first_name: lead.first_name || lead.name || 'Cher lecteur',
        whatsapp: lead.whatsapp || lead.phone || '',
        lead_magnet_id: lead.lead_magnet_id || null,
        lead_magnet_title: lead.lead_magnet_title || 'Guide offert',
        step,
      });

      const field = `followup_${step.toLowerCase()}` as 'followup_j1' | 'followup_j2' | 'followup_j3';
      const newText = step === 'J1' ? res.j1 : step === 'J2' ? res.j2 : res.j3;

      const updates: Partial<Lead> = {
        [field]: newText,
        followup_updated_at: res.generated_at,
      };

      await updateLeadData(lead.id, updates);

      if (activeSequenceLead && activeSequenceLead.id === lead.id) {
        setActiveSequenceLead((prev) => (prev ? { ...prev, ...updates } : null));
      }

      showToast(`Message ${step} régénéré avec succès !`, 'success');
    } catch (err: any) {
      console.error(`Error regenerating step ${step}:`, err);
      showToast(`Erreur lors de la régénération du message ${step}.`, 'error');
    } finally {
      setGeneratingStep(null);
    }
  };

  // Start Editing Step
  const handleStartEdit = (step: 'J1' | 'J2' | 'J3', currentText: string) => {
    setEditingStep(step);
    setEditDraft(currentText);
  };

  // Save Edited Step
  const handleSaveEdit = async (lead: Lead, step: 'J1' | 'J2' | 'J3') => {
    const field = `followup_${step.toLowerCase()}` as 'followup_j1' | 'followup_j2' | 'followup_j3';
    const updates: Partial<Lead> = {
      [field]: editDraft.trim(),
      followup_updated_at: new Date().toISOString(),
    };

    await updateLeadData(lead.id, updates);

    if (activeSequenceLead && activeSequenceLead.id === lead.id) {
      setActiveSequenceLead((prev) => (prev ? { ...prev, ...updates } : null));
    }

    setEditingStep(null);
    setEditDraft('');
    showToast(`Message ${step} enregistré avec succès !`, 'success');
  };

  // Toggle step status
  const handleToggleStepStatus = async (lead: Lead, step: 'J1' | 'J2' | 'J3') => {
    const statusField = `followup_status_${step.toLowerCase()}` as 'followup_status_j1' | 'followup_status_j2' | 'followup_status_j3';
    const current = (lead as any)[statusField] || 'a_envoyer';
    const nextStatus = current === 'envoye' ? 'a_envoyer' : 'envoye';

    const updates = {
      [statusField]: nextStatus,
      followup_updated_at: new Date().toISOString(),
    };

    await updateLeadData(lead.id, updates);

    if (activeSequenceLead && activeSequenceLead.id === lead.id) {
      setActiveSequenceLead((prev) => (prev ? { ...prev, ...updates } : null));
    }

    showToast(`Statut ${step} mis à jour : ${nextStatus === 'envoye' ? 'Envoyé' : 'À envoyer'}`, 'info');
  };

  // Open Sequence Modal on specific tab
  const openSequenceModal = (lead: Lead, stepTab: 'all' | 'J1' | 'J2' | 'J3' = 'all') => {
    setActiveSequenceLead(lead);
    setActiveStepTab(stepTab);
    setEditingStep(null);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !whatsapp.trim()) return;

    setIsSubmittingLead(true);
    setAddLeadError(null);
    try {
      await addLead({
        first_name: firstName.trim(),
        whatsapp: whatsapp.trim(),
        lead_magnet_id: selectedLeadMagnetId || null,
        source: source || 'Saisie Manuelle Admin',
      });

      setFirstName('');
      setWhatsapp('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Error adding lead in admin:', err);
      setAddLeadError(err.message || 'Erreur lors de l\'enregistrement dans Firestore.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteLead(id);
    setDeleteConfirmId(null);
    if (activeSequenceLead?.id === id) setActiveSequenceLead(null);
    if (detailLead?.id === id) setDetailLead(null);
  };

  const exportLeadsCsv = () => {
    const headers = ['Prénom', 'WhatsApp', 'Lead Magnet', 'Source', 'Date', 'Heure', 'Statut J1', 'Statut J2', 'Statut J3'];
    const rows = leads.map((l) => {
      const dt = parseLeadDateTime(l.created_at || l.createdAt);
      return [
        `"${l.first_name || l.name || ''}"`,
        `"${l.whatsapp || l.phone || ''}"`,
        `"${l.lead_magnet_title || 'Lead Magnet'}"`,
        `"${l.source || ''}"`,
        `"${dt.date}"`,
        `"${dt.time}"`,
        `"${l.followup_status_j1 || 'a_envoyer'}"`,
        `"${l.followup_status_j2 || 'a_envoyer'}"`,
        `"${l.followup_status_j3 || 'a_envoyer'}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
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
            <h1 className="font-display text-2xl font-bold text-white">Gestion des Prospects & Relances IA</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              {leads.length} contacts
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Générateur de séquences marketing personnalisées J1, J2, J3 via Gemini pour chaque prospect ayant téléchargé un Lead Magnet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refreshLeads()}
            disabled={isLoadingLeads}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-850 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Recharger les prospects directement depuis Firestore"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isLoadingLeads ? 'animate-spin' : ''}`} />
            <span>Rafraîchir</span>
          </button>

          <button
            onClick={exportLeadsCsv}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-850 hover:text-white transition-colors cursor-pointer"
            title="Exporter la liste au format CSV"
          >
            <Download className="h-3.5 w-3.5 text-neutral-400" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={() => {
              setAddLeadError(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un prospect</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {leadsError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{leadsError}</span>
          </div>
          <button
            onClick={() => refreshLeads()}
            className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/30 transition-colors cursor-pointer shrink-0"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* KPI Cards */}
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
            <span>Séquences J1, J2, J3 Générées</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-amber-400">
            {leads.filter((l) => l.followup_j1 && l.followup_j2 && l.followup_j3).length} / {leads.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Prêtes à être envoyées manuellement</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Tunnels Lead Magnets Actifs</span>
            <Gift className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
            {leadMagnets.filter((lm) => lm.active).length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Sources de capture génératrices</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par prénom, WhatsApp, Lead Magnet..."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 py-2 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-neutral-500" />
          <select
            value={leadMagnetFilter}
            onChange={(e) => setLeadMagnetFilter(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 py-1.5 px-3 text-xs text-neutral-300 focus:border-amber-500 focus:outline-none cursor-pointer"
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

      {/* TABLEAU DES LEADS AVEC COLONNES DEMANDÉES */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
              <tr>
                <th className="py-3.5 pl-6 pr-3 font-semibold">Prénom</th>
                <th className="px-3 py-3.5 font-semibold">WhatsApp</th>
                <th className="px-3 py-3.5 font-semibold">Lead Magnet téléchargé</th>
                <th className="px-3 py-3.5 font-semibold">Date & Heure</th>
                <th className="px-3 py-3.5 font-semibold">Statut de relance</th>
                <th className="px-3 py-3.5 font-semibold text-center">Boutons J1, J2, J3</th>
                <th className="py-3.5 pl-3 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {isLoadingLeads ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <RefreshCw className="h-6 w-6 text-amber-500 animate-spin" />
                      <span className="text-xs text-neutral-300 font-medium">Chargement des prospects depuis Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="max-w-md mx-auto space-y-3 px-4">
                      <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-bold text-white">Aucun prospect enregistré dans Firestore</h3>
                      <p className="text-xs text-neutral-400">
                        Dès qu'un visiteur télécharge un Lead Magnet sur le site ou que vous ajoutez un contact, il sera sauvegardé ici de manière permanente et disponible pour générer la séquence de relances J1, J2, J3.
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAddLeadError(null);
                            setIsAddModalOpen(true);
                          }}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors cursor-pointer"
                        >
                          Ajouter un prospect
                        </button>
                        <button
                          type="button"
                          onClick={() => refreshLeads()}
                          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        >
                          Recharger
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400 space-y-2">
                    <p>Aucun prospect ne correspond à vos critères de recherche.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setLeadMagnetFilter('all');
                      }}
                      className="text-xs text-amber-400 hover:underline cursor-pointer"
                    >
                      Réinitialiser les filtres
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const leadName = lead.first_name || lead.name || 'Visiteur';
                  const leadPhone = lead.whatsapp || lead.phone || 'Non renseigné';
                  const dt = parseLeadDateTime(lead.created_at || lead.createdAt);
                  const leadLmName = lead.lead_magnet_title || 'Lead Magnet';
                  const isCopied = copiedNumber === leadPhone;

                  const hasJ1 = Boolean(lead.followup_j1?.trim());
                  const hasJ2 = Boolean(lead.followup_j2?.trim());
                  const hasJ3 = Boolean(lead.followup_j3?.trim());
                  const hasFullSequence = hasJ1 && hasJ2 && hasJ3;
                  const hasPartialSequence = (hasJ1 || hasJ2 || hasJ3) && !hasFullSequence;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-neutral-900/70 transition-colors group cursor-pointer"
                      onClick={() => openSequenceModal(lead, 'all')}
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
                            className="rounded p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer"
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

                      {/* 4. Date et heure du téléchargement */}
                      <td className="px-3 py-3.5 text-neutral-400 font-mono text-[11px] tabular-nums whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-neutral-500" />
                          <span>{dt.date}</span>
                          <span className="text-neutral-600">•</span>
                          <span>{dt.time}</span>
                        </div>
                      </td>

                      {/* 5. Statut de relance */}
                      <td className="px-3 py-3.5">
                        {hasFullSequence ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Séquence prête</span>
                            </span>
                          </div>
                        ) : hasPartialSequence ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                            <span>Partielle</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 border border-neutral-700 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                            <span>À générer</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Boutons J1, J2, J3 */}
                      <td
                        className="px-3 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1 bg-neutral-950/60 p-1 rounded-lg border border-neutral-800">
                          {/* Bouton J1 */}
                          <button
                            type="button"
                            onClick={() => openSequenceModal(lead, 'J1')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                              lead.followup_status_j1 === 'envoye'
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                                : hasJ1
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                            title={hasJ1 ? `Voir / Envoyer J1 (${lead.followup_status_j1 === 'envoye' ? 'Envoyé' : 'Prêt'})` : 'Générer J1'}
                          >
                            J1
                          </button>

                          {/* Bouton J2 */}
                          <button
                            type="button"
                            onClick={() => openSequenceModal(lead, 'J2')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                              lead.followup_status_j2 === 'envoye'
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                                : hasJ2
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                            title={hasJ2 ? `Voir / Envoyer J2 (${lead.followup_status_j2 === 'envoye' ? 'Envoyé' : 'Prêt'})` : 'Générer J2'}
                          >
                            J2
                          </button>

                          {/* Bouton J3 */}
                          <button
                            type="button"
                            onClick={() => openSequenceModal(lead, 'J3')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                              lead.followup_status_j3 === 'envoye'
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                                : hasJ3
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                            title={hasJ3 ? `Voir / Envoyer J3 (${lead.followup_status_j3 === 'envoye' ? 'Envoyé' : 'Prêt'})` : 'Générer J3'}
                          >
                            J3
                          </button>
                        </div>
                      </td>

                      {/* 7. Bouton « Générer les 3 relances » + Actions */}
                      <td
                        className="py-3.5 pl-3 pr-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Bouton « Générer les 3 relances » */}
                          <button
                            type="button"
                            disabled={generatingStep === 'all'}
                            onClick={() => openSequenceModal(lead, 'all')}
                            className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all cursor-pointer"
                            title="Ouvrir le générateur de séquence marketing J1, J2, J3"
                          >
                            <Sparkles className="h-3 w-3 text-amber-400" />
                            <span>{hasFullSequence ? 'Voir la séquence' : 'Générer les 3 relances'}</span>
                          </button>

                          {/* Voir fiche */}
                          <button
                            type="button"
                            onClick={() => setDetailLead(lead)}
                            className="rounded p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="Voir la fiche détaillée du prospect"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Supprimer */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(lead.id)}
                            className="rounded p-1 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
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

      {/* =========================================================================
          MODAL SÉQUENCE MARKETING IA J1, J2, J3 (INTERFACE DEMANDÉE PAR L'UTILISATEUR)
      ========================================================================= */}
      {activeSequenceLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative my-6 w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-neutral-800 bg-neutral-950 p-5 sm:p-7 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-bold shadow-md shadow-amber-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-white">
                      Séquence de Relances IA — {activeSequenceLead.first_name || activeSequenceLead.name || 'Prospect'}
                    </h2>
                    <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      J1 • J2 • J3
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                    <span>Lead Magnet :</span>
                    <strong className="text-neutral-200">
                      {activeSequenceLead.lead_magnet_title || 'Guide offert'}
                    </strong>
                    <span className="text-neutral-600">•</span>
                    <span className="font-mono text-emerald-400">{activeSequenceLead.whatsapp || activeSequenceLead.phone}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveSequenceLead(null);
                  setEditingStep(null);
                }}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
                title="Fermer la fenêtre"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Global Controls & Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-400 text-[11px]">Statut global :</span>
                {activeSequenceLead.followup_j1 && activeSequenceLead.followup_j2 && activeSequenceLead.followup_j3 ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Séquence complète prête</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Séquence non générée ou incomplète</span>
                  </span>
                )}
                {activeSequenceLead.followup_generated_at && (
                  <span className="text-[10px] text-neutral-500 font-mono hidden md:inline">
                    • Générée le {parseLeadDateTime(activeSequenceLead.followup_generated_at).date}
                  </span>
                )}
              </div>

              {/* Main Generation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={generatingStep === 'all'}
                  onClick={() => handleGenerateFullSequence(activeSequenceLead)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {generatingStep === 'all' ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Génération des 3 relances en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {activeSequenceLead.followup_j1 && activeSequenceLead.followup_j2 && activeSequenceLead.followup_j3
                          ? 'Régénérer la séquence'
                          : 'Générer les 3 relances'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tabs for Fast Filtering (All / J1 / J2 / J3) */}
            <div className="flex items-center gap-1 border-b border-neutral-800 pb-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveStepTab('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeStepTab === 'all' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Vue d'ensemble (J1, J2, J3)
              </button>
              <button
                type="button"
                onClick={() => setActiveStepTab('J1')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeStepTab === 'J1' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                J1 — Valeur & Éducation
              </button>
              <button
                type="button"
                onClick={() => setActiveStepTab('J2')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeStepTab === 'J2' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                J2 — Histoire & Prise de conscience
              </button>
              <button
                type="button"
                onClick={() => setActiveStepTab('J3')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeStepTab === 'J3' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                J3 — Transition vers l'offre
              </button>
            </div>

            {/* SÉQUENCE DES RELANCES : CARTE POUR CHAQUE ÉTAPE */}
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {/* ==========================================
                  CARTE J1 — VALEUR ET ÉDUCATION
              ========================================== */}
              {(activeStepTab === 'all' || activeStepTab === 'J1') && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3 transition-all hover:border-neutral-750">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
                        J1
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          J1 — Valeur et Éducation
                        </h3>
                        <p className="text-[10px] text-neutral-400">
                          Message court et utile, directement lié au Lead Magnet (sans vente directe).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Statut Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStepStatus(activeSequenceLead, 'J1')}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors cursor-pointer ${
                          activeSequenceLead.followup_status_j1 === 'envoye'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-amber-500/40'
                        }`}
                        title="Cliquer pour changer le statut d'envoi"
                      >
                        {activeSequenceLead.followup_status_j1 === 'envoye' ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Envoyé</span>
                          </>
                        ) : (
                          <span>À envoyer</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Message Body or Editing Textarea */}
                  {editingStep === 'J1' ? (
                    <div className="space-y-2">
                      <textarea
                        rows={5}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        className="w-full rounded-xl border border-amber-500/50 bg-neutral-950 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
                        placeholder="Rédigez ou modifiez le message J1..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingStep(null)}
                          className="px-3 py-1 text-xs text-neutral-400 hover:text-white transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(activeSequenceLead, 'J1')}
                          className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors"
                        >
                          <Save className="h-3 w-3" />
                          <span>Enregistrer</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/80 p-3.5 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {activeSequenceLead.followup_j1 ? (
                        activeSequenceLead.followup_j1
                      ) : (
                        <span className="text-neutral-500 italic">
                          Message J1 non encore généré. Cliquez sur « Générer » ci-dessous pour le créer avec l'IA.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons for J1: [Modifier] [Régénérer] [Copier] [Ouvrir WhatsApp] */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {/* [Modifier] */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit('J1', activeSequenceLead.followup_j1 || '')}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-750 hover:text-white transition-colors cursor-pointer"
                        title="Modifier le texte du message J1"
                      >
                        <Edit3 className="h-3 w-3 text-neutral-400" />
                        <span>Modifier</span>
                      </button>

                      {/* [Régénérer] */}
                      <button
                        type="button"
                        disabled={generatingStep === 'J1'}
                        onClick={() => handleRegenerateStep(activeSequenceLead, 'J1')}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-750 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Régénérer uniquement ce message avec Gemini"
                      >
                        <RefreshCw className={`h-3 w-3 text-amber-400 ${generatingStep === 'J1' ? 'animate-spin' : ''}`} />
                        <span>Régénérer</span>
                      </button>

                      {/* [Copier] */}
                      <button
                        type="button"
                        disabled={!activeSequenceLead.followup_j1}
                        onClick={() => handleCopyStepText('J1', activeSequenceLead.followup_j1 || '')}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-750 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                        title="Copier le message J1"
                      >
                        {copiedStep === 'J1' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-neutral-400" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* [Ouvrir WhatsApp] */}
                    <button
                      type="button"
                      disabled={!activeSequenceLead.followup_j1}
                      onClick={() => handleOpenWhatsAppStep(activeSequenceLead, 'J1', activeSequenceLead.followup_j1 || '')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                      title="Ouvrir WhatsApp avec le message J1 prérempli"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Ouvrir WhatsApp</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ==========================================
                  CARTE J2 — HISTOIRE ET PRISE DE CONSCIENCE
              ========================================== */}
              {(activeStepTab === 'all' || activeStepTab === 'J2') && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3 transition-all hover:border-neutral-750">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                        J2
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          J2 — Histoire et Prise de Conscience
                        </h3>
                        <p className="text-[10px] text-neutral-400">
                          Courte anecdote ou situation concrète crédible, terminée par une question de réflexion.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStepStatus(activeSequenceLead, 'J2')}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors cursor-pointer ${
                          activeSequenceLead.followup_status_j2 === 'envoye'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-amber-500/40'
                        }`}
                        title="Cliquer pour changer le statut d'envoi"
                      >
                        {activeSequenceLead.followup_status_j2 === 'envoye' ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Envoyé</span>
                          </>
                        ) : (
                          <span>À envoyer</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {editingStep === 'J2' ? (
                    <div className="space-y-2">
                      <textarea
                        rows={5}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        className="w-full rounded-xl border border-amber-500/50 bg-neutral-950 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
                        placeholder="Rédigez ou modifiez le message J2..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingStep(null)}
                          className="px-3 py-1 text-xs text-neutral-400 hover:text-white transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(activeSequenceLead, 'J2')}
                          className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors"
                        >
                          <Save className="h-3 w-3" />
                          <span>Enregistrer</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/80 p-3.5 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {activeSequenceLead.followup_j2 ? (
                        activeSequenceLead.followup_j2
                      ) : (
                        <span className="text-neutral-500 italic">
                          Message J2 non encore généré. Cliquez sur « Générer » ci-dessous pour le créer avec l'IA.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons for J2 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit('J2', activeSequenceLead.followup_j2 || '')}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-750 hover:text-white transition-colors cursor-pointer"
                        title="Modifier le texte du message J2"
                      >
                        <Edit3 className="h-3 w-3 text-neutral-400" />
                        <span>Modifier</span>
                      </button>

                      <button
                        type="button"
                        disabled={generatingStep === 'J2'}
                        onClick={() => handleRegenerateStep(activeSequenceLead, 'J2')}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-750 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Régénérer uniquement ce message avec Gemini"
                      >
                        <RefreshCw className={`h-3 w-3 text-amber-400 ${generatingStep === 'J2' ? 'animate-spin' : ''}`} />
                        <span>Régénérer</span>
                      </button>

                      <button
                        type="button"
                        disabled={!activeSequenceLead.followup_j2}
                        onClick={() => handleCopyStepText('J2', activeSequenceLead.followup_j2 || '')}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-750 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                        title="Copier le message J2"
                      >
                        {copiedStep === 'J2' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-neutral-400" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={!activeSequenceLead.followup_j2}
                      onClick={() => handleOpenWhatsAppStep(activeSequenceLead, 'J2', activeSequenceLead.followup_j2 || '')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                      title="Ouvrir WhatsApp avec le message J2 prérempli"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Ouvrir WhatsApp</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ==========================================
                  CARTE J3 — TRANSITION VERS L'OFFRE
              ========================================== */}
              {(activeStepTab === 'all' || activeStepTab === 'J3') && (
                <div className="rounded-xl border border-amber-500/30 bg-neutral-900/60 p-4 space-y-3 transition-all hover:border-amber-500/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                        J3
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>J3 — Transition vers l'offre</span>
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] text-amber-300 font-semibold border border-amber-500/30">
                            Recommandation Produit Réel
                          </span>
                        </h3>
                        <p className="text-[10px] text-neutral-400">
                          Apport de valeur final, présentation du livre audio adapté et invitation bienveillante sur WhatsApp.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStepStatus(activeSequenceLead, 'J3')}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors cursor-pointer ${
                          activeSequenceLead.followup_status_j3 === 'envoye'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-amber-500/40'
                        }`}
                        title="Cliquer pour changer le statut d'envoi"
                      >
                        {activeSequenceLead.followup_status_j3 === 'envoye' ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Envoyé</span>
                          </>
                        ) : (
                          <span>À envoyer</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {editingStep === 'J3' ? (
                    <div className="space-y-2">
                      <textarea
                        rows={6}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        className="w-full rounded-xl border border-amber-500/50 bg-neutral-950 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
                        placeholder="Rédigez ou modifiez le message J3..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingStep(null)}
                          className="px-3 py-1 text-xs text-neutral-400 hover:text-white transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(activeSequenceLead, 'J3')}
                          className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors"
                        >
                          <Save className="h-3 w-3" />
                          <span>Enregistrer</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/80 p-3.5 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {activeSequenceLead.followup_j3 ? (
                        activeSequenceLead.followup_j3
                      ) : (
                        <span className="text-neutral-500 italic">
                          Message J3 non encore généré. Cliquez sur « Générer » ci-dessous pour le créer avec l'IA.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons for J3 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit('J3', activeSequenceLead.followup_j3 || '')}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-750 hover:text-white transition-colors cursor-pointer"
                        title="Modifier le texte du message J3"
                      >
                        <Edit3 className="h-3 w-3 text-neutral-400" />
                        <span>Modifier</span>
                      </button>

                      <button
                        type="button"
                        disabled={generatingStep === 'J3'}
                        onClick={() => handleRegenerateStep(activeSequenceLead, 'J3')}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-750 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Régénérer uniquement ce message avec Gemini"
                      >
                        <RefreshCw className={`h-3 w-3 text-amber-400 ${generatingStep === 'J3' ? 'animate-spin' : ''}`} />
                        <span>Régénérer</span>
                      </button>

                      <button
                        type="button"
                        disabled={!activeSequenceLead.followup_j3}
                        onClick={() => handleCopyStepText('J3', activeSequenceLead.followup_j3 || '')}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-750 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                        title="Copier le message J3"
                      >
                        {copiedStep === 'J3' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-neutral-400" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={!activeSequenceLead.followup_j3}
                      onClick={() => handleOpenWhatsAppStep(activeSequenceLead, 'J3', activeSequenceLead.followup_j3 || '')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                      title="Ouvrir WhatsApp avec le message J3 prérempli"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Ouvrir WhatsApp</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reassurance Footer */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 flex items-start gap-2.5 text-[11px] text-neutral-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-neutral-200">Envoi WhatsApp 100% manuel & maîtrisé :</span> Les messages ne sont jamais envoyés automatiquement. Vous pouvez éditer, adapter et envoyer chaque message quand vous le souhaitez. Les messages sont persistés en temps réel dans votre base de données Firestore.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs text-neutral-500">
              <span className="font-mono text-[11px]">Contact : {activeSequenceLead.whatsapp}</span>
              <button
                type="button"
                onClick={() => {
                  setActiveSequenceLead(null);
                  setEditingStep(null);
                }}
                className="rounded-lg border border-neutral-800 px-4 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL FICHE DÉTAILLÉE DU PROSPECT (Consultation)
      ========================================================================= */}
      {detailLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Fiche Prospect — {detailLead.first_name || detailLead.name}
                  </h3>
                  <p className="text-xs text-neutral-400">Détails d'inscription et Lead Magnet</p>
                </div>
              </div>
              <button
                onClick={() => setDetailLead(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-neutral-850">
                <span className="text-neutral-400">Prénom :</span>
                <span className="font-semibold text-white">{detailLead.first_name || detailLead.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-850">
                <span className="text-neutral-400">WhatsApp :</span>
                <span className="font-mono text-emerald-400 font-semibold">{detailLead.whatsapp || detailLead.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-850">
                <span className="text-neutral-400">Lead Magnet :</span>
                <span className="font-medium text-amber-300">{detailLead.lead_magnet_title || 'Lead Magnet'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-850">
                <span className="text-neutral-400">Source :</span>
                <span className="font-mono text-neutral-300">{detailLead.source || 'Page de capture'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-850">
                <span className="text-neutral-400">Date & Heure :</span>
                <span className="font-mono text-neutral-300">
                  {parseLeadDateTime(detailLead.created_at || detailLead.createdAt).date} à {parseLeadDateTime(detailLead.created_at || detailLead.createdAt).time}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  const leadToOpen = detailLead;
                  setDetailLead(null);
                  openSequenceModal(leadToOpen, 'all');
                }}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ouvrir la séquence J1, J2, J3</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailLead(null)}
                className="rounded-lg border border-neutral-800 px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
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
            <h3 className="font-display text-base font-bold text-white">Supprimer ce prospect ?</h3>
            <p className="mt-2 text-xs text-neutral-400">
              Cette entrée et ses relances associées seront définitivement retirées de votre base de données.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-neutral-800 px-3.5 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500 cursor-pointer"
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
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Users className="h-4 w-4" />
              <span>Nouveau Prospect</span>
            </div>

            <h2 className="mt-2 font-display text-xl font-bold text-white">Ajouter un prospect</h2>

            {addLeadError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{addLeadError}</span>
              </div>
            )}

            <form onSubmit={handleAddLead} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300">Prénom *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmittingLead}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex : Ousmane"
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300">Numéro WhatsApp *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmittingLead}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex : +221 77 123 45 67 ou +33 6 12 34 56 78"
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300">Lead Magnet téléchargé</label>
                <select
                  disabled={isSubmittingLead}
                  value={selectedLeadMagnetId}
                  onChange={(e) => setSelectedLeadMagnetId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none cursor-pointer disabled:opacity-50"
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
                  disabled={isSubmittingLead}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Ex : Inscription directe, Instagram, WhatsApp..."
                  className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmittingLead}
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-neutral-800 px-4 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2 font-semibold text-neutral-950 hover:bg-amber-400 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLead ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Enregistrement Firestore...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Enregistrer dans Firestore</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

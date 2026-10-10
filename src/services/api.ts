import { Category, Product, VipPack, Lead, LeadMagnetMarketingContent, CategorySuggestion } from '../types';

export const api = {
  // File / Image upload
  async uploadFile(file: File): Promise<{ url: string; filename: string; size: number }> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        type: file.type,
        data: base64,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors du téléversement' }));
      throw new Error(err.error || 'Erreur lors du téléversement');
    }

    return res.json();
  },
  // Categories
  async getCategories(activeOnly = false): Promise<Category[]> {
    const res = await fetch(`/api/categories${activeOnly ? '?active_only=true' : ''}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des catégories');
    return res.json();
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la création de la catégorie');
    return res.json();
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour de la catégorie');
    return res.json();
  },

  async toggleCategory(id: string): Promise<Category> {
    const res = await fetch(`/api/categories/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Erreur lors du changement de statut de la catégorie');
    return res.json();
  },

  async deleteCategory(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erreur lors de la suppression de la catégorie');
    return res.json();
  },

  // Products
  async getProducts(activeOnly = false, category?: string): Promise<Product[]> {
    const params = new URLSearchParams();
    if (activeOnly) params.append('active_only', 'true');
    if (category && category !== 'all') params.append('category', category);

    const qs = params.toString();
    const res = await fetch(`/api/products${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des produits');
    return res.json();
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération du produit');
    return res.json();
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la création du produit');
    return res.json();
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour du produit');
    return res.json();
  },

  async toggleProductActive(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}/toggle-active`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Erreur lors du changement de statut du produit');
    return res.json();
  },

  async toggleProductBestSeller(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}/toggle-bestseller`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour Best-Seller');
    return res.json();
  },

  async deleteProduct(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erreur lors de la suppression du produit');
    return res.json();
  },

  async generateProductAI(params: {
    title: string;
    author: string;
    category?: string;
    bonus?: string;
    existing_categories?: Array<{ id: string; name: string; slug: string }>;
  }): Promise<{
    full_description: string;
    key_points: string[];
    bonus_presentation: string;
    short_description: string;
    cta_text: string;
    suggested_category?: CategorySuggestion;
  }> {
    const res = await fetch('/api/products/generate-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la génération IA du produit');
    }
    const json = await res.json();
    return json.data;
  },

  async generateLeadMagnetAI(params: {
    title?: string;
    topic?: string;
    target_audience?: string;
    raw_content?: string;
    field_to_regenerate?: string;
    existing_values?: Record<string, any>;
  }): Promise<LeadMagnetMarketingContent> {
    const res = await fetch('/api/lead-magnets/generate-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la génération IA du Lead Magnet');
    }
    const json = await res.json();
    return json.data;
  },

  // Lead Magnets
  async getLeadMagnets(activeOnly = false): Promise<any[]> {
    const res = await fetch(`/api/lead-magnets${activeOnly ? '?active_only=true' : ''}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des Lead Magnets');
    return res.json();
  },

  async getLeadMagnet(idOrSlug: string): Promise<any> {
    const res = await fetch(`/api/lead-magnets/${encodeURIComponent(idOrSlug)}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération du Lead Magnet');
    return res.json();
  },

  async createLeadMagnet(data: any): Promise<any> {
    const res = await fetch('/api/lead-magnets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la création du Lead Magnet');
    return res.json();
  },

  async updateLeadMagnet(id: string, data: any): Promise<any> {
    const res = await fetch(`/api/lead-magnets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour du Lead Magnet');
    return res.json();
  },

  async toggleLeadMagnet(id: string): Promise<any> {
    const res = await fetch(`/api/lead-magnets/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Erreur lors du changement de statut du Lead Magnet');
    return res.json();
  },

  async deleteLeadMagnet(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`/api/lead-magnets/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erreur lors de la suppression du Lead Magnet');
    return res.json();
  },

  async recordLeadMagnetDownload(idOrSlug: string): Promise<any> {
    const res = await fetch(`/api/lead-magnets/${encodeURIComponent(idOrSlug)}/download`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Erreur lors du téléchargement');
    return res.json();
  },

  // Leads
  async getLeads(): Promise<any[]> {
    const res = await fetch('/api/leads');
    if (!res.ok) throw new Error('Erreur lors de la récupération des leads');
    return res.json();
  },

  async createLead(data: {
    id?: string;
    first_name: string;
    whatsapp: string;
    lead_magnet_id?: string | null;
    source?: string;
  }): Promise<{ success: boolean; lead: any; download_url?: string }> {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors de l\'enregistrement' }));
      throw new Error(err.error || 'Erreur lors de l\'enregistrement du prospect');
    }
    return res.json();
  },

  async deleteLead(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erreur lors de la suppression du lead');
    return res.json();
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour du lead');
    return res.json();
  },

  async generateLeadSequenceAI(params: {
    first_name: string;
    whatsapp: string;
    lead_magnet_id?: string | null;
    lead_magnet_title?: string;
    lead_id?: string;
    step?: 'J1' | 'J2' | 'J3' | 'all';
  }): Promise<{
    success: boolean;
    j1: string;
    j2: string;
    j3: string;
    recommendedProduct?: any;
    generated_at: string;
  }> {
    const res = await fetch('/api/leads/generate-sequence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors de la génération de la séquence' }));
      throw new Error(err.error || 'Erreur lors de la génération de la séquence');
    }
    return res.json();
  },

  async generateLeadFollowUpAI(params: {
    first_name: string;
    whatsapp: string;
    lead_magnet_title?: string;
    lead_id?: string;
  }): Promise<{ message: string }> {
    const res = await fetch('/api/leads/generate-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors de la génération du message de relance' }));
      throw new Error(err.error || 'Erreur lors de la génération du message de relance');
    }
    return res.json();
  },

  // Settings
  async getSettings(): Promise<Record<string, string>> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Erreur lors de la récupération des paramètres');
    return res.json();
  },

  async updateSettings(data: Record<string, string>): Promise<Record<string, string>> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de l\'enregistrement des paramètres');
    return res.json();
  },

  async getWhatsAppOrderInfo(productIdOrSlug: string, origin?: string): Promise<{
    success: boolean;
    whatsapp_number: string;
    clean_number: string;
    message: string;
    whatsapp_url: string;
  }> {
    const url = `/api/order/whatsapp?product_id=${encodeURIComponent(productIdOrSlug)}${origin ? `&host=${encodeURIComponent(origin)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur lors de la génération du lien WhatsApp');
    return res.json();
  },

  // Analytics & Tracking
  async trackEvent(data: {
    event_type: string;
    product_id?: string | null;
    lead_id?: string | null;
    page: string;
    visitor_id?: string | null;
    metadata?: any;
  }): Promise<{ success: boolean; id: string }> {
    const res = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de l\'enregistrement de l\'événement');
    return res.json();
  },

  async getAnalyticsStats(range = 'all'): Promise<any> {
    const res = await fetch(`/api/analytics/stats?range=${encodeURIComponent(range)}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des statistiques');
    return res.json();
  },

  async getAnalyticsEvents(limit = 20): Promise<any[]> {
    const res = await fetch(`/api/analytics/events?limit=${limit}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des événements récents');
    return res.json();
  },

  // Blog API
  async getBlogPosts(publishedOnly = false): Promise<any[]> {
    const res = await fetch(`/api/blog${publishedOnly ? '?published_only=true' : ''}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des articles');
    return res.json();
  },

  async getBlogPost(idOrSlug: string): Promise<any> {
    const res = await fetch(`/api/blog/${encodeURIComponent(idOrSlug)}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération de l\'article');
    return res.json();
  },

  async createBlogPost(data: any): Promise<any> {
    const res = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la création de l\'article');
    }
    return res.json();
  },

  async updateBlogPost(id: string, data: any): Promise<any> {
    const res = await fetch(`/api/blog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la mise à jour de l\'article');
    }
    return res.json();
  },

  async toggleBlogPost(id: string): Promise<any> {
    const res = await fetch(`/api/blog/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Erreur lors du changement de statut de l\'article');
    return res.json();
  },

  async deleteBlogPost(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur lors de la suppression de l\'article');
    return res.json();
  },

  // Testimonials API
  async getTestimonials(activeOnly = false): Promise<any[]> {
    const res = await fetch(`/api/testimonials${activeOnly ? '?active_only=true' : ''}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des témoignages');
    return res.json();
  },

  async createTestimonial(data: any): Promise<any> {
    const res = await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la création du témoignage');
    }
    return res.json();
  },

  async updateTestimonial(id: string, data: any): Promise<any> {
    const res = await fetch(`/api/testimonials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la mise à jour du témoignage');
    }
    return res.json();
  },

  async toggleTestimonial(id: string): Promise<any> {
    const res = await fetch(`/api/testimonials/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Erreur lors du changement de statut du témoignage');
    return res.json();
  },

  async deleteTestimonial(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur lors de la suppression du témoignage');
    return res.json();
  },

  // VIP Pack
  async getVipPack(): Promise<VipPack | null> {
    const res = await fetch('/api/vip-pack');
    if (!res.ok) throw new Error('Erreur lors de la récupération du Pack VIP');
    return res.json();
  },

  async updateVipPack(data: Partial<VipPack>): Promise<VipPack> {
    const res = await fetch('/api/vip-pack', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la mise à jour du Pack VIP');
    }
    return res.json();
  },

  async toggleVipPack(): Promise<VipPack> {
    const res = await fetch('/api/vip-pack/toggle-active', { method: 'PATCH' });
    if (!res.ok) throw new Error('Erreur lors du changement de statut du Pack VIP');
    return res.json();
  },

  async deleteVipPack(): Promise<{ success: boolean }> {
    const res = await fetch('/api/vip-pack', { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur lors de la suppression du Pack VIP');
    return res.json();
  },

  // Gemini Commercial Assistant
  async chatWithAssistant(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<{
    message: string;
    suggestedProducts?: Array<{
      id: string;
      title: string;
      author: string;
      slug: string;
      cover?: string;
      category?: string;
      normal_price?: number;
      sale_price?: number | null;
    }>;
    whatsappNumber?: string;
    hasActiveVipPack?: boolean;
  }> {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la communication avec l’assistant');
    }
    return res.json();
  },
};

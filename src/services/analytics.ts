import { api } from './api';
import { AnalyticsEventType } from '../types';
import { trackAnalyticsEventInFirestore } from './firestoreService';

const VISITOR_ID_KEY = 'vb_visitor_id';

/**
 * Get or create a persistent anonymous visitor ID for traffic analysis.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = `vis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return `vis-${Date.now()}`;
  }
}

/**
 * Generic tracker that sends an event to SQLite backend.
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  options: {
    product_id?: string | null;
    lead_id?: string | null;
    page?: string;
    metadata?: any;
  } = {}
): Promise<void> {
  try {
    const visitor_id = getVisitorId();
    const page = options.page || (typeof window !== 'undefined' ? window.location.pathname : '/');

    await Promise.allSettled([
      api.trackEvent({
        event_type: eventType,
        product_id: options.product_id || null,
        lead_id: options.lead_id || null,
        page,
        visitor_id,
        metadata: options.metadata || {},
      }),
      trackAnalyticsEventInFirestore({
        event_type: eventType,
        product_id: options.product_id || null,
        lead_id: options.lead_id || null,
        page,
        visitor_id,
        metadata: options.metadata || {},
      }),
    ]);
  } catch (err) {
    // Non-blocking for client experience
    console.debug('[Analytics] Failed to track event:', eventType, err);
  }
}

// 1. Visite du site
export function trackSiteVisit(page?: string): void {
  trackEvent('site_visit', { page });
}

// 2. Visite d'une page produit
export function trackProductView(productId: string, page?: string): void {
  trackEvent('product_view', { product_id: productId, page });
}

// 3. Clic sur un produit
export function trackProductClick(productId: string, page?: string): void {
  trackEvent('product_click', { product_id: productId, page });
}

// 4. Clic sur « Commander sur WhatsApp »
export function trackWhatsAppClick(productId: string, page?: string): void {
  trackEvent('whatsapp_order_click', { product_id: productId, page });
}

// 5. Soumission du formulaire Lead Magnet
export function trackLeadSubmit(leadId: string, page?: string, metadata?: any): void {
  trackEvent('lead_form_submit', { lead_id: leadId, page, metadata });
}

// 6. Téléchargement d'un Lead Magnet
export function trackLeadMagnetDownload(leadIdOrMagnetId: string, page?: string): void {
  trackEvent('lead_magnet_download', { lead_id: leadIdOrMagnetId, page });
}

// 7. Visite de la page de capture Lead Magnet
export function trackLeadMagnetView(leadMagnetSlugOrId: string, page?: string): void {
  trackEvent('lead_magnet_view', { lead_id: leadMagnetSlugOrId, page });
}

// 8. Clic sur le bouton de téléchargement d'un Lead Magnet
export function trackLeadMagnetClick(leadMagnetSlugOrId: string, page?: string): void {
  trackEvent('lead_magnet_click', { lead_id: leadMagnetSlugOrId, page });
}

// 9. Début de saisie dans le formulaire de capture
export function trackLeadMagnetFormStart(leadMagnetSlugOrId: string, page?: string): void {
  trackEvent('lead_magnet_form_start', { lead_id: leadMagnetSlugOrId, page });
}

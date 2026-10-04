export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Optional convenience fields
  productCount?: number;
  featured?: boolean;
}

export interface Product {
  id: string;
  title: string;
  author: string;
  slug: string;
  cover: string;
  category: string; // Category slug or id
  normal_price: number;
  sale_price: number | null;
  short_description: string;
  full_description: string;
  key_points: string[];
  bonus: string;
  cta_text?: string;
  audio_url: string;
  audio_download_url?: string; // Private download URL for paid audiobook (strictly for admin, never shown to public)
  product_details?: string; // Content / details of the product
  product_url: string;
  is_best_seller: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Compatibility / convenience fields
  coverUrl?: string;
  categoryId?: string;
  duration?: string;
  narrator?: string;
  rating?: number;
  reviewsCount?: number;
  price?: number;
  originalPrice?: number;
  isBestSeller?: boolean;
  isNew?: boolean;
  summary?: string;
  audioPreviewUrl?: string;
  keyTakeaways?: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatarUrl?: string;
  avatar_url?: string;
  content: string;
  rating?: number;
  audiobookTitle?: string;
  audiobook_title?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category: string;
  author: string;
  date: string;
  readTime?: string;
  read_time?: string;
  imageUrl?: string;
  image_url?: string;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Lead {
  id: string;
  first_name: string;
  whatsapp: string;
  lead_magnet_id?: string | null;
  lead_magnet_title?: string;
  source: string;
  created_at: string;
  date?: string;
  time?: string;

  // Compatibility fields
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  status?: 'nouveau' | 'contacté' | 'converti';
  interestedCategory?: string;
}

export interface LeadMagnet {
  id: string;
  title: string;
  slug: string;
  image: string;
  description: string;
  file_url: string;
  active: boolean;
  created_at: string;

  // Optional and convenience fields
  subtitle?: string;
  marketing_content?: string;
  is_active?: boolean;
  download_url?: string;
  benefits?: string[] | string;
  downloads_count?: number;
  updated_at?: string;
  type?: 'PDF' | 'Audio' | 'Checklist' | string;
  downloadsCount?: number;
  status?: 'actif' | 'brouillon';
  associatedCategory?: string;
}

export interface VipPack {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  normal_price: number;
  sale_price: number | null;
  description: string;
  content: string; // List of inclusions / details
  cta_text: string;
  show_on_home: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AdminTab =
  | 'dashboard'
  | 'produits'
  | 'categories'
  | 'pack-vip'
  | 'leads'
  | 'lead-magnets'
  | 'temoignages'
  | 'blog'
  | 'parametres';

export interface AppSettings {
  whatsapp_number: string;
  platform_name: string;
  tagline: string;
  support_email: string;
  currency: string;
}

export type AnalyticsEventType =
  | 'site_visit'
  | 'product_view'
  | 'product_click'
  | 'whatsapp_order_click'
  | 'lead_form_submit'
  | 'lead_magnet_download'
  | string;

export interface AnalyticsEvent {
  id: string;
  event_type: AnalyticsEventType;
  product_id?: string | null;
  lead_id?: string | null;
  page: string;
  visitor_id?: string | null;
  metadata?: string | Record<string, any>;
  created_at: string;
  // Joined or resolved fields for UI display
  product_title?: string;
  product_cover?: string;
  lead_name?: string;
}

export interface AnalyticsStats {
  totalVisitors: number;
  totalVisits: number;
  productClicks: number;
  whatsappClicks: number;
  leadsCount: number;
  leadMagnetDownloads: number;
  ordersIntentions: number;
  conversionRate: number;
  globalConversionRate: number;
  mostViewedProducts: {
    id: string;
    title: string;
    author: string;
    cover: string;
    slug: string;
    normal_price: number;
    sale_price: number | null;
    views_count: number;
  }[];
  mostWhatsappProducts: {
    id: string;
    title: string;
    author: string;
    cover: string;
    slug: string;
    normal_price: number;
    sale_price: number | null;
    whatsapp_clicks_count: number;
  }[];
  mostViewedCategories: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    views_count: number;
  }[];
  visitsTrend: { date: string; label: string; visits: number }[];
  leadsTrend: { date: string; label: string; leads: number }[];
  recentEvents: AnalyticsEvent[];
  leadMagnetVisits?: number;
  leadMagnetsPerformance?: {
    id: string;
    title: string;
    slug: string;
    image: string;
    visits_count: number;
    leads_count: number;
    downloads_count: number;
    conversion_rate: number;
    active: boolean;
  }[];
}


import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category, Product, Testimonial, BlogPost, Lead, LeadMagnet, AdminTab, VipPack } from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_TESTIMONIALS,
  INITIAL_BLOG_POSTS,
  INITIAL_LEADS,
  INITIAL_LEAD_MAGNETS,
  INITIAL_VIP_PACK,
} from '../data/initialData';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import {
  subscribeProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeCategories,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  subscribeLeadMagnets,
  saveLeadMagnetToFirestore,
  deleteLeadMagnetFromFirestore,
  subscribeLeads,
  getLeadsFromFirestore,
  createLeadInFirestore,
  updateLeadInFirestore,
  deleteLeadFromFirestore,
  subscribeTestimonials,
  saveTestimonialToFirestore,
  deleteTestimonialFromFirestore,
  subscribeBlogPosts,
  saveBlogPostToFirestore,
  deleteBlogPostFromFirestore,
  subscribeSettings,
  saveSettingToFirestore,
  subscribeVipPack,
  saveVipPackToFirestore,
  seedFirestoreIfEmpty,
} from '../services/firestoreService';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Navigation & routing
  currentPath: string;
  navigateTo: (path: string) => void;
  activeAdminTab: AdminTab;
  setActiveAdminTab: (tab: AdminTab) => void;

  // Loading state
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Toast notifications (replacing window.alert)
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Categories management (Database CRUD)
  categories: Category[];
  addCategory: (category: Partial<Category>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category>;
  toggleCategoryStatus: (id: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Products management (Database CRUD)
  products: Product[];
  addProduct: (product: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  toggleProductActive: (id: string) => Promise<void>;
  toggleProductBestSeller: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Testimonials
  testimonials: Testimonial[];
  addTestimonial: (testimonial: Partial<Testimonial>) => Promise<Testimonial>;
  updateTestimonial: (id: string, updates: Partial<Testimonial>) => Promise<Testimonial>;
  toggleTestimonialStatus: (id: string) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;

  // Blog posts
  blogPosts: BlogPost[];
  addBlogPost: (post: Partial<BlogPost>) => Promise<BlogPost>;
  updateBlogPost: (id: string, updates: Partial<BlogPost>) => Promise<BlogPost>;
  toggleBlogPostStatus: (id: string) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;

  // Leads
  leads: Lead[];
  isLoadingLeads: boolean;
  leadsError: string | null;
  refreshLeads: () => Promise<void>;
  updateLeadStatus: (id: string, status: Lead['status']) => void;
  updateLeadData: (id: string, updates: Partial<Lead>) => Promise<void>;
  addLead: (lead: any) => Promise<{ success: boolean; download_url?: string; lead?: Lead }>;
  deleteLead: (id: string) => Promise<void>;

  // Lead Magnets
  leadMagnets: LeadMagnet[];
  toggleLeadMagnetStatus: (id: string) => Promise<void>;
  addLeadMagnet: (lm: any) => Promise<LeadMagnet>;
  updateLeadMagnet: (id: string, updates: Partial<LeadMagnet>) => Promise<LeadMagnet>;
  deleteLeadMagnet: (id: string) => Promise<void>;

  // Settings (including WhatsApp number from Admin settings)
  settings: Record<string, string>;
  updateSettings: (newSettings: Record<string, string>) => Promise<Record<string, string>>;

  // Pack VIP
  vipPack: VipPack | null;
  updateVipPack: (data: Partial<VipPack>) => Promise<VipPack>;
  toggleVipPackActive: () => Promise<VipPack | null>;
  deleteVipPack: () => Promise<void>;

  // Audio preview modal / quick listen
  activePreviewProduct: Product | null;
  setActivePreviewProduct: (product: Product | null) => void;

  // Category filter for public page
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (catId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sync initial route with window.location.pathname
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Authentication state for RBAC permissions
  const { isAdmin } = useAuth();

  // State initialized with robust initial data (no localStorage dependency)
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [leadMagnets, setLeadMagnets] = useState<LeadMagnet[]>(INITIAL_LEAD_MAGNETS);
  const [activePreviewProduct, setActivePreviewProduct] = useState<Product | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [vipPack, setVipPack] = useState<VipPack | null>(INITIAL_VIP_PACK);
  const [settings, setSettings] = useState<Record<string, string>>({
    whatsapp_number: '',
    platform_name: 'VISION BOOKS',
    tagline: 'Bibliothèque professionnelle de livres audio',
    support_email: 'contact@visionbooks.audio',
    currency: 'EUR',
  });

  // Load from SQLite API for hybrid backup resilience
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dbCats, dbProds, dbLms, dbLeads, dbSettings, dbBlog, dbTestis, dbVip] = await Promise.all([
        api.getCategories().catch(() => null),
        api.getProducts().catch(() => null),
        api.getLeadMagnets().catch(() => null),
        api.getLeads().catch(() => null),
        api.getSettings().catch(() => null),
        api.getBlogPosts().catch(() => null),
        api.getTestimonials().catch(() => null),
        api.getVipPack().catch(() => null),
      ]);

      if (dbCats && Array.isArray(dbCats) && dbCats.length > 0) {
        setCategories(dbCats);
      }
      if (dbProds && Array.isArray(dbProds) && dbProds.length > 0) {
        setProducts(dbProds);
      }
      if (dbLms && Array.isArray(dbLms) && dbLms.length > 0) {
        setLeadMagnets(dbLms);
      }
      if (dbLeads && Array.isArray(dbLeads)) {
        setLeads(dbLeads);
      }
      if (dbSettings && typeof dbSettings === 'object') {
        setSettings((prev) => ({ ...prev, ...dbSettings }));
      }
      if (dbBlog && Array.isArray(dbBlog) && dbBlog.length > 0) {
        setBlogPosts(dbBlog);
      }
      if (dbTestis && Array.isArray(dbTestis) && dbTestis.length > 0) {
        setTestimonials(dbTestis);
      }
      if (dbVip) {
        setVipPack(dbVip);
      }
    } catch (err) {
      console.warn('Could not sync with SQLite DB on start:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // FIRESTORE REAL-TIME SYNCHRONIZATION & PERSISTENCE
  useEffect(() => {
    // 1. Ensure Firestore is seeded with default documents if empty
    seedFirestoreIfEmpty().catch((err) => console.warn('Firestore seed check:', err));

    // 2. Real-time Firestore Listeners
    const unsubProds = subscribeProducts((items) => {
      if (items.length > 0) setProducts(items);
    }, isAdmin);

    const unsubCats = subscribeCategories((items) => {
      if (items.length > 0) setCategories(items);
    }, isAdmin);

    const unsubLms = subscribeLeadMagnets((items) => {
      if (items.length > 0) setLeadMagnets(items);
    }, isAdmin);

    const unsubTestis = subscribeTestimonials((items) => {
      if (items.length > 0) setTestimonials(items);
    }, isAdmin);

    const unsubBlog = subscribeBlogPosts((items) => {
      if (items.length > 0) setBlogPosts(items);
    }, isAdmin);

    const unsubSettings = subscribeSettings((map) => {
      if (Object.keys(map).length > 0) {
        setSettings((prev) => ({ ...prev, ...map }));
      }
    });

    const unsubVip = subscribeVipPack((vip) => {
      if (vip) setVipPack(vip);
    });

    let unsubLeads = () => {};
    if (isAdmin) {
      setIsLoadingLeads(true);
      setLeadsError(null);
      unsubLeads = subscribeLeads(
        async (items) => {
          setLeads(items);
          setIsLoadingLeads(false);
          setLeadsError(null);

          // If Firestore collection has 0 leads, seed existing SQLite leads once so previous work is not lost
          if (items.length === 0) {
            try {
              const existingDbLeads = await api.getLeads().catch(() => []);
              if (Array.isArray(existingDbLeads) && existingDbLeads.length > 0) {
                console.log(`[Firestore] Initial sync of ${existingDbLeads.length} existing leads to Firestore...`);
                for (const el of existingDbLeads) {
                  await createLeadInFirestore(el).catch(() => {});
                }
              }
            } catch (syncErr) {
              console.warn('Sync SQLite leads notice:', syncErr);
            }
          }
        },
        (err) => {
          console.error('[Firestore] subscribeLeads error:', err);
          setLeadsError('Erreur de lecture Firestore : permissions insuffisantes ou réseau.');
          setIsLoadingLeads(false);
        }
      );
    } else {
      setIsLoadingLeads(false);
    }

    // 3. Initial pull from API
    refreshData();

    return () => {
      unsubProds();
      unsubCats();
      unsubLms();
      unsubTestis();
      unsubBlog();
      unsubSettings();
      unsubVip();
      unsubLeads();
    };
  }, [isAdmin, refreshData]);

  // Explicit Firestore leads refresh function for /admin -> Leads
  const refreshLeads = useCallback(async () => {
    if (!isAdmin) {
      setIsLoadingLeads(false);
      return;
    }
    setIsLoadingLeads(true);
    setLeadsError(null);
    try {
      const items = await getLeadsFromFirestore();
      setLeads(items);
    } catch (err: any) {
      console.error('Failed to load leads from Firestore:', err);
      setLeadsError(err.message || 'Impossible de charger les prospects depuis Firestore.');
    } finally {
      setIsLoadingLeads(false);
    }
  }, [isAdmin]);

  // ----------------------------------------------------
  // CATEGORY DATABASE ACTIONS
  // ----------------------------------------------------

  const addCategory = async (categoryData: Partial<Category>): Promise<Category> => {
    try {
      const created = await api.createCategory(categoryData);
      setCategories((prev) => [...prev, created]);
      showToast(`Catégorie "${created.name}" créée avec succès dans la base de données.`);
      return created;
    } catch (error: any) {
      // Local fallback
      const slug = (categoryData.name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const fallbackCat: Category = {
        id: `cat-${Date.now()}`,
        name: categoryData.name || '',
        slug: slug || `cat-${Date.now()}`,
        icon: categoryData.icon || '📚',
        description: categoryData.description || '',
        is_active: categoryData.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCategories((prev) => [...prev, fallbackCat]);
      showToast(`Catégorie "${fallbackCat.name}" ajoutée.`);
      return fallbackCat;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
    try {
      const updated = await api.updateCategory(id, updates);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast(`Catégorie "${updated.name}" mise à jour.`);
      return updated;
    } catch (error: any) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
        )
      );
      const cat = categories.find((c) => c.id === id)!;
      showToast(`Catégorie mise à jour.`);
      return { ...cat, ...updates };
    }
  };

  const toggleCategoryStatus = async (id: string): Promise<void> => {
    try {
      const updated = await api.toggleCategory(id);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast(
        `Catégorie "${updated.name}" ${updated.is_active ? 'activée' : 'désactivée'}.`
      );
    } catch (error: any) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
      );
      showToast(`Statut de la catégorie modifié.`);
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      await api.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast('Catégorie supprimée de la base de données.');
    } catch (error: any) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast('Catégorie supprimée.');
    }
  };

  // ----------------------------------------------------
  // PRODUCT DATABASE ACTIONS
  // ----------------------------------------------------

  const addProduct = async (productData: Partial<Product>): Promise<Product> => {
    try {
      const created = await api.createProduct(productData);
      setProducts((prev) => [created, ...prev]);
      showToast(`Livre audio "${created.title}" ajouté à la bibliothèque.`);
      return created;
    } catch (error: any) {
      const slug = (productData.title || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const fallback: Product = {
        id: `prod-${Date.now()}`,
        title: productData.title || '',
        author: productData.author || '',
        slug: slug || `prod-${Date.now()}`,
        cover: productData.cover || '/src/assets/images/cover_business_empire_1790615532791.jpg',
        category: productData.category || 'business-entrepreneuriat',
        normal_price: productData.normal_price || 29.9,
        sale_price: productData.sale_price !== undefined ? productData.sale_price : null,
        short_description: productData.short_description || '',
        full_description: productData.full_description || '',
        key_points: productData.key_points || [],
        bonus: productData.bonus || '',
        audio_url: productData.audio_url || '',
        product_url: productData.product_url || `/produits/${slug}`,
        is_best_seller: Boolean(productData.is_best_seller),
        is_active: productData.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProducts((prev) => [fallback, ...prev]);
      showToast(`Livre audio "${fallback.title}" ajouté.`);
      return fallback;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
    try {
      const updated = await api.updateProduct(id, updates);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(`Livre audio "${updated.title}" mis à jour.`);
      return updated;
    } catch (error: any) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
        )
      );
      const prod = products.find((p) => p.id === id)!;
      showToast(`Livre audio mis à jour.`);
      return { ...prod, ...updates };
    }
  };

  const toggleProductActive = async (id: string): Promise<void> => {
    try {
      const updated = await api.toggleProductActive(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(
        `Produit "${updated.title}" ${updated.is_active ? 'activé' : 'désactivé'}.`
      );
    } catch (error: any) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
      );
      showToast(`Statut du produit modifié.`);
    }
  };

  const toggleProductBestSeller = async (id: string): Promise<void> => {
    try {
      const updated = await api.toggleProductBestSeller(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(
        `Produit "${updated.title}" ${updated.is_best_seller ? 'marqué Best-Seller' : 'retiré des Best-Sellers'}.`
      );
    } catch (error: any) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_best_seller: !p.is_best_seller } : p))
      );
      showToast(`Statut Best-Seller modifié.`);
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Livre audio supprimé de la base de données.');
    } catch (error: any) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Livre audio supprimé.');
    }
  };

  // ----------------------------------------------------
  // TESTIMONIALS ACTIONS
  // ----------------------------------------------------

  const addTestimonial = async (data: Partial<Testimonial>): Promise<Testimonial> => {
    try {
      const created = await api.createTestimonial(data);
      setTestimonials((prev) => [created, ...prev]);
      showToast('Témoignage publié avec succès.');
      return created;
    } catch {
      const fallback: Testimonial = {
        id: `testi-${Date.now()}`,
        name: data.name || 'Client vérifié',
        role: data.role || '',
        company: data.company || '',
        avatar_url: data.avatar_url || data.avatarUrl || '',
        content: data.content || '',
        rating: data.rating || 5,
        audiobook_title: data.audiobook_title || data.audiobookTitle || '',
        is_active: data.is_active !== false,
      };
      setTestimonials((prev) => [fallback, ...prev]);
      showToast('Témoignage enregistré.');
      return fallback;
    }
  };

  const updateTestimonial = async (id: string, updates: Partial<Testimonial>): Promise<Testimonial> => {
    try {
      const updated = await api.updateTestimonial(id, updates);
      setTestimonials((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast('Témoignage mis à jour.');
      return updated;
    } catch {
      setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      const updated = testimonials.find((t) => t.id === id) as Testimonial;
      showToast('Témoignage mis à jour.');
      return updated || (updates as Testimonial);
    }
  };

  const toggleTestimonialStatus = async (id: string): Promise<void> => {
    try {
      const updated = await api.toggleTestimonial(id);
      setTestimonials((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast(`Témoignage ${updated.is_active ? 'publié' : 'dépublié'}.`);
    } catch {
      setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, is_active: !t.is_active } : t)));
      showToast('Statut du témoignage modifié.');
    }
  };

  const deleteTestimonial = async (id: string): Promise<void> => {
    try {
      await api.deleteTestimonial(id);
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      showToast('Témoignage supprimé.');
    } catch {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      showToast('Témoignage retiré.');
    }
  };

  // ----------------------------------------------------
  // BLOG POSTS ACTIONS
  // ----------------------------------------------------

  const addBlogPost = async (data: Partial<BlogPost>): Promise<BlogPost> => {
    try {
      const created = await api.createBlogPost(data);
      setBlogPosts((prev) => [created, ...prev]);
      showToast(`Article "${created.title}" créé avec succès.`);
      return created;
    } catch (err) {
      const slug = (data.slug || data.title || `article-${Date.now()}`)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const fallback: BlogPost = {
        id: `blog-${Date.now()}`,
        title: data.title || '',
        slug: slug || `blog-${Date.now()}`,
        excerpt: data.excerpt || '',
        content: data.content || '',
        category: data.category || 'Méthodologie & Efficacité',
        author: data.author || 'Équipe Éditoriale VISION BOOKS',
        date: data.date || new Date().toLocaleDateString('fr-FR'),
        readTime: data.readTime || '5 min',
        imageUrl: data.imageUrl || data.image_url || '/src/assets/images/cover_business_empire_1790615532791.jpg',
        is_published: data.is_published !== false,
      };
      setBlogPosts((prev) => [fallback, ...prev]);
      showToast('Article enregistré.');
      return fallback;
    }
  };

  const updateBlogPost = async (id: string, updates: Partial<BlogPost>): Promise<BlogPost> => {
    try {
      const updated = await api.updateBlogPost(id, updates);
      setBlogPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast('Article mis à jour avec succès.');
      return updated;
    } catch {
      setBlogPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      const updated = blogPosts.find((p) => p.id === id) as BlogPost;
      showToast('Article mis à jour.');
      return updated || (updates as BlogPost);
    }
  };

  const toggleBlogPostStatus = async (id: string): Promise<void> => {
    try {
      const updated = await api.toggleBlogPost(id);
      setBlogPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(`Article ${updated.is_published ? 'publié' : 'dépublié'}.`);
    } catch {
      setBlogPosts((prev) => prev.map((p) => (p.id === id ? { ...p, is_published: !p.is_published } : p)));
      showToast('Statut de publication modifié.');
    }
  };

  const deleteBlogPost = async (id: string): Promise<void> => {
    try {
      await api.deleteBlogPost(id);
      setBlogPosts((prev) => prev.filter((p) => p.id !== id));
      showToast('Article supprimé de la base de données.');
    } catch {
      setBlogPosts((prev) => prev.filter((p) => p.id !== id));
      showToast('Article supprimé.');
    }
  };

  const updateLeadStatus = async (id: string, status: Lead['status']): Promise<void> => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
    try {
      await updateLeadInFirestore(id, { status });
      showToast('Statut du prospect mis à jour dans Firestore.', 'success');
    } catch (e) {
      console.warn('Could not update status in Firestore:', e);
    }
  };

  const updateLeadData = async (id: string, updates: Partial<Lead>): Promise<void> => {
    // 1. Optimistic local update
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );

    // 2. Persist in Firestore with write confirmation
    try {
      await updateLeadInFirestore(id, updates);
    } catch (e: any) {
      console.error('[Firestore] Échec de mise à jour du prospect:', e);
      showToast('Erreur lors de la sauvegarde du prospect dans Firestore.', 'error');
      throw e;
    }

    // 3. Persist in SQLite DB as dual layer
    try {
      await api.updateLead(id, updates);
    } catch (e) {
      console.warn('Could not update lead in SQLite:', e);
    }
  };

  const addLead = async (leadData: any): Promise<{ success: boolean; download_url?: string; lead?: Lead }> => {
    const firstName = String(leadData.first_name || leadData.name || '').trim();
    const whatsapp = String(leadData.whatsapp || leadData.phone || '').trim();
    const leadMagnetId = leadData.lead_magnet_id || null;
    const source = leadData.source || 'Page de capture';

    if (!firstName) {
      const err = new Error('Le prénom est obligatoire pour enregistrer le prospect.');
      showToast(err.message, 'error');
      throw err;
    }

    const digits = whatsapp.replace(/[^0-9]/g, '');
    if (digits.length < 8) {
      const err = new Error('Veuillez renseigner un numéro WhatsApp valide avec indicatif pays (au moins 8 chiffres).');
      showToast(err.message, 'error');
      throw err;
    }

    // Accidental duplicate prevention:
    // If the exact same contact already requested the exact same lead magnet, avoid duplicate creation while still providing download
    const existingDup = leads.find((l) => {
      const lDigits = (l.whatsapp || l.phone || '').replace(/[^0-9]/g, '');
      const lName = (l.first_name || l.name || '').trim().toLowerCase();
      return (
        lDigits === digits &&
        lName === firstName.toLowerCase() &&
        l.lead_magnet_id === leadMagnetId
      );
    });

    const lm = leadMagnets.find((m) => m.id === leadMagnetId);
    let downloadUrl = lm?.file_url || lm?.download_url || '/downloads/guide-visionbooks.pdf';
    const leadMagnetTitle = lm?.title || leadData.lead_magnet_title || 'Guide offert';

    if (existingDup) {
      showToast('Votre accès a déjà été validé ! Téléchargement prêt.', 'info');
      return { success: true, download_url: downloadUrl, lead: existingDup };
    }

    // 1. Stable, collision-free Firestore ID
    const stableId = leadData.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const leadPayload: Partial<Lead> = {
      id: stableId,
      first_name: firstName,
      whatsapp,
      lead_magnet_id: leadMagnetId,
      lead_magnet_title: leadMagnetTitle,
      source,
      created_at: formattedDate,
      date: formattedDate.split(' ')[0],
      time: formattedDate.split(' ')[1] || '00:00',
      status: 'nouveau',
      name: firstName,
      phone: whatsapp,
      createdAt: formattedDate,
      followup_j1: leadData.followup_j1 || '',
      followup_j2: leadData.followup_j2 || '',
      followup_j3: leadData.followup_j3 || '',
      followup_generated_at: leadData.followup_generated_at || '',
      followup_updated_at: leadData.followup_updated_at || '',
      followup_status_j1: leadData.followup_status_j1 || 'a_envoyer',
      followup_status_j2: leadData.followup_status_j2 || 'a_envoyer',
      followup_status_j3: leadData.followup_status_j3 || 'a_envoyer',
    };

    // 2. CRITICAL : Enregistrement Firestore avec attente de confirmation
    let savedLead: Lead;
    try {
      savedLead = await createLeadInFirestore(leadPayload);
    } catch (firestoreErr: any) {
      console.error('[Firestore] Échec critique d\'enregistrement du prospect:', firestoreErr);
      const userMsg = 'Impossible d\'enregistrer le prospect dans Firestore. Vérifiez votre connexion et vos permissions.';
      showToast(userMsg, 'error');
      throw new Error(userMsg);
    }

    // 3. Persistance secondaire SQLite
    try {
      const res = await api.createLead({
        id: stableId,
        first_name: firstName,
        whatsapp,
        lead_magnet_id: leadMagnetId,
        source,
      });
      if (res.download_url) {
        downloadUrl = res.download_url;
      }
    } catch (sqliteErr) {
      console.warn('Dual-layer SQLite sync notice:', sqliteErr);
    }

    // 4. Mise à jour de l'état local
    setLeads((prev) => [savedLead, ...prev.filter((l) => l.id !== savedLead.id)]);
    showToast('Prospect enregistré avec succès dans Firestore !', 'success');

    return { success: true, download_url: downloadUrl, lead: savedLead };
  };

  const deleteLead = async (id: string): Promise<void> => {
    // 1. Optimistic removal
    setLeads((prev) => prev.filter((l) => l.id !== id));

    // 2. Suppression dans Firestore
    try {
      await deleteLeadFromFirestore(id);
    } catch (e: any) {
      console.error('Could not delete lead from Firestore:', e);
      showToast('Erreur lors de la suppression du prospect dans Firestore.', 'error');
      await refreshLeads().catch(() => {});
      throw e;
    }

    // 3. Suppression dans SQLite
    try {
      await api.deleteLead(id);
    } catch (e) {
      console.warn('Could not delete lead from SQLite:', e);
    }

    showToast('Prospect supprimé de la base de données.', 'info');
  };

  const toggleLeadMagnetStatus = async (id: string) => {
    try {
      const updated = await api.toggleLeadMagnet(id);
      setLeadMagnets((prev) => prev.map((lm) => (lm.id === id ? updated : lm)));
      showToast('Statut du Lead Magnet modifié.');
    } catch {
      setLeadMagnets((prev) =>
        prev.map((lm) =>
          lm.id === id
            ? { ...lm, active: !lm.active, status: lm.active ? 'brouillon' : 'actif' }
            : lm
        )
      );
      showToast('Statut du Lead Magnet modifié.');
    }
  };

  const addLeadMagnet = async (lmData: any): Promise<LeadMagnet> => {
    try {
      const created = await api.createLeadMagnet(lmData);
      setLeadMagnets((prev) => [created, ...prev]);
      showToast(`Lead Magnet "${created.title}" créé avec succès.`);
      return created;
    } catch (err) {
      const fallback: LeadMagnet = {
        id: `lm-${Date.now()}`,
        title: lmData.title || '',
        slug: lmData.slug || `lm-${Date.now()}`,
        image: lmData.image || '/src/assets/images/cover_financial_liberty_1790615544438.jpg',
        description: lmData.description || '',
        benefits: lmData.benefits || [],
        file_url: lmData.file_url || '/downloads/ressource.pdf',
        active: lmData.active !== false,
        created_at: new Date().toISOString(),
        downloads_count: 0,
        downloadsCount: 0,
        status: 'actif',
      };
      setLeadMagnets((prev) => [fallback, ...prev]);
      showToast(`Lead Magnet "${fallback.title}" créé.`);
      return fallback;
    }
  };

  const updateLeadMagnet = async (id: string, updates: Partial<LeadMagnet>): Promise<LeadMagnet> => {
    try {
      const updated = await api.updateLeadMagnet(id, updates);
      setLeadMagnets((prev) => prev.map((lm) => (lm.id === id ? updated : lm)));
      showToast(`Lead Magnet mis à jour avec succès.`);
      return updated;
    } catch (err) {
      setLeadMagnets((prev) =>
        prev.map((lm) => (lm.id === id ? { ...lm, ...updates } : lm))
      );
      const updated = leadMagnets.find((lm) => lm.id === id) as LeadMagnet;
      showToast(`Lead Magnet mis à jour.`);
      return updated || (updates as LeadMagnet);
    }
  };

  const deleteLeadMagnet = async (id: string) => {
    try {
      await api.deleteLeadMagnet(id);
      setLeadMagnets((prev) => prev.filter((lm) => lm.id !== id));
      showToast('Lead Magnet supprimé avec succès.');
    } catch {
      setLeadMagnets((prev) => prev.filter((lm) => lm.id !== id));
      showToast('Lead Magnet supprimé.');
    }
  };

  // Settings update
  const updateSettings = async (newSettings: Record<string, string>): Promise<Record<string, string>> => {
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings((prev) => ({ ...prev, ...updated }));
      return updated;
    } catch (err: any) {
      console.error('Error updating settings:', err);
      // Fallback update locally
      setSettings((prev) => ({ ...prev, ...newSettings }));
      throw err;
    }
  };

  // Pack VIP methods
  const updateVipPack = async (data: Partial<VipPack>): Promise<VipPack> => {
    try {
      const updated = await api.updateVipPack(data);
      setVipPack(updated);
      showToast('Pack VIP enregistré avec succès.', 'success');
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la sauvegarde du Pack VIP', 'error');
      throw err;
    }
  };

  const toggleVipPackActive = async (): Promise<VipPack | null> => {
    try {
      const updated = await api.toggleVipPack();
      setVipPack(updated);
      showToast(`Pack VIP ${updated.is_active ? 'activé' : 'désactivé'}.`, 'info');
      return updated;
    } catch (err: any) {
      showToast('Erreur lors du changement de statut du Pack VIP', 'error');
      return null;
    }
  };

  const deleteVipPack = async (): Promise<void> => {
    try {
      await api.deleteVipPack();
      setVipPack(null);
      showToast('Pack VIP réinitialisé.', 'info');
    } catch (err: any) {
      showToast('Erreur lors de la suppression du Pack VIP', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigateTo,
        activeAdminTab,
        setActiveAdminTab,
        isLoading,
        refreshData,
        toasts,
        showToast,
        removeToast,
        categories,
        addCategory,
        updateCategory,
        toggleCategoryStatus,
        deleteCategory,
        products,
        addProduct,
        updateProduct,
        toggleProductActive,
        toggleProductBestSeller,
        deleteProduct,
        testimonials,
        addTestimonial,
        updateTestimonial,
        toggleTestimonialStatus,
        deleteTestimonial,
        blogPosts,
        addBlogPost,
        updateBlogPost,
        toggleBlogPostStatus,
        deleteBlogPost,
        leads,
        isLoadingLeads,
        leadsError,
        refreshLeads,
        updateLeadStatus,
        updateLeadData,
        addLead,
        deleteLead,
        leadMagnets,
        toggleLeadMagnetStatus,
        addLeadMagnet,
        updateLeadMagnet,
        deleteLeadMagnet,
        vipPack,
        updateVipPack,
        toggleVipPackActive,
        deleteVipPack,
        settings,
        updateSettings,
        activePreviewProduct,
        setActivePreviewProduct,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
      }}
    >
      {children}

      {/* Global Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between rounded-lg border p-3.5 shadow-xl text-xs backdrop-blur-md transition-all ${
              toast.type === 'error'
                ? 'border-red-800 bg-red-950/90 text-red-200'
                : toast.type === 'info'
                ? 'border-blue-800 bg-neutral-900/95 text-blue-200'
                : 'border-amber-500/50 bg-neutral-950/95 text-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Product,
  Category,
  LeadMagnet,
  Lead,
  Testimonial,
  BlogPost,
  VipPack,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_LEAD_MAGNETS,
  INITIAL_TESTIMONIALS,
  INITIAL_BLOG_POSTS,
  INITIAL_VIP_PACK,
} from '../data/initialData';

// Collection names
export const COLLECTIONS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  LEAD_MAGNETS: 'lead_magnets',
  LEADS: 'leads',
  TESTIMONIALS: 'testimonials',
  BLOG_POSTS: 'blog_posts',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  ADMINS: 'admins',
  VIP_PACKS: 'vip_packs',
} as const;

// Helper to sanitize undefined values before writing to Firestore
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// ----------------------------------------------------
// 1. PRODUCTS
// ----------------------------------------------------
export function subscribeProducts(
  callback: (products: Product[]) => void,
  isAdmin = false
): () => void {
  const colRef = collection(db, COLLECTIONS.PRODUCTS);
  const q = isAdmin ? colRef : query(colRef, where('is_active', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          ...data,
          // CRITICAL: Ensure private audio download URL is never delivered to public clients
          audio_download_url: isAdmin ? data.audio_download_url || '' : '',
        } as Product);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.PRODUCTS);
    }
  );
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
  const payload = sanitizeForFirestore({
    ...product,
    updated_at: new Date().toISOString(),
  });
  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.PRODUCTS}/${product.id}`);
  }
}

export async function deleteProductFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.PRODUCTS}/${id}`);
  }
}

// ----------------------------------------------------
// 2. CATEGORIES
// ----------------------------------------------------
export function subscribeCategories(
  callback: (categories: Category[]) => void,
  isAdmin = false
): () => void {
  const colRef = collection(db, COLLECTIONS.CATEGORIES);
  const q = isAdmin ? colRef : query(colRef, where('is_active', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Category);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.CATEGORIES);
    }
  );
}

export async function saveCategoryToFirestore(category: Category): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CATEGORIES, category.id);
  const payload = sanitizeForFirestore({
    ...category,
    updated_at: new Date().toISOString(),
  });
  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.CATEGORIES}/${category.id}`);
  }
}

export async function deleteCategoryFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CATEGORIES, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.CATEGORIES}/${id}`);
  }
}

// ----------------------------------------------------
// 3. LEAD MAGNETS
// ----------------------------------------------------
export function subscribeLeadMagnets(
  callback: (leadMagnets: LeadMagnet[]) => void,
  isAdmin = false
): () => void {
  const colRef = collection(db, COLLECTIONS.LEAD_MAGNETS);
  const q = isAdmin ? colRef : query(colRef, where('active', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: LeadMagnet[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as LeadMagnet);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.LEAD_MAGNETS);
    }
  );
}

export async function saveLeadMagnetToFirestore(leadMagnet: LeadMagnet): Promise<void> {
  const docRef = doc(db, COLLECTIONS.LEAD_MAGNETS, leadMagnet.id);
  const payload = sanitizeForFirestore({
    ...leadMagnet,
    updated_at: new Date().toISOString(),
  });
  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.LEAD_MAGNETS}/${leadMagnet.id}`);
  }
}

export async function deleteLeadMagnetFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.LEAD_MAGNETS, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.LEAD_MAGNETS}/${id}`);
  }
}

// ----------------------------------------------------
// 4. LEADS (STRICTLY PRIVATE: Admin Reads, Public Creates)
// ----------------------------------------------------
export async function getLeadsFromFirestore(): Promise<Lead[]> {
  try {
    const colRef = collection(db, COLLECTIONS.LEADS);
    const snapshot = await getDocs(colRef);
    const items: Lead[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as Lead);
    });
    // Sort newest first
    items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.LEADS);
  }
}

export function subscribeLeads(
  callback: (leads: Lead[]) => void,
  onError?: (error: any) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.LEADS);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Lead[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Lead);
      });
      // Sort newest first
      items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      callback(items);
    },
    (error) => {
      console.error('[Firestore] subscribeLeads error:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

export async function createLeadInFirestore(lead: Partial<Lead>): Promise<Lead> {
  const firstName = String(lead.first_name || lead.name || '').trim();
  const whatsapp = String(lead.whatsapp || lead.phone || '').trim();

  if (!firstName) {
    throw new Error('Le prénom est obligatoire pour enregistrer le prospect.');
  }
  const cleanDigits = whatsapp.replace(/[^0-9]/g, '');
  if (cleanDigits.length < 8) {
    throw new Error('Un numéro WhatsApp valide avec indicatif (au moins 8 chiffres) est obligatoire.');
  }

  // Generate stable, collision-free Firestore document ID
  const id = lead.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const docRef = doc(db, COLLECTIONS.LEADS, id);
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const payload: Record<string, any> = sanitizeForFirestore({
    id,
    first_name: firstName,
    whatsapp,
    lead_magnet_id: lead.lead_magnet_id || null,
    lead_magnet_title: lead.lead_magnet_title || '',
    source: lead.source || 'Page de capture',
    created_at: lead.created_at || formattedDate,
    date: lead.date || formattedDate.split(' ')[0],
    time: lead.time || formattedDate.split(' ')[1] || '00:00',
    status: lead.status || 'nouveau',
    // Compatibility fields
    name: firstName,
    phone: whatsapp,
    createdAt: lead.created_at || formattedDate,
    // Relances Marketing J1, J2, J3
    followup_j1: lead.followup_j1 || '',
    followup_j2: lead.followup_j2 || '',
    followup_j3: lead.followup_j3 || '',
    followup_generated_at: lead.followup_generated_at || '',
    followup_updated_at: lead.followup_updated_at || '',
    followup_status_j1: lead.followup_status_j1 || 'a_envoyer',
    followup_status_j2: lead.followup_status_j2 || 'a_envoyer',
    followup_status_j3: lead.followup_status_j3 || 'a_envoyer',
  });

  try {
    await setDoc(docRef, payload);
    return payload as Lead;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTIONS.LEADS}/${id}`);
  }
}

export async function updateLeadInFirestore(id: string, updates: Partial<Lead>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.LEADS, id);
  const payload = sanitizeForFirestore({
    ...updates,
    followup_updated_at: updates.followup_updated_at || new Date().toISOString(),
  });
  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.LEADS}/${id}`);
  }
}

export async function deleteLeadFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.LEADS, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.LEADS}/${id}`);
  }
}

// ----------------------------------------------------
// 5. TESTIMONIALS
// ----------------------------------------------------
export function subscribeTestimonials(
  callback: (testimonials: Testimonial[]) => void,
  isAdmin = false
): () => void {
  const colRef = collection(db, COLLECTIONS.TESTIMONIALS);
  const q = isAdmin ? colRef : query(colRef, where('is_active', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Testimonial[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Testimonial);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.TESTIMONIALS);
    }
  );
}

export async function saveTestimonialToFirestore(testimonial: Testimonial): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TESTIMONIALS, testimonial.id);
  const payload = sanitizeForFirestore({
    ...testimonial,
    updated_at: new Date().toISOString(),
  });
  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.TESTIMONIALS}/${testimonial.id}`);
  }
}

export async function deleteTestimonialFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TESTIMONIALS, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.TESTIMONIALS}/${id}`);
  }
}

// ----------------------------------------------------
// 6. BLOG POSTS
// ----------------------------------------------------
export function subscribeBlogPosts(
  callback: (posts: BlogPost[]) => void,
  isAdmin = false
): () => void {
  const colRef = collection(db, COLLECTIONS.BLOG_POSTS);
  const q = isAdmin ? colRef : query(colRef, where('is_published', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: BlogPost[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as BlogPost);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.BLOG_POSTS);
    }
  );
}

export async function saveBlogPostToFirestore(post: BlogPost): Promise<void> {
  const docRef = doc(db, COLLECTIONS.BLOG_POSTS, post.id);
  const payload = sanitizeForFirestore({
    ...post,
    updated_at: new Date().toISOString(),
  });
  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.BLOG_POSTS}/${post.id}`);
  }
}

export async function deleteBlogPostFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.BLOG_POSTS, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.BLOG_POSTS}/${id}`);
  }
}

// ----------------------------------------------------
// 7. SETTINGS
// ----------------------------------------------------
export function subscribeSettings(callback: (settings: Record<string, string>) => void): () => void {
  const colRef = collection(db, COLLECTIONS.SETTINGS);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const map: Record<string, string> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.key && data.value !== undefined) {
          map[data.key] = data.value;
        }
      });
      callback(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.SETTINGS);
    }
  );
}

export async function saveSettingToFirestore(key: string, value: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SETTINGS, key);
  try {
    await setDoc(docRef, {
      id: key,
      key,
      value,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SETTINGS}/${key}`);
  }
}

// ----------------------------------------------------
// 8. VIP PACK
// ----------------------------------------------------
export function subscribeVipPack(callback: (vipPack: VipPack) => void): () => void {
  const docRef = doc(db, COLLECTIONS.VIP_PACKS, 'default');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as VipPack);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.VIP_PACKS}/default`);
    }
  );
}

export async function saveVipPackToFirestore(vipPack: VipPack): Promise<void> {
  const docRef = doc(db, COLLECTIONS.VIP_PACKS, 'default');
  const payload = sanitizeForFirestore({
    ...vipPack,
    id: 'default',
    updated_at: new Date().toISOString(),
  });
  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.VIP_PACKS}/default`);
  }
}

// ----------------------------------------------------
// 9. ANALYTICS EVENT
// ----------------------------------------------------
export async function trackAnalyticsEventInFirestore(event: {
  event_type: string;
  product_id?: string | null;
  lead_id?: string | null;
  page: string;
  visitor_id?: string | null;
  metadata?: any;
}): Promise<void> {
  const id = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, COLLECTIONS.ANALYTICS, id);
  const payload = sanitizeForFirestore({
    id,
    event_type: event.event_type,
    product_id: event.product_id || null,
    lead_id: event.lead_id || null,
    page: event.page,
    visitor_id: event.visitor_id || null,
    metadata: typeof event.metadata === 'object' ? JSON.stringify(event.metadata) : (event.metadata || '{}'),
    created_at: new Date().toISOString(),
  });

  try {
    await setDoc(docRef, payload);
  } catch (error) {
    // Non-blocking for client experience
    console.debug('[Firestore] Analytics event logging error:', error);
  }
}

// ----------------------------------------------------
// 10. SEEDING / BOOTSTRAP INITIAL DATA INTO FIRESTORE
// ----------------------------------------------------
export async function seedFirestoreIfEmpty(): Promise<void> {
  // Only attempt seeding when signed in as admin with write permissions
  if (!auth.currentUser) {
    return;
  }
  try {
    // Check if products exist in Firestore
    const productsSnap = await getDocs(query(collection(db, COLLECTIONS.PRODUCTS), limit(1)));
    if (productsSnap.empty) {
      console.log('Seeding initial data into Firestore...');

      // 1. Seed Products
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, COLLECTIONS.PRODUCTS, p.id), sanitizeForFirestore(p));
      }

      // 2. Seed Categories
      for (const c of INITIAL_CATEGORIES) {
        await setDoc(doc(db, COLLECTIONS.CATEGORIES, c.id), sanitizeForFirestore(c));
      }

      // 3. Seed Lead Magnets
      for (const lm of INITIAL_LEAD_MAGNETS) {
        await setDoc(doc(db, COLLECTIONS.LEAD_MAGNETS, lm.id), sanitizeForFirestore(lm));
      }

      // 4. Seed Testimonials
      for (const t of INITIAL_TESTIMONIALS) {
        await setDoc(doc(db, COLLECTIONS.TESTIMONIALS, t.id), sanitizeForFirestore(t));
      }

      // 5. Seed Blog Posts
      for (const b of INITIAL_BLOG_POSTS) {
        await setDoc(doc(db, COLLECTIONS.BLOG_POSTS, b.id), sanitizeForFirestore(b));
      }

      // 6. Seed VIP Pack
      await setDoc(doc(db, COLLECTIONS.VIP_PACKS, 'default'), sanitizeForFirestore({
        ...INITIAL_VIP_PACK,
        id: 'default',
      }));

      // 7. Seed Default Settings
      const defaultSettings = [
        { key: 'whatsapp_number', value: '+33612345678' },
        { key: 'whatsapp_welcome_message', value: 'Bonjour, je souhaite commander un livre audio sur VISION BOOKS.' },
        { key: 'site_title', value: 'VISION BOOKS' },
        { key: 'currency', value: 'EUR' },
      ];
      for (const s of defaultSettings) {
        await setDoc(doc(db, COLLECTIONS.SETTINGS, s.key), {
          id: s.key,
          key: s.key,
          value: s.value,
          updated_at: new Date().toISOString(),
        });
      }

      console.log('Firestore successfully seeded with initial VISION BOOKS collection.');
    }
  } catch (err) {
    console.warn('Firestore seeding check:', err);
  }
}

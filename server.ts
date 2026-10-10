import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads folder exists
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// POST /api/upload (Saves uploaded image/file to disk and returns static URL)
app.post('/api/upload', (req, res) => {
  try {
    const { filename, data, type } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Aucune donnée reçue pour le téléversement.' });
    }

    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const cleanFilename = (filename || 'file')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-+/g, '-');

    const uniqueFilename = `${Date.now()}-${cleanFilename}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/uploads/${uniqueFilename}`,
      filename: uniqueFilename,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error('Error during upload:', err);
    res.status(500).json({ error: err.message || 'Erreur lors du téléversement.' });
  }
});

// Helper to guarantee unique slug without DB collision
function getUniqueSlug(table: 'categories' | 'products' | 'lead_magnets' | 'blog_posts', baseSlug: string, currentId?: string): string {
  let clean = (baseSlug || 'item')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'item';

  let candidate = clean;
  let counter = 1;
  while (true) {
    const existing = db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(candidate) as any;
    if (!existing || (currentId && existing.id === currentId)) {
      return candidate;
    }
    candidate = `${clean}-${counter++}`;
  }
}

// ----------------------------------------------------
// CATEGORIES API
// ----------------------------------------------------

// GET /api/categories
app.get('/api/categories', (req, res) => {
  try {
    const activeOnly = req.query.active_only === 'true';
    const query = activeOnly
      ? 'SELECT * FROM categories WHERE is_active = 1 ORDER BY created_at ASC'
      : 'SELECT * FROM categories ORDER BY created_at ASC';
    const categories = db.prepare(query).all().map((cat: any) => ({
      ...cat,
      is_active: Boolean(cat.is_active),
    }));
    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories/:id (or by slug)
app.get('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const cat = db.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').get(id, id) as any;
    if (!cat) {
      return res.status(404).json({ error: 'Catégorie non trouvée.' });
    }
    res.json({ ...cat, is_active: Boolean(cat.is_active) });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories
app.post('/api/categories', (req, res) => {
  try {
    const { name, icon, description, is_active } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la catégorie est obligatoire.' });
    }

    const baseSlug = req.body.slug || name;
    const slug = getUniqueSlug('categories', baseSlug);
    const id = req.body.id || `cat-${Date.now()}`;
    const now = new Date().toISOString();
    const activeInt = is_active !== false ? 1 : 0;

    const stmt = db.prepare(`
      INSERT INTO categories (id, name, slug, icon, description, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, name.trim(), slug, icon || '📚', description || '', activeInt, now, now);

    const newCat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    res.status(201).json({ ...newCat, is_active: Boolean(newCat.is_active) });
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/categories/:id
app.put('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, description, is_active } = req.body;

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Catégorie non trouvée.' });
    }

    const baseSlug = slug || name || existing.slug;
    const updatedSlug = getUniqueSlug('categories', baseSlug, id);

    const now = new Date().toISOString();
    const activeInt = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    const stmt = db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, icon = ?, description = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      name !== undefined ? name.trim() : existing.name,
      updatedSlug,
      icon !== undefined ? icon : existing.icon,
      description !== undefined ? description : existing.description,
      activeInt,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    res.json({ ...updated, is_active: Boolean(updated.is_active) });
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/categories/:id/toggle
app.patch('/api/categories/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Catégorie non trouvée.' });
    }

    const nextStatus = existing.is_active ? 0 : 1;
    const now = new Date().toISOString();

    db.prepare('UPDATE categories SET is_active = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, id);

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    res.json({ ...updated, is_active: Boolean(updated.is_active) });
  } catch (error: any) {
    console.error('Error toggling category status:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/categories/:id
app.delete('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Catégorie non trouvée.' });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// PRODUCTS API
// ----------------------------------------------------

// Format raw SQLite product row into typed object
function formatProduct(p: any, isPublic = false) {
  let keyPointsArr: string[] = [];
  try {
    keyPointsArr = typeof p.key_points === 'string' ? JSON.parse(p.key_points) : (p.key_points || []);
  } catch {
    keyPointsArr = p.key_points ? [p.key_points] : [];
  }

  return {
    id: p.id,
    title: p.title,
    author: p.author,
    slug: p.slug,
    cover: p.cover,
    category: p.category,
    normal_price: Number(p.normal_price),
    sale_price: p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : null,
    short_description: p.short_description || '',
    full_description: p.full_description || '',
    key_points: keyPointsArr,
    bonus: p.bonus || '',
    cta_text: p.cta_text || '',
    audio_url: p.audio_url || '',
    audio_download_url: isPublic ? '' : (p.audio_download_url || ''), // Private link for admin copy/paste, never displayed publicly
    product_details: p.product_details || '', // Content / details of the product
    product_url: p.product_url || '',
    is_best_seller: Boolean(p.is_best_seller),
    is_active: Boolean(p.is_active),
    created_at: p.created_at,
    updated_at: p.updated_at,
    // Format du contenu (Livre audio 🎧, Ebook 📚, Autre format 📦)
    format: p.format || (p.audio_url ? 'audiobook' : 'ebook'),
    // Urgence Marketing
    urgency_active: Boolean(p.urgency_active),
    urgency_end_date: p.urgency_end_date || '',
    urgency_text: p.urgency_text || '',
    urgency_badge: p.urgency_badge || '',
  };
}

// GET /api/products
app.get('/api/products', (req, res) => {
  try {
    const activeOnly = req.query.active_only === 'true';
    const category = req.query.category as string | undefined;

    let sql = 'SELECT * FROM products';
    const conditions: string[] = [];
    const params: any[] = [];

    if (activeOnly) {
      conditions.push('is_active = 1');
    }
    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY is_best_seller DESC, created_at DESC';

    const products = db.prepare(sql).all(...params).map((p) => formatProduct(p, activeOnly));
    res.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id (or by slug)
app.get('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT * FROM products WHERE id = ? OR slug = ?').get(id, id) as any;
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }
    res.json(formatProduct(product));
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products
app.post('/api/products', (req, res) => {
  try {
    const {
      title,
      author,
      cover,
      category,
      normal_price,
      sale_price,
      short_description,
      full_description,
      key_points,
      bonus,
      cta_text,
      audio_url,
      audio_download_url,
      product_details,
      product_url,
      is_best_seller,
      is_active,
      format,
      urgency_active,
      urgency_end_date,
      urgency_text,
      urgency_badge,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Le titre du produit est obligatoire.' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ error: 'L\'auteur du produit est obligatoire.' });
    }
    if (normal_price === undefined || normal_price === null) {
      return res.status(400).json({ error: 'Le prix normal est obligatoire.' });
    }

    const slug = req.body.slug || title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const id = req.body.id || `prod-${Date.now()}`;
    const now = new Date().toISOString();

    const keyPointsJson = Array.isArray(key_points)
      ? JSON.stringify(key_points)
      : (typeof key_points === 'string' ? JSON.stringify([key_points]) : '[]');

    const stmt = db.prepare(`
      INSERT INTO products (
        id, title, author, slug, cover, category, normal_price, sale_price,
        short_description, full_description, key_points, bonus, cta_text, audio_url,
        audio_download_url, product_details, product_url, is_best_seller, is_active,
        format, urgency_active, urgency_end_date, urgency_text, urgency_badge,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      title.trim(),
      author.trim(),
      slug,
      cover || '/src/assets/images/cover_business_empire_1790615532791.jpg',
      category || 'business-entrepreneuriat',
      Number(normal_price),
      sale_price !== null && sale_price !== undefined && sale_price !== '' ? Number(sale_price) : null,
      short_description || '',
      full_description || '',
      keyPointsJson,
      bonus || '',
      cta_text || '',
      audio_url || '',
      audio_download_url || '',
      product_details || '',
      product_url || `/produits/${slug}`,
      is_best_seller ? 1 : 0,
      is_active !== false ? 1 : 0,
      format || (audio_url ? 'audiobook' : 'ebook'),
      urgency_active ? 1 : 0,
      urgency_end_date || '',
      urgency_text || '',
      urgency_badge || '',
      now,
      now
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    res.status(201).json(formatProduct(created));
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id (Update all product fields)
app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    const {
      title,
      author,
      slug,
      cover,
      category,
      normal_price,
      sale_price,
      short_description,
      full_description,
      key_points,
      bonus,
      cta_text,
      audio_url,
      audio_download_url,
      product_details,
      product_url,
      is_best_seller,
      is_active,
      format,
      urgency_active,
      urgency_end_date,
      urgency_text,
      urgency_badge,
    } = req.body;

    const updatedSlug = slug || (title ? title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') : existing.slug);

    const now = new Date().toISOString();

    const keyPointsJson = key_points !== undefined
      ? (Array.isArray(key_points) ? JSON.stringify(key_points) : JSON.stringify([key_points]))
      : existing.key_points;

    const stmt = db.prepare(`
      UPDATE products
      SET
        title = ?,
        author = ?,
        slug = ?,
        cover = ?,
        category = ?,
        normal_price = ?,
        sale_price = ?,
        short_description = ?,
        full_description = ?,
        key_points = ?,
        bonus = ?,
        cta_text = ?,
        audio_url = ?,
        audio_download_url = ?,
        product_details = ?,
        product_url = ?,
        is_best_seller = ?,
        is_active = ?,
        format = ?,
        urgency_active = ?,
        urgency_end_date = ?,
        urgency_text = ?,
        urgency_badge = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      title !== undefined ? title.trim() : existing.title,
      author !== undefined ? author.trim() : existing.author,
      updatedSlug,
      cover !== undefined ? cover : existing.cover,
      category !== undefined ? category : existing.category,
      normal_price !== undefined ? Number(normal_price) : existing.normal_price,
      sale_price !== undefined ? (sale_price !== null && sale_price !== '' ? Number(sale_price) : null) : existing.sale_price,
      short_description !== undefined ? short_description : existing.short_description,
      full_description !== undefined ? full_description : existing.full_description,
      keyPointsJson,
      bonus !== undefined ? bonus : existing.bonus,
      cta_text !== undefined ? cta_text : (existing.cta_text || ''),
      audio_url !== undefined ? audio_url : existing.audio_url,
      audio_download_url !== undefined ? audio_download_url : (existing.audio_download_url || ''),
      product_details !== undefined ? product_details : (existing.product_details || ''),
      product_url !== undefined ? product_url : existing.product_url,
      is_best_seller !== undefined ? (is_best_seller ? 1 : 0) : existing.is_best_seller,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      format !== undefined ? format : (existing.format || 'audiobook'),
      urgency_active !== undefined ? (urgency_active ? 1 : 0) : (existing.urgency_active || 0),
      urgency_end_date !== undefined ? urgency_end_date : (existing.urgency_end_date || ''),
      urgency_text !== undefined ? urgency_text : (existing.urgency_text || ''),
      urgency_badge !== undefined ? urgency_badge : (existing.urgency_badge || ''),
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    res.json(formatProduct(updated));
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/products/:id/toggle-active
app.patch('/api/products/:id/toggle-active', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    const nextStatus = existing.is_active ? 0 : 1;
    const now = new Date().toISOString();

    db.prepare('UPDATE products SET is_active = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    res.json(formatProduct(updated));
  } catch (error: any) {
    console.error('Error toggling product status:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/products/:id/toggle-bestseller
app.patch('/api/products/:id/toggle-bestseller', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    const nextStatus = existing.is_best_seller ? 0 : 1;
    const now = new Date().toISOString();

    db.prepare('UPDATE products SET is_best_seller = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    res.json(formatProduct(updated));
  } catch (error: any) {
    console.error('Error toggling product bestseller:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products/generate-ai (Generates professional copywriting with Gemini AI + category suggestion)
app.post('/api/products/generate-ai', async (req, res) => {
  try {
    const { title, author, category, bonus, existing_categories } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Le titre du livre est obligatoire pour la génération IA.' });
    }
    if (!author || !String(author).trim()) {
      return res.status(400).json({ error: 'Le nom de l\'auteur est obligatoire pour la génération IA.' });
    }

    const cleanTitle = String(title).trim();
    const cleanAuthor = String(author).trim();
    const cleanCategory = String(category || 'Business & Entrepreneuriat').trim();
    const cleanBonus = String(bonus || '').trim();

    // Fetch existing categories from DB if not passed
    let dbCategories: Array<{ id: string; name: string; slug: string }> = [];
    if (Array.isArray(existing_categories) && existing_categories.length > 0) {
      dbCategories = existing_categories;
    } else {
      try {
        dbCategories = db.prepare('SELECT id, name, slug FROM categories WHERE is_active = 1').all() as any[];
      } catch {}
    }

    const catListStr = dbCategories.length > 0
      ? dbCategories.map((c) => `- "${c.name}" (slug: ${c.slug})`).join('\n')
      : '- "Business & Entrepreneuriat" (slug: business-entrepreneuriat)\n- "Finance & Investissement" (slug: finance-investissement)\n- "Mindset & Leadership" (slug: mindset-leadership)\n- "Productivité & Organisation" (slug: productivite-organisation)';

    const systemPrompt = `Tu es l'expert concepteur-rédacteur et copywriter d'élite de VISION BOOKS, la référence des livres audio premium pour entrepreneurs, cadres, investisseurs et visionnaires.
Tu dois générer des textes commerciaux de niveau professionnel pour la fiche d'un livre audio, ainsi qu'une recommandation stratégique de catégorie.

INFORMATIONS FOURNIES PAR L'ADMINISTRATEUR :
- Titre du livre : "${cleanTitle}"
- Auteur : "${cleanAuthor}"
- Catégorie actuelle suggérée : "${cleanCategory}"
- Bonus disponible : ${cleanBonus ? `"${cleanBonus}"` : 'Aucun bonus spécifique indiqué'}

CATÉGORIES EXISTANTES DANS VISION BOOKS :
${catListStr}

CONSIGNES STRICTES :
1. Professionnalisme & Crédibilité : Utilise un style soigné, percutant, valorisant et haut de gamme.
2. Respect de la vérité : Ne jamais inventer d'anecdotes biographiques fictives ou de faits inventés. Développe les bénéfices, principes et méthodes suggérés par le sujet.
3. Proposition de Catégorie :
   - Analyse le titre et l'auteur.
   - Si une des catégories existantes correspond bien au livre, CHOISIS-LA en priorité (is_new: false).
   - Ne crée PAS une nouvelle catégorie inutilement si une catégorie existante convient.
   - Si et seulement si AUCUNE catégorie existante ne correspond (par exemple sujet très spécifique non couvert), propose une nouvelle catégorie cohérente (is_new: true, avec nom concis, slug en minuscules séparé par des tirets, icône emoji représentative et description courte).
   - Fournis une justification courte et logique (rationale).
4. Langue : Français impeccable et captivant.

TU DOIS RÉPONDRE STRICTEMENT PAR UN OBJET JSON VALIDE respectant ce format :
{
  "full_description": "Une description commerciale captivante et structurée (2 à 3 paragraphes fluides) exposant les enjeux, la thèse centrale, et la transformation apportée par l'écoute de ce livre audio.",
  "key_points": [
    "Premier bénéfice majeur ou compétence concrète acquise grâce à l'écoute.",
    "Deuxième bénéfice majeur ou méthode stratégique actionnable.",
    "Troisième bénéfice majeur ou levier de performance durable."
  ],
  "bonus_presentation": "${cleanBonus ? `Présentation valorisante et attractive du bonus : ${cleanBonus}, expliquant son utilité concrète pour l'auditeur.` : `Proposition d'un bonus digital pertinent et attractif pour accompagner ce livre audio (ex: Fiche mémo d'action ou Guide d'application pratique).`}",
  "short_description": "Un texte marketing court et percutant de 1 à 2 phrases conçu pour accrocher immédiatement l'attention dans le catalogue.",
  "cta_text": "Un CTA de conversion percutant et vendeur (ex: Commander le livre audio de ${cleanAuthor} sur WhatsApp).",
  "suggested_category": {
    "is_new": false,
    "name": "Nom de la catégorie choisie",
    "slug": "slug-de-la-categorie",
    "rationale": "Pourquoi cette catégorie convient parfaitement à ce livre.",
    "new_category_details": {
      "name": "Nom si nouvelle",
      "slug": "slug-si-nouveau",
      "icon": "💼",
      "description": "Courte description si nouvelle"
    }
  }
}`;

    let resultJson: any = null;

    // Call Google GenAI SDK
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI();
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: systemPrompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          });

          if (response && response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (parsed && parsed.full_description && parsed.short_description) {
              resultJson = parsed;
              break;
            }
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} call returned:`, err.message || err);
        }
      }
    } catch (sdkErr: any) {
      console.warn('GoogleGenAI SDK load error:', sdkErr?.message || sdkErr);
    }

    // High quality deterministic fallback if external AI service is unreachable
    if (!resultJson) {
      // Find matching existing category or default
      const matchedCat = dbCategories.find(c =>
        cleanTitle.toLowerCase().includes('finance') || cleanTitle.toLowerCase().includes('argent') ? c.slug.includes('finance') :
        cleanTitle.toLowerCase().includes('mindset') || cleanTitle.toLowerCase().includes('mental') ? c.slug.includes('mindset') :
        cleanTitle.toLowerCase().includes('temps') || cleanTitle.toLowerCase().includes('habitudes') ? c.slug.includes('productiv') :
        c.slug.includes('business')
      ) || dbCategories[0] || { name: 'Business & Entrepreneuriat', slug: 'business-entrepreneuriat' };

      resultJson = {
        full_description: `Dans un environnement économique et professionnel où la vitesse d'exécution fait la différence, "${cleanTitle}" s'impose comme un guide d'exception. À travers cet enregistrement audio de haute fidélité, ${cleanAuthor} partage une vision stratégique éprouvée, combinant rigueur analytique et mise en pratique immédiate dans le domaine ${cleanCategory}.\n\nChaque chapitre est conçu pour vous faire gagner un temps précieux, en synthétisant l'essentiel des concepts pour vous permettre d'anticiper les mutations et de prendre des décisions plus éclairées et profitables.`,
        key_points: [
          `Maîtriser les principes directeurs et les réflexes stratégiques développés par ${cleanAuthor}.`,
          `Éviter les écueils critiques grâce à des méthodes concrètes applicables dès aujourd'hui.`,
          `Bâtir un système d'exécution fiable et pérenne dans le secteur ${cleanCategory}.`
        ],
        bonus_presentation: cleanBonus
          ? `Inclus exclusivement avec votre commande : ${cleanBonus}. Un accélérateur d'apprentissage indispensable pour concrétiser chaque concept dès la première écoute.`
          : `Bonus Exclusif Offert : Fiche de synthèse actionnable en PDF + Plan d'exécution en 7 étapes pour transposer immédiatement les enseignements dans vos projets.`,
        short_description: `Découvrez "${cleanTitle}" de ${cleanAuthor} : le condensé audio indispensable pour accélérer vos résultats en ${cleanCategory}.`,
        cta_text: `Commander "${cleanTitle}" sur WhatsApp & débloquer le bonus`,
        suggested_category: {
          is_new: false,
          name: matchedCat.name,
          slug: matchedCat.slug,
          rationale: `Thématique cohérente avec le catalogue existant dans ${matchedCat.name}.`,
        }
      };
    }

    // Ensure 3 key points exactly
    let cleanedKeyPoints: string[] = [];
    if (Array.isArray(resultJson.key_points) && resultJson.key_points.length > 0) {
      cleanedKeyPoints = resultJson.key_points.map((k: any) => String(k).trim()).filter(Boolean).slice(0, 3);
    }
    while (cleanedKeyPoints.length < 3) {
      cleanedKeyPoints.push(`Intégrer les enseignements clés de "${cleanTitle}" dans votre routine quotidienne.`);
    }

    // Validate suggested category
    let finalSuggestedCategory = resultJson.suggested_category;
    if (!finalSuggestedCategory || !finalSuggestedCategory.name) {
      const defaultMatch = dbCategories[0] || { name: 'Business & Entrepreneuriat', slug: 'business-entrepreneuriat' };
      finalSuggestedCategory = {
        is_new: false,
        name: defaultMatch.name,
        slug: defaultMatch.slug,
        rationale: 'Catégorie la plus proche parmi les catégories existantes.',
      };
    }

    res.json({
      success: true,
      data: {
        full_description: String(resultJson.full_description || '').trim(),
        key_points: cleanedKeyPoints,
        bonus_presentation: String(resultJson.bonus_presentation || cleanBonus || '').trim(),
        short_description: String(resultJson.short_description || '').trim(),
        cta_text: String(resultJson.cta_text || `Commander "${cleanTitle}" sur WhatsApp`).trim(),
        suggested_category: finalSuggestedCategory,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/products/generate-ai:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération avec l\'IA.' });
  }
});

// POST /api/lead-magnets/generate-ai (Generates comprehensive marketing content for Lead Magnets with Gemini AI)
app.post('/api/lead-magnets/generate-ai', async (req, res) => {
  try {
    const { title, topic, target_audience, raw_content, field_to_regenerate, existing_values } = req.body;

    const cleanTitle = String(title || '').trim();
    const cleanTopic = String(topic || cleanTitle || 'Indépendance financière et business').trim();
    const cleanTarget = String(target_audience || 'Entrepreneurs, investisseurs, professionnels ambitieux').trim();
    const cleanContent = String(raw_content || '').trim();

    if (!cleanTitle && !cleanTopic) {
      return res.status(400).json({ error: 'Veuillez renseigner un titre ou un sujet pour la génération.' });
    }

    const systemPrompt = `Tu es le Directeur Marketing et Concepteur-Rédacteur d'élite de VISION BOOKS.
Tu conçois des Lead Magnets à fort taux de conversion pour capturer des prospects qualifiés (prénom + WhatsApp) et leur donner envie de découvrir nos livres audio premium.

INFORMATIONS FOURNIES PAR L'ADMINISTRATEUR :
- Titre ou idée de départ : "${cleanTitle || cleanTopic}"
- Sujet / Thématique clé : "${cleanTopic}"
- Cible visée : "${cleanTarget}"
- Contenu réel / Notes brutes : ${cleanContent ? `"${cleanContent}"` : 'Aucun contenu brut fourni, développer à partir de la thématique.'}
${field_to_regenerate ? `- CONSIGNE SPÉCIFIQUE : Régénère en priorité le champ "${field_to_regenerate}" avec une excellente accroche.` : ''}

CONSIGNES STRICTES DE COPYWRITING :
1. Clarté & Valeur perçue immédiate : L'offre gratuite doit donner une impression de valeur inestimable, pratique et actionnable.
2. Éthique & Professionnalisme : Promesses crédibles, pas de fausses promesses sensationnalistes irréalistes.
3. Langue : Français soigné, élégant et captivant.

TU DOIS RÉPONDRE STRICTEMENT PAR UN OBJET JSON VALIDE avec l'intégralité des 13 champs suivants :
{
  "title": "Un titre captivant, orienté résultat et curiosité",
  "subtitle": "Un sous-titre percutant qui clarifie la promesse majeure",
  "hook": "Une accroche forte (1 à 2 phrases) qui interpelle le lecteur sur son défi majeur",
  "description": "Une description persuasive et structurée (2 paragraphes) expliquant le problème résolu et la méthode apportée",
  "benefits": [
    "Premier bénéfice direct et concret",
    "Deuxième bénéfice majeur ou erreur évitée",
    "Troisième bénéfice ou modèle actionnable offert"
  ],
  "key_points": [
    "Point clé 1 : Première compétence ou méthode abordée",
    "Point clé 2 : Stratégie concrète d'application",
    "Point clé 3 : Outil ou plan d'action fourni"
  ],
  "visitor_content": "Le détail du contenu présenté au visiteur sur la page de capture (ex : 3 modules audio + fiche mémo PDF incluse)",
  "short_pitch": "Un pitch ultra-court de présentation (1 phrase percutante pour cartes et aperçus)",
  "cta_text": "Un appel à l'action pour le bouton (ex: Télécharger mon guide offert immédiatement)",
  "share_caption": "Une légende courte et percutante pour partager le Lead Magnet sur les réseaux sociaux",
  "social_post": "Un texte complet prêt à publier sur WhatsApp et les réseaux sociaux avec emojis soignés, mise en page aérée et appel au clic",
  "landing_text": "Un texte persuasif complet pour la page de capture (accroche, problème, solution offerte, appel à l'action)",
  "curiosity_hook": "Une courte phrase qui crée une curiosité irrésistible (ex : La règle méconnue que 95% des investisseurs ignorent avant leur premier achat)"
}`;

    let resultJson: any = null;

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI();
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: systemPrompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          });

          if (response && response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (parsed && parsed.title && parsed.description && parsed.cta_text) {
              resultJson = parsed;
              break;
            }
          }
        } catch (err: any) {
          console.warn(`Lead Magnet AI Model ${modelName} call returned:`, err.message || err);
        }
      }
    } catch (sdkErr: any) {
      console.warn('GoogleGenAI SDK load error:', sdkErr?.message || sdkErr);
    }

    // High quality deterministic fallback
    if (!resultJson) {
      const baseTitle = cleanTitle || `Guide Stratégique : Les Clés de ${cleanTopic}`;
      resultJson = {
        title: baseTitle,
        subtitle: `Le plan d'action pragmatique pour ${cleanTarget.toLowerCase()} qui souhaitent accélérer leurs résultats`,
        hook: `La plupart des personnes perdent des années par manque d'un cadre clair. Voici le raccourci éprouvé.`,
        description: `Ce guide exclusif condense les enseignements opérationnels tirés des meilleures pratiques pour maîtriser ${cleanTopic}.\n\nConçu pour une application immédiate, il vous donne les repères fondamentaux pour éviter les erreurs coûteuses et mettre en place un système durable.`,
        benefits: [
          `Clarifier vos priorités stratégiques en moins de 30 minutes.`,
          `Éliminer les pièges récurrents qui freinent 90% des débutants.`,
          `Disposer d'une checklist opérationnelle prête à l'emploi dès aujourd'hui.`
        ],
        key_points: [
          `Les 3 principes fondamentaux à maîtriser impérativement.`,
          `Étude de cas et méthodologie pas à pas.`,
          `Template d'exécution actionnable au quotidien.`
        ],
        visitor_content: `Guide complet au format numérique haute définition + Grille d'évaluation personnelle incluse.`,
        short_pitch: `Le condensé actionnable indispensable pour maîtriser ${cleanTopic} sans perdre de temps.`,
        cta_text: `Recevoir mon accès gratuit immédiatement`,
        share_caption: `🎁 Ressource offerte par VISION BOOKS : ${baseTitle}. Accès direct et gratuit !`,
        social_post: `🚀 *RESSOURCE PRIVILÈGE OFFERTE PAR VISION BOOKS*\n\nVous voulez franchir un cap sur *${cleanTopic}* ?\n\nNous venons de publier : *${baseTitle}*.\n\nAu programme :\n✅ Le plan d'action condensé\n✅ Les erreurs critiques à éviter\n✅ Le template prêt à l'emploi\n\n👉 Accès 100% gratuit en téléchargeant votre exemplaire maintenant.`,
        landing_text: `Rejoignez les dirigeants et entrepreneurs qui transforment leur approche grâce à nos méthodes exclusives. Indiquez simplement votre prénom et votre WhatsApp pour recevoir instantanément votre exemplaire.`,
        curiosity_hook: `Le principe contre-intuitif que les leaders appliquent en secret pour démultiplier leur impact.`
      };
    }

    // Format benefits and key_points as arrays of strings
    const benefitsList = Array.isArray(resultJson.benefits)
      ? resultJson.benefits.map((b: any) => String(b).trim()).filter(Boolean)
      : [
          'Gagner un temps précieux dès la première lecture.',
          'Éviter les erreurs fondamentales sur ce sujet.',
          'Bénéficier d\'un plan d\'action prêt à l\'emploi.'
        ];

    const keyPointsList = Array.isArray(resultJson.key_points)
      ? resultJson.key_points.map((k: any) => String(k).trim()).filter(Boolean)
      : [
          'Méthode pas à pas complète.',
          'Exemples concrets d\'application.',
          'Ressources complémentaires recommandées.'
        ];

    // If existing values were passed and only a single field was regenerated, merge
    if (field_to_regenerate && existing_values) {
      const merged = { ...existing_values };
      if (field_to_regenerate in resultJson) {
        merged[field_to_regenerate] = resultJson[field_to_regenerate];
      }
      return res.json({ success: true, data: merged });
    }

    res.json({
      success: true,
      data: {
        title: String(resultJson.title || cleanTitle).trim(),
        subtitle: String(resultJson.subtitle || '').trim(),
        hook: String(resultJson.hook || '').trim(),
        description: String(resultJson.description || '').trim(),
        benefits: benefitsList,
        key_points: keyPointsList,
        visitor_content: String(resultJson.visitor_content || '').trim(),
        short_pitch: String(resultJson.short_pitch || '').trim(),
        cta_text: String(resultJson.cta_text || 'Recevoir mon accès gratuit immédiatement').trim(),
        share_caption: String(resultJson.share_caption || '').trim(),
        social_post: String(resultJson.social_post || '').trim(),
        landing_text: String(resultJson.landing_text || '').trim(),
        curiosity_hook: String(resultJson.curiosity_hook || '').trim(),
      },
    });
  } catch (error: any) {
    console.error('Error in /api/lead-magnets/generate-ai:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération avec l\'IA.' });
  }
});

// ----------------------------------------------------
// LEAD MAGNETS API
// ----------------------------------------------------

function formatLeadMagnet(lm: any) {
  let benefitsArr: string[] = [];
  try {
    benefitsArr = typeof lm.benefits === 'string' ? JSON.parse(lm.benefits) : (lm.benefits || []);
  } catch {
    benefitsArr = lm.benefits ? [lm.benefits] : [];
  }

  let keyPointsArr: string[] = [];
  try {
    keyPointsArr = typeof lm.key_points === 'string' ? JSON.parse(lm.key_points) : (lm.key_points || []);
  } catch {
    keyPointsArr = lm.key_points ? [lm.key_points] : [];
  }

  return {
    id: lm.id,
    title: lm.title,
    slug: lm.slug,
    image: lm.image,
    description: lm.description,
    subtitle: lm.subtitle || '',
    marketing_content: lm.marketing_content || '',
    benefits: benefitsArr,
    file_url: lm.file_url,
    active: Boolean(lm.active),
    downloads_count: Number(lm.downloads_count || 0),
    created_at: lm.created_at,
    updated_at: lm.updated_at,
    // Format du Lead Magnet (Ebook 📚, Livre audio 🎧, Autre format 📦)
    format: lm.format || (lm.file_url && lm.file_url.includes('.mp3') ? 'audiobook' : 'ebook'),
    // Marketing content fields
    topic: lm.topic || '',
    target_audience: lm.target_audience || '',
    raw_content: lm.raw_content || '',
    hook: lm.hook || '',
    key_points: keyPointsArr,
    visitor_content: lm.visitor_content || '',
    short_pitch: lm.short_pitch || '',
    cta_text: lm.cta_text || 'Télécharger gratuitement',
    share_caption: lm.share_caption || '',
    social_post: lm.social_post || '',
    landing_text: lm.landing_text || '',
    curiosity_hook: lm.curiosity_hook || '',
    // Compatibility fields
    type: lm.format === 'audiobook' || (lm.file_url && lm.file_url.includes('.mp3')) ? 'Audio' : (lm.title && lm.title.toLowerCase().includes('checklist') ? 'Checklist' : 'PDF'),
    downloadsCount: Number(lm.downloads_count || 0),
    status: Boolean(lm.active) ? 'actif' : 'brouillon',
    associatedCategory: 'Business & Réussite',
  };
}

// GET /api/lead-magnets
app.get('/api/lead-magnets', (req, res) => {
  try {
    const activeOnly = req.query.active_only === 'true';
    const query = activeOnly
      ? 'SELECT * FROM lead_magnets WHERE active = 1 ORDER BY created_at DESC'
      : 'SELECT * FROM lead_magnets ORDER BY created_at DESC';
    const rows = db.prepare(query).all();
    res.json(rows.map(formatLeadMagnet));
  } catch (error: any) {
    console.error('Error fetching lead magnets:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lead-magnets/:id (or by slug)
app.get('/api/lead-magnets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const lm = db.prepare('SELECT * FROM lead_magnets WHERE id = ? OR slug = ?').get(id, id) as any;
    if (!lm) {
      return res.status(404).json({ error: 'Lead Magnet non trouvé.' });
    }
    res.json(formatLeadMagnet(lm));
  } catch (error: any) {
    console.error('Error fetching lead magnet:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lead-magnets
app.post('/api/lead-magnets', (req, res) => {
  try {
    const {
      title,
      subtitle,
      marketing_content,
      slug,
      image,
      description,
      benefits,
      file_url,
      active,
      format,
      topic,
      target_audience,
      raw_content,
      hook,
      key_points,
      visitor_content,
      short_pitch,
      cta_text,
      share_caption,
      social_post,
      landing_text,
      curiosity_hook,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Le titre du Lead Magnet est obligatoire.' });
    }

    const baseSlug = slug || title;
    const finalSlug = getUniqueSlug('lead_magnets', baseSlug);
    const id = req.body.id || `lm-${Date.now()}`;
    const now = new Date().toISOString();
    const activeInt = active !== false ? 1 : 0;

    const benefitsJson = Array.isArray(benefits)
      ? JSON.stringify(benefits)
      : (typeof benefits === 'string' ? JSON.stringify(benefits.split('\n').filter(Boolean)) : '[]');

    const keyPointsJson = Array.isArray(key_points)
      ? JSON.stringify(key_points)
      : (typeof key_points === 'string' ? JSON.stringify(key_points.split('\n').filter(Boolean)) : '[]');

    const stmt = db.prepare(`
      INSERT INTO lead_magnets (
        id, title, subtitle, marketing_content, slug, image, description, benefits, file_url, active,
        format, topic, target_audience, raw_content, hook, key_points, visitor_content, short_pitch,
        cta_text, share_caption, social_post, landing_text, curiosity_hook,
        downloads_count, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      title.trim(),
      subtitle || '',
      marketing_content || '',
      finalSlug,
      image || '/src/assets/images/cover_financial_liberty_1790615544438.jpg',
      description || '',
      benefitsJson,
      file_url || `/downloads/${finalSlug}.pdf`,
      activeInt,
      format || 'ebook',
      topic || '',
      target_audience || '',
      raw_content || '',
      hook || '',
      keyPointsJson,
      visitor_content || '',
      short_pitch || '',
      cta_text || 'Télécharger gratuitement',
      share_caption || '',
      social_post || '',
      landing_text || '',
      curiosity_hook || '',
      0,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM lead_magnets WHERE id = ?').get(id) as any;
    res.status(201).json(formatLeadMagnet(created));
  } catch (error: any) {
    console.error('Error creating lead magnet:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/lead-magnets/:id
app.put('/api/lead-magnets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM lead_magnets WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Lead Magnet non trouvé.' });
    }

    const {
      title,
      subtitle,
      marketing_content,
      slug,
      image,
      description,
      benefits,
      file_url,
      active,
      format,
      topic,
      target_audience,
      raw_content,
      hook,
      key_points,
      visitor_content,
      short_pitch,
      cta_text,
      share_caption,
      social_post,
      landing_text,
      curiosity_hook,
    } = req.body;

    const baseSlug = slug || title || existing.slug;
    const finalSlug = getUniqueSlug('lead_magnets', baseSlug, id);
    const now = new Date().toISOString();
    const activeInt = active !== undefined ? (active ? 1 : 0) : existing.active;

    const benefitsJson = benefits !== undefined
      ? (Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify(String(benefits).split('\n').filter(Boolean)))
      : existing.benefits;

    const keyPointsJson = key_points !== undefined
      ? (Array.isArray(key_points) ? JSON.stringify(key_points) : JSON.stringify(String(key_points).split('\n').filter(Boolean)))
      : (existing.key_points || '[]');

    const stmt = db.prepare(`
      UPDATE lead_magnets
      SET
        title = ?,
        subtitle = ?,
        marketing_content = ?,
        slug = ?,
        image = ?,
        description = ?,
        benefits = ?,
        file_url = ?,
        active = ?,
        format = ?,
        topic = ?,
        target_audience = ?,
        raw_content = ?,
        hook = ?,
        key_points = ?,
        visitor_content = ?,
        short_pitch = ?,
        cta_text = ?,
        share_caption = ?,
        social_post = ?,
        landing_text = ?,
        curiosity_hook = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      title !== undefined ? title.trim() : existing.title,
      subtitle !== undefined ? subtitle : (existing.subtitle || ''),
      marketing_content !== undefined ? marketing_content : (existing.marketing_content || ''),
      finalSlug,
      image !== undefined ? image : existing.image,
      description !== undefined ? description : existing.description,
      benefitsJson,
      file_url !== undefined ? file_url : existing.file_url,
      activeInt,
      format !== undefined ? format : (existing.format || 'ebook'),
      topic !== undefined ? topic : (existing.topic || ''),
      target_audience !== undefined ? target_audience : (existing.target_audience || ''),
      raw_content !== undefined ? raw_content : (existing.raw_content || ''),
      hook !== undefined ? hook : (existing.hook || ''),
      keyPointsJson,
      visitor_content !== undefined ? visitor_content : (existing.visitor_content || ''),
      short_pitch !== undefined ? short_pitch : (existing.short_pitch || ''),
      cta_text !== undefined ? cta_text : (existing.cta_text || 'Télécharger gratuitement'),
      share_caption !== undefined ? share_caption : (existing.share_caption || ''),
      social_post !== undefined ? social_post : (existing.social_post || ''),
      landing_text !== undefined ? landing_text : (existing.landing_text || ''),
      curiosity_hook !== undefined ? curiosity_hook : (existing.curiosity_hook || ''),
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM lead_magnets WHERE id = ?').get(id) as any;
    res.json(formatLeadMagnet(updated));
  } catch (error: any) {
    console.error('Error updating lead magnet:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/lead-magnets/:id/toggle
app.patch('/api/lead-magnets/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM lead_magnets WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Lead Magnet non trouvé.' });
    }

    const nextStatus = existing.active ? 0 : 1;
    const now = new Date().toISOString();

    db.prepare('UPDATE lead_magnets SET active = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, id);

    const updated = db.prepare('SELECT * FROM lead_magnets WHERE id = ?').get(id) as any;
    res.json(formatLeadMagnet(updated));
  } catch (error: any) {
    console.error('Error toggling lead magnet status:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/lead-magnets/:id
app.delete('/api/lead-magnets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM lead_magnets WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Lead Magnet non trouvé.' });
    }

    db.prepare('DELETE FROM lead_magnets WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting lead magnet:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lead-magnets/:id/download
app.post('/api/lead-magnets/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM lead_magnets WHERE id = ? OR slug = ?').get(id, id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Lead Magnet non trouvé.' });
    }

    const nextDownloads = (existing.downloads_count || 0) + 1;
    db.prepare('UPDATE lead_magnets SET downloads_count = ? WHERE id = ?').run(nextDownloads, existing.id);

    res.json({
      success: true,
      downloads_count: nextDownloads,
      file_url: existing.file_url,
      download_url: `/downloads/${existing.slug}.pdf`
    });
  } catch (error: any) {
    console.error('Error recording download:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// LEADS API
// ----------------------------------------------------

// Format raw SQLite lead row
function formatLead(l: any) {
  let dateStr = '';
  let timeStr = '';
  if (l.created_at) {
    if (l.created_at.includes('T')) {
      const d = new Date(l.created_at);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
    } else {
      const parts = l.created_at.split(' ');
      dateStr = parts[0] || l.created_at;
      timeStr = parts[1] || '';
    }
  }

  return {
    id: l.id,
    first_name: l.first_name,
    whatsapp: l.whatsapp,
    lead_magnet_id: l.lead_magnet_id || '',
    lead_magnet_title: l.lead_magnet_title || (l.lead_magnet_id ? 'Lead Magnet' : 'Général'),
    source: l.source || 'Page de capture',
    created_at: l.created_at,
    date: dateStr || l.created_at,
    time: timeStr || '—',
    // Séquence de Relances J1, J2, J3
    followup_j1: l.followup_j1 || '',
    followup_j2: l.followup_j2 || '',
    followup_j3: l.followup_j3 || '',
    followup_generated_at: l.followup_generated_at || '',
    followup_updated_at: l.followup_updated_at || '',
    followup_status_j1: l.followup_status_j1 || 'a_envoyer',
    followup_status_j2: l.followup_status_j2 || 'a_envoyer',
    followup_status_j3: l.followup_status_j3 || 'a_envoyer',
    // Backwards compatibility with previous admin components
    name: l.first_name,
    phone: l.whatsapp,
    email: `${l.first_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@lead.visionbooks`,
    status: 'nouveau',
    createdAt: l.created_at,
  };
}

// GET /api/leads
app.get('/api/leads', (req, res) => {
  try {
    const leads = db.prepare(`
      SELECT leads.*, lead_magnets.title as lead_magnet_title
      FROM leads
      LEFT JOIN lead_magnets ON leads.lead_magnet_id = lead_magnets.id
      ORDER BY leads.created_at DESC
    `).all();

    res.json(leads.map(formatLead));
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leads
app.post('/api/leads', (req, res) => {
  try {
    const { first_name, whatsapp, lead_magnet_id, source } = req.body;

    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ error: 'Le prénom est obligatoire.' });
    }
    if (!whatsapp || !whatsapp.trim()) {
      return res.status(400).json({ error: 'Le numéro WhatsApp est obligatoire.' });
    }

    // Validation stricte du numéro WhatsApp : au moins 8 chiffres requis
    const cleanDigits = whatsapp.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 8 || cleanDigits.length > 16) {
      return res.status(400).json({
        error: 'Veuillez renseigner un numéro WhatsApp valide avec votre indicatif pays (au moins 8 chiffres).'
      });
    }

    const id = req.body.id || `lead-${Date.now()}`;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const stmt = db.prepare(`
      INSERT INTO leads (id, first_name, whatsapp, lead_magnet_id, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      first_name.trim(),
      whatsapp.trim(),
      lead_magnet_id || null,
      source || 'Page de capture',
      formattedDate
    );

    // If lead magnet associated, increment downloads count
    let fileUrl = '/downloads/guide-visionbooks.pdf';
    if (lead_magnet_id) {
      const lm = db.prepare('SELECT id, file_url, downloads_count FROM lead_magnets WHERE id = ? OR slug = ?').get(lead_magnet_id, lead_magnet_id) as any;
      if (lm) {
        db.prepare('UPDATE lead_magnets SET downloads_count = downloads_count + 1 WHERE id = ?').run(lm.id);
        if (lm.file_url) fileUrl = lm.file_url;
      }
    }

    const created = db.prepare(`
      SELECT leads.*, lead_magnets.title as lead_magnet_title
      FROM leads
      LEFT JOIN lead_magnets ON leads.lead_magnet_id = lead_magnets.id
      WHERE leads.id = ?
    `).get(id) as any;

    res.status(201).json({
      success: true,
      lead: formatLead(created),
      download_url: fileUrl,
    });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leads/generate-followup (IA - Génération de message de relance personnalisé)
app.post('/api/leads/generate-followup', async (req, res) => {
  try {
    const { first_name, whatsapp, lead_magnet_title } = req.body;
    const cleanName = String(first_name || 'Cher lecteur').trim();
    const cleanLmTitle = String(lead_magnet_title || 'notre guide offert').trim();

    // Fetch popular books to recommend
    const sampleProduct = db.prepare('SELECT title, author, slug, normal_price, sale_price FROM products WHERE is_active = 1 AND is_best_seller = 1 LIMIT 1').get() as any
      || db.prepare('SELECT title, author, slug, normal_price, sale_price FROM products WHERE is_active = 1 LIMIT 1').get() as any
      || { title: "L'Empire du Business Moderne", author: "Marc Vasseur" };

    const prompt = `Tu es le conseiller stratégique personnel de la maison d'édition audio VISION BOOKS (livres audio d'exception en business, finance, mindset et investissement).
Un prospect a téléchargé notre ressource gratuite :
- Prénom du prospect : "${cleanName}"
- Ressource offerte téléchargée : "${cleanLmTitle}"
- Livre audio recommandé dans notre collection : "${sampleProduct.title}" par ${sampleProduct.author}

Rédige un message WhatsApp de relance naturel, professionnel, courtois et personnalisé.

CONSIGNES STRICTES :
1. Utilise le prénom du prospect (${cleanName}) avec courtoisie.
2. Rappelle avec bienveillance le Lead Magnet téléchargé (« ${cleanLmTitle} »).
3. Apporte une petite valeur concrète supplémentaire en 1 ou 2 phrases liée au thème (un principe clé ou conseil actionnable).
4. Fais le lien avec subtilité vers les livres audio VISION BOOKS, en suggérant d'approfondir avec « ${sampleProduct.title} ».
5. Inclus un appel à l'action (CTA) clair et sans pression (ex: demander s'il a pu débuter la lecture ou s'il souhaite recevoir un court extrait audio offert).
6. Le ton doit rester humain, élégant, chaleureux et non agressif (zéro spam).
7. Inclus 2 ou 3 emojis pertinents (ex: 🎧, 💡, 📚).

Réponds DIRECTEMENT avec le texte brut du message WhatsApp prêt à être copié et envoyé, sans explications ni guillemets d'introduction.`;

    let generatedMessage = '';
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI();
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      for (const m of modelsToTry) {
        try {
          const resp = await ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              temperature: 0.7,
            }
          });
          if (resp && resp.text && resp.text.trim()) {
            generatedMessage = resp.text.trim();
            break;
          }
        } catch (e: any) {
          console.warn(`Model ${m} error:`, e.message);
        }
      }
    } catch (sdkErr: any) {
      console.warn('Gemini SDK error:', sdkErr?.message);
    }

    if (!generatedMessage) {
      generatedMessage = `Bonjour ${cleanName} ! 🎧 J'espère que vous allez bien.

Je fais suite à votre téléchargement de « ${cleanLmTitle} » sur VISION BOOKS. 

Le plus grand secret des leaders qui réussissent ne réside pas dans l'accumulation d'informations, mais dans l'exécution immédiate d'un principe clé dès la première lecture.

Si vous souhaitez passer à la vitesse supérieure, notre livre audio « ${sampleProduct.title} » par ${sampleProduct.author} détaille la méthode intégrale étape par étape.

Avez-vous eu l'opportunité de parcourir votre guide ? Je reste disponible si vous avez la moindre question ! 📚✨`;
    }

    res.json({ message: generatedMessage });
  } catch (error: any) {
    console.error('Error generating follow-up message:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération du message de relance' });
  }
});

// PUT /api/leads/:id (Update lead, including follow-up sequence & statuses)
app.put('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Lead non trouvé.' });
    }

    const {
      first_name,
      whatsapp,
      lead_magnet_id,
      source,
      followup_j1,
      followup_j2,
      followup_j3,
      followup_generated_at,
      followup_updated_at,
      followup_status_j1,
      followup_status_j2,
      followup_status_j3,
    } = req.body;

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE leads
      SET first_name = ?,
          whatsapp = ?,
          lead_magnet_id = ?,
          source = ?,
          followup_j1 = ?,
          followup_j2 = ?,
          followup_j3 = ?,
          followup_generated_at = ?,
          followup_updated_at = ?,
          followup_status_j1 = ?,
          followup_status_j2 = ?,
          followup_status_j3 = ?
      WHERE id = ?
    `);

    stmt.run(
      first_name !== undefined ? first_name : existing.first_name,
      whatsapp !== undefined ? whatsapp : existing.whatsapp,
      lead_magnet_id !== undefined ? lead_magnet_id : existing.lead_magnet_id,
      source !== undefined ? source : existing.source,
      followup_j1 !== undefined ? followup_j1 : (existing.followup_j1 || ''),
      followup_j2 !== undefined ? followup_j2 : (existing.followup_j2 || ''),
      followup_j3 !== undefined ? followup_j3 : (existing.followup_j3 || ''),
      followup_generated_at !== undefined ? followup_generated_at : (existing.followup_generated_at || ''),
      followup_updated_at !== undefined ? followup_updated_at : now,
      followup_status_j1 !== undefined ? followup_status_j1 : (existing.followup_status_j1 || 'a_envoyer'),
      followup_status_j2 !== undefined ? followup_status_j2 : (existing.followup_status_j2 || 'a_envoyer'),
      followup_status_j3 !== undefined ? followup_status_j3 : (existing.followup_status_j3 || 'a_envoyer'),
      id
    );

    const updated = db.prepare(`
      SELECT leads.*, lead_magnets.title as lead_magnet_title
      FROM leads
      LEFT JOIN lead_magnets ON leads.lead_magnet_id = lead_magnets.id
      WHERE leads.id = ?
    `).get(id);

    res.json(formatLead(updated));
  } catch (error: any) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leads/generate-sequence (IA - Génération de séquence marketing J1, J2, J3)
app.post('/api/leads/generate-sequence', async (req, res) => {
  try {
    const { lead_id, first_name, whatsapp, lead_magnet_id, lead_magnet_title, step } = req.body;
    const cleanName = String(first_name || 'Cher lecteur').trim();
    let cleanLmTitle = String(lead_magnet_title || '').trim();

    // 1. Fetch Lead Magnet details from DB if available
    let lm: any = null;
    if (lead_magnet_id) {
      lm = db.prepare('SELECT * FROM lead_magnets WHERE id = ?').get(lead_magnet_id) as any;
    }
    if (!lm && cleanLmTitle) {
      lm = db.prepare('SELECT * FROM lead_magnets WHERE title = ?').get(cleanLmTitle) as any;
    }
    if (lm) {
      cleanLmTitle = lm.title;
    } else if (!cleanLmTitle) {
      cleanLmTitle = 'notre guide stratégique offert';
    }

    let lmBenefitsStr = '';
    if (lm && lm.benefits) {
      try {
        const parsed = typeof lm.benefits === 'string' ? JSON.parse(lm.benefits) : lm.benefits;
        if (Array.isArray(parsed)) lmBenefitsStr = parsed.join(', ');
      } catch (_) {
        lmBenefitsStr = String(lm.benefits);
      }
    }

    // 2. Fetch active public products and find the most relevant match for J3
    const activeProducts = db.prepare(`
      SELECT id, title, author, slug, category, normal_price, sale_price, short_description, key_points, bonus
      FROM products
      WHERE is_active = 1
      ORDER BY is_best_seller DESC, id ASC
    `).all() as any[];

    let matchedProduct = activeProducts[0] || {
      title: "L'Empire du Business Moderne",
      author: "Marc de Saint-Clair",
      slug: "l-empire-du-business-moderne",
      normal_price: 49.90,
      sale_price: 29.90,
      short_description: "La référence pour bâtir une entreprise rentable et durable."
    };

    if (lm && activeProducts.length > 0) {
      const lmHaystack = `${lm.title} ${lm.description || ''} ${lmBenefitsStr}`.toLowerCase();
      for (const prod of activeProducts) {
        const prodHaystack = `${prod.title} ${prod.category} ${prod.short_description || ''}`.toLowerCase();
        if (
          (lmHaystack.includes('financ') || lmHaystack.includes('libert')) && (prodHaystack.includes('financ') || prodHaystack.includes('libert')) ||
          (lmHaystack.includes('mindset') || lmHaystack.includes('mental')) && (prodHaystack.includes('mindset') || prodHaystack.includes('pouvoir')) ||
          (lmHaystack.includes('négoci') || lmHaystack.includes('vente') || lmHaystack.includes('convaincre')) && (prodHaystack.includes('marketing') || prodHaystack.includes('business')) ||
          (lmHaystack.includes('trading') || lmHaystack.includes('marché') || lmHaystack.includes('bourse')) && (prodHaystack.includes('trading') || prodHaystack.includes('marché'))
        ) {
          matchedProduct = prod;
          break;
        }
      }
    }

    const priceText = matchedProduct.sale_price
      ? `${matchedProduct.sale_price} € (au lieu de ${matchedProduct.normal_price} €)`
      : `${matchedProduct.normal_price} €`;

    // 3. Settings: WhatsApp number
    const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'whatsapp_number'").get() as any;
    const whatsappNumber = settingsRow?.value || '+33 6 12 34 56 78';

    // 4. Construct AI Prompt
    const systemPrompt = `Tu es l'expert en relation client et conseiller éditorial de VISION BOOKS (maison d'édition de livres audio d'exception pour entrepreneurs, investisseurs et visionnaires).
Ta mission est de concevoir des messages de relance WhatsApp ultra-personnalisés, chaleureux, éducatifs et percutants pour un prospect ayant téléchargé une ressource gratuite.

INFORMATIONS EXACTES ET VÉRIFIÉES :
- Prénom du prospect : "${cleanName}"
- Ressource offerte téléchargée : "${cleanLmTitle}"
${lm ? `- Description du guide : "${lm.description}"
${lmBenefitsStr ? `- Bénéfices clés du guide : "${lmBenefitsStr}"` : ''}` : ''}
- Livre audio recommandé dans notre catalogue public (pour J3) :
  * Titre : "${matchedProduct.title}"
  * Auteur : "${matchedProduct.author}"
  * Prix : ${priceText}
  * Description : "${matchedProduct.short_description || ''}"
  * Fiche produit : "/produit/${matchedProduct.slug}"
- Numéro WhatsApp officiel VISION BOOKS : "${whatsappNumber}"

CONSIGNES PARTICULIÈRES :
- Varie naturellement les salutations (ne commence pas chaque message par "Bonjour ${cleanName}").
- Reste concis, humain, élégant, fluide et parfaitement formaté pour la lecture sur WhatsApp (avec des sauts de ligne réguliers).
- ZÉRO fausse promesse, ZÉRO résultat miraculeux inventé.
- Inclus 1 à 3 emojis pertinents par message (🎧, 💡, 📈).
- Ne jamais inventer d'information qui ne figure pas ci-dessus.`;

    let userInstruction = '';
    if (step === 'J1') {
      userInstruction = `Rédige UNIQUEMENT le message J1 — VALEUR ET ÉDUCATION :
- Rappelle le téléchargement de « ${cleanLmTitle} ».
- Apporte une idée forte, un conseil actionnable ou une prise de conscience utile en lien direct avec le sujet.
- Zéro vente agressive, pas de lien produit.
- Crée naturellement l'envie d'échanger en posant une question pertinente.
- Réponds en JSON : { "j1": "..." }`;
    } else if (step === 'J2') {
      userInstruction = `Rédige UNIQUEMENT le message J2 — HISTOIRE ET PRISE DE CONSCIENCE :
- Amorce originale (ex: "Hello ${cleanName}, je pensais à une situation concrte ce matin...").
- Courte anecdote, mise en situation ou exemple concret crédible illustrant le défi traité dans « ${cleanLmTitle} ».
- Termine par une question stimulante qui encourage la réflexion.
- Pas de vente directe.
- Réponds en JSON : { "j2": "..." }`;
    } else if (step === 'J3') {
      userInstruction = `Rédige UNIQUEMENT le message J3 — TRANSITION VERS L'OFFRE :
- Apporte une dernière clé de valeur.
- Fais le lien avec notre livre audio « ${matchedProduct.title} » de ${matchedProduct.author}.
- Utilise son vrai titre, auteur et tarif (${priceText}).
- Explique pourquoi ce livre audio permet d'aller plus loin que le guide offert.
- Propose une invitation chaleureuse et sans pression à découvrir un extrait ou commander sur WhatsApp en répondant à ce message.
- Réponds en JSON : { "j3": "..." }`;
    } else {
      userInstruction = `Rédige les 3 messages de la séquence dans un objet JSON strict avec les clés "j1", "j2", "j3" :
1. "j1" (Valeur et éducation) : Rappel bienveillant du guide « ${cleanLmTitle} », valeur concrète et question d'ouverture (zéro vente).
2. "j2" (Histoire et prise de conscience) : Amorce variée, courte histoire ou mise en situation concrète crédible, question de réflexion (zéro vente).
3. "j3" (Transition vers l'offre) : Valeur finale, recommandation exclusive du livre « ${matchedProduct.title} » par ${matchedProduct.author} à ${priceText}, invitation naturelle et bienveillante à échanger ou commander sur WhatsApp.`;
    }

    const fullPrompt = `${systemPrompt}\n\n${userInstruction}`;

    let resultJson: any = null;

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI();
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      for (const m of modelsToTry) {
        try {
          const resp = await ai.models.generateContent({
            model: m,
            contents: fullPrompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          });
          if (resp && resp.text && resp.text.trim()) {
            const parsed = JSON.parse(resp.text.trim());
            if (parsed && (parsed.j1 || parsed.j2 || parsed.j3)) {
              resultJson = parsed;
              break;
            }
          }
        } catch (e: any) {
          console.warn(`Model ${m} sequence error:`, e.message);
        }
      }
    } catch (sdkErr: any) {
      console.warn('Gemini SDK load error:', sdkErr?.message);
    }

    // High quality deterministic fallbacks if Gemini is unreachable
    const fallbackJ1 = `Bonjour ${cleanName} ! 🎧

J'espère que vous avez pu ouvrir « ${cleanLmTitle} ». 

La plupart des personnes accumulent les documents sans les appliquer. Si vous ne devez retenir qu'un seul réflexe aujourd'hui : isolez une seule idée clé et appliquez-la dans vos 24 prochaines heures.

Avez-vous eu l'occasion d'en parcourir les premières pages ? Qu'en pensez-vous pour l'instant ? 💡`;

    const fallbackJ2 = `Hello ${cleanName},

Je pensais à une situation très courante ce matin : beaucoup d'entrepreneurs et de professionnels travaillent d'arrache-pied, mais restent bloqués parce qu'ils appliquent de vieux schémas à de nouveaux défis.

C'est exactement ce que nous cherchons à débloquer avec « ${cleanLmTitle} ». La vraie différence entre ceux qui stagnent et ceux qui avancent réside dans la clarté de leur modèle d'action.

Quel est votre plus grand levier de progression en ce moment ? ✨`;

    const fallbackJ3 = `${cleanName}, j'espère que votre semaine se déroule au mieux !

Pour aller plus loin que les principes condensés dans votre guide, nous avons produit une masterclass audio intégrale : « ${matchedProduct.title} » par ${matchedProduct.author}.

Cet enregistrement studio haute fidélité (320 kbps) vous guide pas à pas avec les modèles mentaux et les plans d'action immédiatement applicables. Il est actuellement proposé au tarif privilégié de ${priceText}, avec accès illimité à vie et sans abonnement.

Si vous souhaitez en écouter un extrait offert ou le commander en 1 clic, répondez simplement à ce message WhatsApp ! 🎧📚`;

    const finalJ1 = resultJson?.j1 || fallbackJ1;
    const finalJ2 = resultJson?.j2 || fallbackJ2;
    const finalJ3 = resultJson?.j3 || fallbackJ3;

    const generatedAt = new Date().toISOString();

    // If lead_id provided, update SQLite directly
    if (lead_id) {
      try {
        if (step === 'J1') {
          db.prepare('UPDATE leads SET followup_j1 = ?, followup_updated_at = ? WHERE id = ?').run(finalJ1, generatedAt, lead_id);
        } else if (step === 'J2') {
          db.prepare('UPDATE leads SET followup_j2 = ?, followup_updated_at = ? WHERE id = ?').run(finalJ2, generatedAt, lead_id);
        } else if (step === 'J3') {
          db.prepare('UPDATE leads SET followup_j3 = ?, followup_updated_at = ? WHERE id = ?').run(finalJ3, generatedAt, lead_id);
        } else {
          db.prepare(`
            UPDATE leads
            SET followup_j1 = ?, followup_j2 = ?, followup_j3 = ?, followup_generated_at = ?, followup_updated_at = ?
            WHERE id = ?
          `).run(finalJ1, finalJ2, finalJ3, generatedAt, generatedAt, lead_id);
        }
      } catch (dbErr) {
        console.warn('Could not auto-save generated sequence to SQLite lead:', dbErr);
      }
    }

    res.json({
      success: true,
      j1: finalJ1,
      j2: finalJ2,
      j3: finalJ3,
      recommendedProduct: {
        title: matchedProduct.title,
        author: matchedProduct.author,
        slug: matchedProduct.slug,
        price: priceText,
      },
      generated_at: generatedAt,
    });
  } catch (error: any) {
    console.error('Error generating follow-up sequence:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération de la séquence de relance' });
  }
});

// DELETE /api/leads/:id
app.delete('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Lead non trouvé.' });
    }

    db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// COMMERCIAL ASSISTANT (GEMINI AI CHAT)
// ----------------------------------------------------
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { messages = [], message = '' } = req.body;

    // 1. Fetch current public catalog and settings from DB
    const activeProducts = db.prepare(`
      SELECT id, title, author, slug, category, normal_price, sale_price, short_description, key_points, bonus, is_best_seller
      FROM products
      WHERE is_active = 1
      ORDER BY is_best_seller DESC, id ASC
    `).all() as any[];

    const activeCategories = db.prepare(`
      SELECT id, name, slug, description FROM categories WHERE is_active = 1
    `).all() as any[];

    const activeVipPack = db.prepare(`
      SELECT id, title, subtitle, normal_price, sale_price, description, content, is_active
      FROM vip_packs
      WHERE is_active = 1
      LIMIT 1
    `).get() as any;

    const activeLeadMagnets = db.prepare(`
      SELECT id, title, slug, description, benefits FROM lead_magnets WHERE active = 1
    `).all() as any[];

    const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settingsMap: Record<string, string> = {};
    for (const r of settingsRows) {
      if (r && r.key) settingsMap[r.key] = r.value;
    }
    const whatsappNumber = settingsMap['whatsapp_number'] || '+33612345678';

    // 2. Build structured catalog description for systemInstruction
    const catalogDescription = activeProducts.map((p, idx) => {
      let keyPointsStr = '';
      try {
        const kp = JSON.parse(p.key_points || '[]');
        if (Array.isArray(kp) && kp.length > 0) {
          keyPointsStr = `Points clés : ${kp.slice(0, 3).join(' | ')}`;
        }
      } catch (_) {
        keyPointsStr = '';
      }
      const priceStr = p.sale_price ? `${p.sale_price} € (au lieu de ${p.normal_price} € - en promotion)` : `${p.normal_price} €`;
      return `${idx + 1}. "${p.title}" par ${p.author}
- Catégorie : ${p.category}
- Prix : ${priceStr}
- Résumé : ${p.short_description || ''}
${keyPointsStr ? `- ${keyPointsStr}\n` : ''}${p.bonus ? `- Bonus inclus : ${p.bonus}\n` : ''}- Lien vers la fiche : /produit/${p.slug}
- Meilleure vente : ${p.is_best_seller ? 'Oui' : 'Non'}`;
    }).join('\n\n');

    let vipPackDescription = "Aucun Pack VIP n'est actuellement actif.";
    if (activeVipPack) {
      let contentListStr = '';
      try {
        const list = JSON.parse(activeVipPack.content || '[]');
        if (Array.isArray(list)) contentListStr = list.join(', ');
      } catch (_) {}
      const vipPrice = activeVipPack.sale_price ? `${activeVipPack.sale_price} € (au lieu de ${activeVipPack.normal_price} €)` : `${activeVipPack.normal_price} €`;
      vipPackDescription = `Titre : ${activeVipPack.title}
- Sous-titre : ${activeVipPack.subtitle || ''}
- Prix spécial : ${vipPrice}
- Description : ${activeVipPack.description || ''}
- Inclus dans le pack : ${contentListStr}
- Avantages majeurs : Accès immédiat et illimité à vie à TOUS les livres audio, synthèses PDF, scripts de négociation, mises à jour futures et assistance WhatsApp dédiée.`;
    }

    const leadMagnetsDescription = activeLeadMagnets.map((lm) => {
      return `- "${lm.title}" (Lien de téléchargement gratuit : /lead-magnet/${lm.slug}) : ${lm.description || ''}`;
    }).join('\n');

    // 3. Assemble System Instruction with strict safety & boundary guidelines
    const systemInstruction = `Tu es l'assistant commercial et conseiller de lecture officiel de VISION BOOKS.
Ton rôle est d'accueillir chaleureusement les visiteurs, d'analyser leurs besoins ou défis professionnels et personnels, de leur recommander avec précision les livres audio les plus pertinents de notre catalogue, de présenter le Pack VIP (s'il est actif), et de les guider avec bienveillance vers la commande sur WhatsApp.

A PROPOS DE VISION BOOKS :
- Maison d'édition et bibliothèque audio d'élite dédiée aux entrepreneurs, investisseurs, dirigeants et esprits ambitieux.
- Livres audio synthétiques et actionnables produits en qualité studio (320 kbps), accompagnés de fiches mémos et plans d'action au format PDF.
- Modèle sans abonnement : achat unique par livre ou Pack VIP complet, écoute immédiate et illimitée à vie.
- Processus de commande : Tout se fait en 1 clic directement sur WhatsApp pour une livraison et activation instantanée.
- Numéro WhatsApp officiel : ${whatsappNumber}

CATALOGUE OFFICIEL ACTUELLEMENT DISPONIBLE :
${catalogDescription}

OFFRE PACK VIP (ACTUELLE) :
${vipPackDescription}

RESSOURCES GRATUITES OFFERTES (LEAD MAGNETS) :
${leadMagnetsDescription}

RÈGLES DE SÉCURITÉ ET DE CONDUITE STRICTES (NON NÉGOCIABLES) :
1. VÉRACITÉ STRICTE : Base toutes tes réponses UNIQUEMENT sur le catalogue et les données ci-dessus. NE JAMAIS INVENTER de livre, d'auteur, de prix ou de promotion imaginaire.
2. CONFIDENTIALITÉ ABSOLUE : Tu n'as aucun accès et tu ne dois JAMAIS mentionner ni divulguer des liens de téléchargement audio privés (fichiers MP3), des données de prospects ou de leads, ou des informations administratives.
3. LIMITES DE CONNAISSANCE : Si un visiteur demande un titre ou un auteur absent de notre catalogue, indique poliment qu'il n'est pas encore disponible dans la collection VISION BOOKS et suggère le livre existant le plus proche. Si une information n'est pas disponible, admets-le humblement et invite le visiteur à contacter notre équipe sur WhatsApp.
4. RECOMMANDATIONS CLAIRES ET LIENS :
   - Pour chaque livre recommandé, mentionne son titre exact, son auteur, son prix actuel (avec la réduction le cas échéant), et pourquoi il convient à la demande de l'utilisateur.
   - Mentionne le lien vers sa fiche sous forme markdown (ex: [Découvrir ce livre](/produit/slug-du-livre)).
5. APPEL A L'ACTION WHATSAPP :
   - Encourage le visiteur à commander ou échanger sur WhatsApp au ${whatsappNumber} pour obtenir un extrait offert ou finaliser sa commande en quelques secondes.
6. FORMAT ET TON :
   - Réponds en français soigné, élégant, courtois, engageant et concis (environ 2 à 4 paragraphes bien rythmés).
   - Inclus 1 à 3 emojis pertinents (🎧, 📈, 💡).`;

    // 4. Format conversation history for Gemini
    const userPrompt = message || (messages.length > 0 ? messages[messages.length - 1].content : '');
    if (!userPrompt || !userPrompt.trim()) {
      return res.status(400).json({ error: 'Message vide.' });
    }

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages) {
        if (!m || !m.content || !m.content.trim()) continue;
        const role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
        // Avoid duplicate consecutive roles
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n${m.content.trim()}`;
        } else {
          contents.push({
            role,
            parts: [{ text: m.content.trim() }]
          });
        }
      }
      // Gemini requires first message to be from 'user'
      if (contents.length > 0 && contents[0].role === 'model') {
        contents.shift();
      }
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: userPrompt.trim() }]
      });
    }

    // Ensure we have at least one message
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: userPrompt.trim() }] });
    }

    let assistantResponse = '';

    // 5. Call Gemini API
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const model of modelsToTry) {
        try {
          const resp = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.6,
            }
          });
          if (resp && resp.text && resp.text.trim()) {
            assistantResponse = resp.text.trim();
            break;
          }
        } catch (mErr: any) {
          console.warn(`[Assistant] Model ${model} returned:`, mErr?.message || mErr);
        }
      }
    } catch (genAiErr: any) {
      console.warn('[Assistant] Gemini SDK error:', genAiErr?.message || genAiErr);
    }

    // 6. High quality intelligent fallback if Gemini is unreachable or offline
    if (!assistantResponse) {
      const lower = userPrompt.toLowerCase();
      if (lower.includes('vip') || lower.includes('pack') || lower.includes('offre')) {
        if (activeVipPack) {
          const price = activeVipPack.sale_price ? `${activeVipPack.sale_price} € (au lieu de ${activeVipPack.normal_price} €)` : `${activeVipPack.normal_price} €`;
          assistantResponse = `Le **${activeVipPack.title}** est notre offre la plus complète ! 🎧✨\n\nPour **${price}**, vous accédez immédiatement et à vie à l'intégralité de nos masterclasses audio, avec toutes les fiches de synthèse PDF et les bonus exclusifs.\n\nC'est la solution idéale pour transformer votre vision stratégique sans abonnement mensuel. Vous pouvez commander ce pack directement sur WhatsApp pour une activation immédiate !`;
        } else {
          assistantResponse = `Nous proposons actuellement l'intégralité de nos livres audio à la carte. Chaque titre comprend l'enregistrement studio complet ainsi que les fiches d'action condensées. Souhaitez-vous une recommandation dans un domaine précis (Business, Investissement, Mindset) ?`;
        }
      } else if (lower.includes('prix') || lower.includes('combien') || lower.includes('tarif') || lower.includes('commander')) {
        assistantResponse = `Nos livres audio sont accessibles à l'achat unique, sans abonnement, avec des tarifs promotionnels entre **24,50 € et 34,00 €** (prix standard de 35 € à 55 €). 📚💡\n\nChaque livre audio est accompagné de ses synthèses PDF et bonus d'application. La commande s'effectue directement sur **WhatsApp** au **${whatsappNumber}** pour recevoir vos accès en quelques secondes. Sur quel sujet travaillez-vous en ce moment ?`;
      } else if (lower.includes('gratuit') || lower.includes('cadeau') || lower.includes('offert') || lower.includes('lead magnet') || lower.includes('guide')) {
        if (activeLeadMagnets.length > 0) {
          const lm = activeLeadMagnets[0];
          assistantResponse = `Nous offrons plusieurs ressources gratuites pour vous permettre de découvrir l'exigence VISION BOOKS ! 🎁\n\nVous pouvez notamment télécharger librement notre guide d'exception : **« ${lm.title} »** via ce lien : [Accéder au guide gratuit](/lead-magnet/${lm.slug}). Il vous donnera un aperçu immédiat de nos méthodes d'application concrètes.`;
        } else {
          assistantResponse = `Nous mettons régulièrement à disposition des synthèses et extraits audio offerts. N'hésitez pas à nous contacter sur WhatsApp pour recevoir un extrait de votre choix ! 🎧`;
        }
      } else {
        // Recommend top products
        const topProds = activeProducts.slice(0, 2);
        assistantResponse = `Bonjour et bienvenue chez **VISION BOOKS** ! 🎧\n\nNous concevons des livres audio d'exception condensés et orientés action, pour les entrepreneurs, investisseurs et visionnaires.\n\nParmi nos lectures les plus prisées actuellement :\n- **« ${topProds[0]?.title || "L'Empire du Business Moderne"} »** par ${topProds[0]?.author || "Marc de Saint-Clair"} : [Découvrir la fiche](/produit/${topProds[0]?.slug || 'l-empire-du-business-moderne'})\n- **« ${topProds[1]?.title || "La Voie de la Liberté Financière"} »** par ${topProds[1]?.author || "Elena Valenti"} : [Découvrir la fiche](/produit/${topProds[1]?.slug || 'la-voie-de-la-liberte-financiere'})\n\nQuel défi souhaitez-vous relever aujourd'hui ? Je suis là pour vous orienter vers le livre qui vous fera gagner des mois d'expérimentation !`;
      }
    }

    // 7. Extract matched products to return as interactive recommendation chips
    const matchedProducts = activeProducts.filter((p) => {
      const titleLower = p.title.toLowerCase();
      const slugLower = p.slug.toLowerCase();
      return (
        assistantResponse.toLowerCase().includes(titleLower) ||
        assistantResponse.toLowerCase().includes(slugLower)
      );
    }).slice(0, 3).map((p) => ({
      id: p.id,
      title: p.title,
      author: p.author,
      slug: p.slug,
      cover: p.cover,
      category: p.category,
      normal_price: p.normal_price,
      sale_price: p.sale_price,
    }));

    res.json({
      message: assistantResponse,
      suggestedProducts: matchedProducts,
      whatsappNumber,
      hasActiveVipPack: Boolean(activeVipPack),
    });
  } catch (error: any) {
    console.error('Error in /api/assistant/chat:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur lors de la réponse de l’assistant' });
  }
});

// ----------------------------------------------------
// SETTINGS API
// ----------------------------------------------------

// GET /api/settings
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {
      whatsapp_number: '+33 6 12 34 56 78',
      platform_name: 'VISION BOOKS',
      tagline: 'Bibliothèque professionnelle de livres audio',
      support_email: 'contact@visionbooks.audio',
      currency: 'EUR',
    };
    for (const r of rows) {
      if (r && r.key) {
        settings[r.key] = r.value;
      }
    }
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings
app.put('/api/settings', (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Données de configuration invalides.' });
    }

    const now = new Date().toISOString();
    const upsertStmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string' || typeof value === 'number') {
        upsertStmt.run(key, String(value).trim(), now);
      }
    }

    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of rows) {
      if (r && r.key) {
        settings[r.key] = r.value;
      }
    }
    res.json(settings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/order/whatsapp (Generates order info & WhatsApp URL dynamically from settings)
app.get('/api/order/whatsapp', (req, res) => {
  try {
    const { product_id, slug, host } = req.query;
    const query = product_id || slug;
    if (!query) {
      return res.status(400).json({ error: 'Identifiant ou slug de produit requis.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ? OR slug = ?').get(String(query), String(query)) as any;
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    const row = db.prepare("SELECT value FROM settings WHERE key = 'whatsapp_number'").get() as { value: string } | undefined;
    const rawNumber = row?.value || '+33 6 12 34 56 78';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');

    const hasPromo = product.sale_price !== null && product.sale_price !== undefined && product.sale_price < product.normal_price;
    const currentPrice = hasPromo ? product.sale_price : product.normal_price;
    const formattedPrice = `${currentPrice % 1 === 0 ? currentPrice : currentPrice.toFixed(2)} €`;

    const baseUrl = host ? String(host) : (req.get('origin') || `http://${req.get('host')}`);
    const productUrl = `${baseUrl}/produit/${product.slug}`;

    const message = `Bonjour VISION BOOKS,
je souhaite commander le livre audio :
${product.title}

Prix :
${formattedPrice}

Lien du produit :
${productUrl}`;

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      whatsapp_number: rawNumber,
      clean_number: cleanNumber,
      message,
      whatsapp_url: whatsappUrl,
    });
  } catch (error: any) {
    console.error('Error generating WhatsApp order link:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// BLOG API
// ----------------------------------------------------

function formatBlogPost(p: any) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    category: p.category,
    author: p.author,
    date: p.date,
    readTime: p.read_time || '5 min',
    read_time: p.read_time || '5 min',
    imageUrl: p.image_url || '',
    image_url: p.image_url || '',
    is_published: Boolean(p.is_published),
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

// GET /api/blog
app.get('/api/blog', (req, res) => {
  try {
    const publishedOnly = req.query.published_only === 'true';
    const query = publishedOnly
      ? 'SELECT * FROM blog_posts WHERE is_published = 1 ORDER BY created_at DESC'
      : 'SELECT * FROM blog_posts ORDER BY created_at DESC';
    const rows = db.prepare(query).all();
    res.json(rows.map(formatBlogPost));
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/blog/:idOrSlug
app.get('/api/blog/:idOrSlug', (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const post = db.prepare('SELECT * FROM blog_posts WHERE id = ? OR slug = ?').get(idOrSlug, idOrSlug) as any;
    if (!post) {
      return res.status(404).json({ error: 'Article non trouvé.' });
    }
    res.json(formatBlogPost(post));
  } catch (error: any) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/blog
app.post('/api/blog', (req, res) => {
  try {
    const { title, slug, excerpt, content, category, author, date, read_time, image_url, is_published } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Le titre de l'article est obligatoire." });
    }

    const baseSlug = slug || title;
    const finalSlug = getUniqueSlug('blog_posts', baseSlug);
    const id = req.body.id || `blog-${Date.now()}`;
    const now = new Date().toISOString();
    const publishedInt = is_published !== false ? 1 : 0;

    const defaultDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const stmt = db.prepare(`
      INSERT INTO blog_posts (
        id, title, slug, excerpt, content, category, author, date, read_time, image_url, is_published, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      title.trim(),
      finalSlug,
      excerpt ? excerpt.trim() : '',
      content ? content.trim() : '',
      category || 'Stratégie & Leadership',
      author || 'Équipe Éditoriale VISION BOOKS',
      date || defaultDate,
      read_time || '5 min',
      image_url || '/src/assets/images/cover_business_empire_1790615532791.jpg',
      publishedInt,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as any;
    res.status(201).json(formatBlogPost(created));
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/blog/:id
app.put('/api/blog/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Article non trouvé.' });
    }

    const { title, slug, excerpt, content, category, author, date, read_time, image_url, is_published } = req.body;
    const baseSlug = slug || title || existing.slug;
    const finalSlug = getUniqueSlug('blog_posts', baseSlug, id);
    const now = new Date().toISOString();
    const publishedInt = is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published;

    const stmt = db.prepare(`
      UPDATE blog_posts
      SET
        title = ?,
        slug = ?,
        excerpt = ?,
        content = ?,
        category = ?,
        author = ?,
        date = ?,
        read_time = ?,
        image_url = ?,
        is_published = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      title !== undefined ? title.trim() : existing.title,
      finalSlug,
      excerpt !== undefined ? excerpt.trim() : existing.excerpt,
      content !== undefined ? content.trim() : existing.content,
      category !== undefined ? category : existing.category,
      author !== undefined ? author : existing.author,
      date !== undefined ? date : existing.date,
      read_time !== undefined ? read_time : existing.read_time,
      image_url !== undefined ? image_url : existing.image_url,
      publishedInt,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as any;
    res.json(formatBlogPost(updated));
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/blog/:id/toggle
app.patch('/api/blog/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Article non trouvé.' });
    }

    const nextStatus = existing.is_published ? 0 : 1;
    const now = new Date().toISOString();

    db.prepare('UPDATE blog_posts SET is_published = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, id);

    const updated = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as any;
    res.json(formatBlogPost(updated));
  } catch (error: any) {
    console.error('Error toggling blog post status:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/blog/:id
app.delete('/api/blog/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Article non trouvé.' });
    }

    db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// TESTIMONIALS API
// ----------------------------------------------------

function formatTestimonial(t: any) {
  return {
    id: t.id,
    name: t.name,
    role: t.role || '',
    company: t.company || '',
    avatarUrl: t.avatar_url || '',
    avatar_url: t.avatar_url || '',
    content: t.content,
    rating: Number(t.rating) || 5,
    audiobookTitle: t.audiobook_title || '',
    audiobook_title: t.audiobook_title || '',
    is_active: Boolean(t.is_active),
    status: Boolean(t.is_active) ? 'publié' : 'brouillon',
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

// GET /api/testimonials
app.get('/api/testimonials', (req, res) => {
  try {
    const activeOnly = req.query.active_only === 'true';
    const query = activeOnly
      ? 'SELECT * FROM testimonials WHERE is_active = 1 ORDER BY created_at DESC'
      : 'SELECT * FROM testimonials ORDER BY created_at DESC';
    const rows = db.prepare(query).all();
    res.json(rows.map(formatTestimonial));
  } catch (error: any) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/testimonials
app.post('/api/testimonials', (req, res) => {
  try {
    const { name, role, company, avatar_url, content, rating, audiobook_title, is_active } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom est obligatoire.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Le contenu du témoignage est obligatoire.' });
    }

    const id = req.body.id || `testi-${Date.now()}`;
    const now = new Date().toISOString();
    const activeInt = is_active !== false ? 1 : 0;
    const ratingInt = rating ? Math.min(Math.max(Number(rating), 1), 5) : 5;

    const stmt = db.prepare(`
      INSERT INTO testimonials (
        id, name, role, company, avatar_url, content, rating, audiobook_title, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      name.trim(),
      role ? role.trim() : '',
      company ? company.trim() : '',
      avatar_url || '',
      content.trim(),
      ratingInt,
      audiobook_title || '',
      activeInt,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id) as any;
    res.status(201).json(formatTestimonial(created));
  } catch (error: any) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/testimonials/:id
app.put('/api/testimonials/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Témoignage non trouvé.' });
    }

    const { name, role, company, avatar_url, content, rating, audiobook_title, is_active } = req.body;
    const now = new Date().toISOString();
    const activeInt = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;
    const ratingInt = rating !== undefined ? Math.min(Math.max(Number(rating), 1), 5) : existing.rating;

    const stmt = db.prepare(`
      UPDATE testimonials
      SET
        name = ?,
        role = ?,
        company = ?,
        avatar_url = ?,
        content = ?,
        rating = ?,
        audiobook_title = ?,
        is_active = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      name !== undefined ? name.trim() : existing.name,
      role !== undefined ? role.trim() : existing.role,
      company !== undefined ? company.trim() : existing.company,
      avatar_url !== undefined ? avatar_url : existing.avatar_url,
      content !== undefined ? content.trim() : existing.content,
      ratingInt,
      audiobook_title !== undefined ? audiobook_title : existing.audiobook_title,
      activeInt,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id) as any;
    res.json(formatTestimonial(updated));
  } catch (error: any) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/testimonials/:id/toggle
app.patch('/api/testimonials/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Témoignage non trouvé.' });
    }

    const nextStatus = existing.is_active ? 0 : 1;
    const now = new Date().toISOString();

    db.prepare('UPDATE testimonials SET is_active = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, id);

    const updated = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id) as any;
    res.json(formatTestimonial(updated));
  } catch (error: any) {
    console.error('Error toggling testimonial status:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/testimonials/:id
app.delete('/api/testimonials/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Témoignage non trouvé.' });
    }

    db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// VIP PACK API
// ----------------------------------------------------

function formatVipPack(v: any) {
  if (!v) return null;
  return {
    id: v.id,
    title: v.title,
    subtitle: v.subtitle || '',
    image: v.image || '',
    normal_price: Number(v.normal_price || 0),
    sale_price: v.sale_price !== null && v.sale_price !== undefined ? Number(v.sale_price) : null,
    description: v.description || '',
    content: v.content || '',
    cta_text: v.cta_text || 'Commander le Pack VIP sur WhatsApp',
    show_on_home: Boolean(v.show_on_home),
    is_active: Boolean(v.is_active),
    // Urgence Marketing
    urgency_active: Boolean(v.urgency_active),
    urgency_end_date: v.urgency_end_date || '',
    urgency_text: v.urgency_text || '',
    urgency_badge: v.urgency_badge || '',
    created_at: v.created_at,
    updated_at: v.updated_at,
  };
}

// GET /api/vip-pack
app.get('/api/vip-pack', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM vip_packs LIMIT 1').get() as any;
    if (!row) {
      return res.json(null);
    }
    res.json(formatVipPack(row));
  } catch (error: any) {
    console.error('Error fetching VIP Pack:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/vip-pack (create or update)
app.put('/api/vip-pack', (req, res) => {
  try {
    const {
      title,
      subtitle,
      image,
      normal_price,
      sale_price,
      description,
      content,
      cta_text,
      show_on_home,
      is_active,
      urgency_active,
      urgency_end_date,
      urgency_text,
      urgency_badge,
    } = req.body;

    const existing = db.prepare('SELECT * FROM vip_packs LIMIT 1').get() as any;
    const now = new Date().toISOString();

    if (existing) {
      const stmt = db.prepare(`
        UPDATE vip_packs
        SET
          title = ?,
          subtitle = ?,
          image = ?,
          normal_price = ?,
          sale_price = ?,
          description = ?,
          content = ?,
          cta_text = ?,
          show_on_home = ?,
          is_active = ?,
          urgency_active = ?,
          urgency_end_date = ?,
          urgency_text = ?,
          urgency_badge = ?,
          updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        title !== undefined ? title : existing.title,
        subtitle !== undefined ? subtitle : existing.subtitle,
        image !== undefined ? image : existing.image,
        normal_price !== undefined ? Number(normal_price) : existing.normal_price,
        sale_price !== undefined ? (sale_price !== '' && sale_price !== null ? Number(sale_price) : null) : existing.sale_price,
        description !== undefined ? description : existing.description,
        content !== undefined ? (typeof content === 'string' ? content : JSON.stringify(content)) : existing.content,
        cta_text !== undefined ? cta_text : existing.cta_text,
        show_on_home !== undefined ? (show_on_home ? 1 : 0) : existing.show_on_home,
        is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
        urgency_active !== undefined ? (urgency_active ? 1 : 0) : (existing.urgency_active || 0),
        urgency_end_date !== undefined ? urgency_end_date : (existing.urgency_end_date || ''),
        urgency_text !== undefined ? urgency_text : (existing.urgency_text || ''),
        urgency_badge !== undefined ? urgency_badge : (existing.urgency_badge || ''),
        now,
        existing.id
      );

      const updated = db.prepare('SELECT * FROM vip_packs WHERE id = ?').get(existing.id);
      res.json(formatVipPack(updated));
    } else {
      const id = 'pack-vip-main';
      const stmt = db.prepare(`
        INSERT INTO vip_packs (
          id, title, subtitle, image, normal_price, sale_price, description, content, cta_text,
          show_on_home, is_active, urgency_active, urgency_end_date, urgency_text, urgency_badge,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        title || 'Pack VIP — La Bibliothèque Privée des Dirigeants',
        subtitle || '',
        image || '/src/assets/images/cover_business_empire_1790615532791.jpg',
        Number(normal_price || 149),
        sale_price !== undefined && sale_price !== '' && sale_price !== null ? Number(sale_price) : 79,
        description || '',
        typeof content === 'string' ? content : JSON.stringify(content || []),
        cta_text || 'Commander le Pack VIP sur WhatsApp',
        show_on_home !== undefined ? (show_on_home ? 1 : 0) : 1,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        urgency_active ? 1 : 0,
        urgency_end_date || '',
        urgency_text || '',
        urgency_badge || '',
        now,
        now
      );

      const created = db.prepare('SELECT * FROM vip_packs WHERE id = ?').get(id);
      res.json(formatVipPack(created));
    }
  } catch (error: any) {
    console.error('Error saving VIP Pack:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/vip-pack/toggle-active
app.patch('/api/vip-pack/toggle-active', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM vip_packs LIMIT 1').get() as any;
    if (!existing) {
      return res.status(404).json({ error: 'Pack VIP non trouvé.' });
    }
    const nextStatus = existing.is_active ? 0 : 1;
    const now = new Date().toISOString();
    db.prepare('UPDATE vip_packs SET is_active = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, existing.id);
    const updated = db.prepare('SELECT * FROM vip_packs WHERE id = ?').get(existing.id);
    res.json(formatVipPack(updated));
  } catch (error: any) {
    console.error('Error toggling VIP Pack:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/vip-pack
app.delete('/api/vip-pack', (req, res) => {
  try {
    db.prepare('DELETE FROM vip_packs').run();
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting VIP Pack:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// ANALYTICS & TRACKING API
// ----------------------------------------------------

// POST /api/analytics/track
app.post('/api/analytics/track', (req, res) => {
  try {
    const { event_type, product_id, lead_id, page, visitor_id, metadata } = req.body;

    if (!event_type || !page) {
      return res.status(400).json({ error: 'event_type et page sont obligatoires.' });
    }

    const id = req.body.id || `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const metaStr = typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata || '{}');

    const stmt = db.prepare(`
      INSERT INTO analytics_events (id, event_type, product_id, lead_id, page, visitor_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      String(event_type).trim(),
      product_id || null,
      lead_id || null,
      String(page).trim(),
      visitor_id || null,
      metaStr,
      now
    );

    res.status(201).json({ success: true, id });
  } catch (error: any) {
    console.error('Error tracking analytics event:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/events
app.get('/api/analytics/events', (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = db.prepare(`
      SELECT e.*, p.title as product_title, p.cover as product_cover, l.first_name as lead_name
      FROM analytics_events e
      LEFT JOIN products p ON (e.product_id = p.id OR e.product_id = p.slug)
      LEFT JOIN leads l ON e.lead_id = l.id
      ORDER BY e.created_at DESC
      LIMIT ?
    `).all(limit);

    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching analytics events:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/stats
app.get('/api/analytics/stats', (req, res) => {
  try {
    const range = (req.query.range as string) || 'all';

    let dateCondition = '';
    const now = new Date();

    if (range === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      dateCondition = `AND substr(created_at, 1, 10) = '${todayStr}'`;
    } else if (range === '7d') {
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      dateCondition = `AND created_at >= '${d7}'`;
    } else if (range === '30d') {
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      dateCondition = `AND created_at >= '${d30}'`;
    }

    // 1. Visitors: distinct visitor_id
    const visitorsRow = db.prepare(`
      SELECT COUNT(DISTINCT visitor_id) as count
      FROM analytics_events
      WHERE visitor_id IS NOT NULL AND visitor_id != '' ${dateCondition}
    `).get() as { count: number };
    const totalVisitors = visitorsRow?.count || 0;

    // 2. Visits: site_visit + product_view
    const visitsRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE event_type IN ('site_visit', 'product_view') ${dateCondition}
    `).get() as { count: number };
    const totalVisits = visitsRow?.count || 0;

    // 3. Product clicks
    const prodClicksRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'product_click' ${dateCondition}
    `).get() as { count: number };
    const productClicks = prodClicksRow?.count || 0;

    // 4. WhatsApp clicks
    const waClicksRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'whatsapp_order_click' ${dateCondition}
    `).get() as { count: number };
    const whatsappClicks = waClicksRow?.count || 0;

    // 5. Leads count
    let leadsDateCond = '';
    if (range === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      leadsDateCond = `WHERE substr(created_at, 1, 10) = '${todayStr}'`;
    } else if (range === '7d') {
      const d7Str = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      leadsDateCond = `WHERE substr(created_at, 1, 10) >= '${d7Str}'`;
    } else if (range === '30d') {
      const d30Str = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      leadsDateCond = `WHERE substr(created_at, 1, 10) >= '${d30Str}'`;
    }
    const leadsRow = db.prepare(`SELECT COUNT(*) as count FROM leads ${leadsDateCond}`).get() as { count: number };
    const leadsCount = leadsRow?.count || 0;

    // 6. Lead Magnet downloads
    const downloadsSumRow = db.prepare('SELECT COALESCE(SUM(downloads_count), 0) as count FROM lead_magnets').get() as { count: number };
    const downloadsEventsRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'lead_magnet_download' ${dateCondition}
    `).get() as { count: number };
    const leadMagnetDownloads = Math.max(downloadsSumRow?.count || 0, downloadsEventsRow?.count || 0);

    // 7. Orders / purchase intentions (WhatsApp clicks)
    const ordersIntentions = whatsappClicks;

    // 8. Conversion rate
    const baseVisitors = totalVisitors > 0 ? totalVisitors : (totalVisits > 0 ? totalVisits : 1);
    const conversionRate = totalVisitors > 0 ? Number(((ordersIntentions / baseVisitors) * 100).toFixed(1)) : 0;
    const globalConversionRate = totalVisitors > 0 ? Number((((ordersIntentions + leadsCount) / baseVisitors) * 100).toFixed(1)) : 0;

    // Most viewed products
    const mostViewedProducts = db.prepare(`
      SELECT p.id, p.title, p.author, p.cover, p.slug, p.normal_price, p.sale_price,
             COUNT(e.id) as views_count
      FROM products p
      LEFT JOIN analytics_events e ON (e.product_id = p.id OR e.product_id = p.slug) AND e.event_type = 'product_view' ${dateCondition}
      GROUP BY p.id
      ORDER BY views_count DESC, p.created_at DESC
      LIMIT 5
    `).all() as any[];

    // Most WhatsApp products
    const mostWhatsappProducts = db.prepare(`
      SELECT p.id, p.title, p.author, p.cover, p.slug, p.normal_price, p.sale_price,
             COUNT(e.id) as whatsapp_clicks_count
      FROM products p
      LEFT JOIN analytics_events e ON (e.product_id = p.id OR e.product_id = p.slug) AND e.event_type = 'whatsapp_order_click' ${dateCondition}
      GROUP BY p.id
      ORDER BY whatsapp_clicks_count DESC, p.created_at DESC
      LIMIT 5
    `).all() as any[];

    // Most viewed categories
    const mostViewedCategories = db.prepare(`
      SELECT c.id, c.name, c.slug, c.icon,
             COUNT(e.id) as views_count
      FROM categories c
      LEFT JOIN products p ON p.category = c.slug OR p.category = c.id
      LEFT JOIN analytics_events e ON (e.product_id = p.id OR e.product_id = p.slug) AND e.event_type IN ('product_view', 'product_click') ${dateCondition}
      GROUP BY c.id
      ORDER BY views_count DESC, c.name ASC
      LIMIT 5
    `).all() as any[];

    // Timeline for visits (last 7 or 30 days)
    const visitsTrend: { date: string; label: string; visits: number }[] = [];
    const daysToShow = range === '30d' ? 30 : 7;
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      const row = db.prepare(`
        SELECT COUNT(*) as count
        FROM analytics_events
        WHERE event_type IN ('site_visit', 'product_view') AND substr(created_at, 1, 10) = ?
      `).get(dateStr) as { count: number };
      visitsTrend.push({ date: dateStr, label, visits: row?.count || 0 });
    }

    // Timeline for leads (last 7 or 30 days)
    const leadsTrend: { date: string; label: string; leads: number }[] = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      const row = db.prepare(`
        SELECT COUNT(*) as count
        FROM leads
        WHERE substr(created_at, 1, 10) = ?
      `).get(dateStr) as { count: number };
      leadsTrend.push({ date: dateStr, label, leads: row?.count || 0 });
    }

    // Recent events for activity feed
    const recentEvents = db.prepare(`
      SELECT e.*, p.title as product_title, p.cover as product_cover, l.first_name as lead_name
      FROM analytics_events e
      LEFT JOIN products p ON (e.product_id = p.id OR e.product_id = p.slug)
      LEFT JOIN leads l ON e.lead_id = l.id
      ORDER BY e.created_at DESC
      LIMIT 15
    `).all() as any[];

    // Lead Magnet landing page visits count
    const lmVisitsRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'lead_magnet_view' ${dateCondition}
    `).get() as { count: number };
    const leadMagnetVisits = lmVisitsRow?.count || 0;

    // Performance per Lead Magnet
    const allLeadMagnets = db.prepare('SELECT id, title, slug, image, active, downloads_count FROM lead_magnets').all() as any[];
    const leadMagnetsPerformance = allLeadMagnets.map((lm) => {
      const viewsRow = db.prepare(`
        SELECT COUNT(*) as count FROM analytics_events
        WHERE event_type = 'lead_magnet_view' AND (lead_id = ? OR page LIKE '%/lead-magnet/' || ?)
      `).get(lm.id, lm.slug) as { count: number };
      const visits = viewsRow?.count || 0;

      const leadsForLmRow = db.prepare(`
        SELECT COUNT(*) as count FROM leads
        WHERE lead_magnet_id = ? OR lead_magnet_id = ?
      `).get(lm.id, lm.slug) as { count: number };
      const lmLeads = leadsForLmRow?.count || 0;

      const downloads = Number(lm.downloads_count || 0);
      const convRate = visits > 0 ? Number(Math.min(100, (lmLeads / visits) * 100).toFixed(1)) : (lmLeads > 0 ? 100 : 0);

      return {
        id: lm.id,
        title: lm.title,
        slug: lm.slug,
        image: lm.image,
        visits_count: visits,
        leads_count: lmLeads,
        downloads_count: downloads,
        conversion_rate: convRate,
        active: Boolean(lm.active),
      };
    }).sort((a, b) => b.leads_count - a.leads_count);

    res.json({
      totalVisitors,
      totalVisits,
      productClicks,
      whatsappClicks,
      leadsCount,
      leadMagnetDownloads,
      ordersIntentions,
      conversionRate,
      globalConversionRate,
      mostViewedProducts,
      mostWhatsappProducts,
      mostViewedCategories,
      visitsTrend,
      leadsTrend,
      recentEvents,
      leadMagnetVisits,
      leadMagnetsPerformance,
    });
  } catch (error: any) {
    console.error('Error calculating analytics stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// DOWNLOAD FILE HANDLER
// ----------------------------------------------------
app.get('/downloads/:filename', (req, res) => {
  const { filename } = req.params;
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '');

  // Serve a high quality generated document representation
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${cleanName.replace(/\.pdf$/, '.txt') || 'vision-books-guide.txt'}"`);
  
  res.send(`================================================================================
VISION BOOKS - GUIDE EXCLUSIF OFFERT
${cleanName.toUpperCase()}
================================================================================

Félicitations pour votre inscription sur VISION BOOKS !

Vous avez débloqué l'accès complet à cette ressource stratégique préparée par nos
auteurs et mentors partenaires.

--------------------------------------------------------------------------------
1. PRINCIPE CARDINAL : L'EFFET DE LEVIER DU SAVOIR
--------------------------------------------------------------------------------
Les 1% qui réussissent n'ont pas plus de temps que vous : ils appliquent des
modèles mentaux éprouvés et automatisent leurs décisions.

À chaque écoute ou lecture ciblée :
- Vous épargnez des mois d'erreurs coûteuses.
- Vous ancrez des réflexes stratégiques infaillibles.
- Vous construisez une valeur inestimable pour vous et vos projets.

--------------------------------------------------------------------------------
2. VOTRE PLAN D'ACTION IMMÉDIAT
--------------------------------------------------------------------------------
Étape 1 : Isolez 20 minutes aujourd'hui pour écouter votre premier extrait audio.
Étape 2 : Notez la décision la plus importante à exécuter dans les 24 heures.
Étape 3 : Consultez notre catalogue complet pour débloquer les masterclasses intégrales.

Visitez notre catalogue :
👉 https://visionbooks.club

Pour toute question ou commande assistée sur WhatsApp :
👉 Contactez notre conciergerie VIP au +33 7 00 00 00 00

VISION BOOKS - L'excellence audio pour les esprits ambitieux.
================================================================================
`);
});

// ----------------------------------------------------
// VITE DEV SERVER / STATIC ASSETS
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`VISION BOOKS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

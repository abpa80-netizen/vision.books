import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'vision_books.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrency and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      cover TEXT NOT NULL,
      category TEXT NOT NULL,
      normal_price REAL NOT NULL,
      sale_price REAL,
      short_description TEXT NOT NULL,
      full_description TEXT NOT NULL,
      key_points TEXT NOT NULL,
      bonus TEXT DEFAULT '',
      audio_url TEXT DEFAULT '',
      product_url TEXT DEFAULT '',
      is_best_seller INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lead_magnets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      benefits TEXT DEFAULT '[]',
      file_url TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      downloads_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      lead_magnet_id TEXT,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      product_id TEXT,
      lead_id TEXT,
      page TEXT NOT NULL,
      visitor_id TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      author TEXT NOT NULL,
      date TEXT NOT NULL,
      read_time TEXT DEFAULT '5 min',
      image_url TEXT DEFAULT '',
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT DEFAULT '',
      company TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      audiobook_title TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vip_packs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      image TEXT NOT NULL,
      normal_price REAL NOT NULL,
      sale_price REAL,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      cta_text TEXT DEFAULT 'Commander le Pack VIP sur WhatsApp',
      show_on_home INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_product ON analytics_events(product_id);
    CREATE INDEX IF NOT EXISTS idx_events_lead ON analytics_events(lead_id);
    CREATE INDEX IF NOT EXISTS idx_events_date ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
    CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(is_published);
    CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(is_active);
    CREATE INDEX IF NOT EXISTS idx_vip_pack_active ON vip_packs(is_active);
  `);

  // Migrate products table to include new fields if not present
  try {
    db.exec('ALTER TABLE products ADD COLUMN cta_text TEXT DEFAULT ""');
  } catch {}
  try {
    db.exec('ALTER TABLE products ADD COLUMN audio_download_url TEXT DEFAULT ""');
  } catch {}
  try {
    db.exec('ALTER TABLE products ADD COLUMN product_details TEXT DEFAULT ""');
  } catch {}

  // Migrate lead_magnets table to include subtitle & marketing_content
  try {
    db.exec('ALTER TABLE lead_magnets ADD COLUMN subtitle TEXT DEFAULT ""');
  } catch {}
  try {
    db.exec('ALTER TABLE lead_magnets ADD COLUMN marketing_content TEXT DEFAULT ""');
  } catch {}

  seedInitialData();
}

function seedInitialData() {
  // Ensure default settings are present
  const checkSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (checkSettings.count === 0) {
    const insertSetting = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `);
    const now = new Date().toISOString();
    const defaultSettings: [string, string][] = [
      ['whatsapp_number', '+33 6 12 34 56 78'],
      ['platform_name', 'VISION BOOKS'],
      ['tagline', 'Bibliothèque professionnelle de livres audio'],
      ['support_email', 'contact@visionbooks.audio'],
      ['currency', 'EUR'],
    ];
    for (const [key, val] of defaultSettings) {
      insertSetting.run(key, val, now);
    }
  } else {
    // Ensure whatsapp_number exists even if other settings were created earlier
    const existingWhatsApp = db.prepare("SELECT value FROM settings WHERE key = 'whatsapp_number'").get();
    if (!existingWhatsApp) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('whatsapp_number', '+33 6 12 34 56 78', ?)").run(new Date().toISOString());
    }
  }
  const checkCat = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (checkCat.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (id, name, slug, icon, description, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    const initialCategories = [
      {
        id: 'cat-business-entrepreneuriat',
        name: 'Business & Entrepreneuriat',
        slug: 'business-entrepreneuriat',
        icon: '📈',
        description: 'Stratégies de création, de croissance et de gestion d\'entreprises durables.',
        is_active: 1,
      },
      {
        id: 'cat-liberte-financiere-succes',
        name: 'Liberté Financière & Succès',
        slug: 'liberte-financiere-succes',
        icon: '💰',
        description: 'Principes fondamentaux pour bâtir des revenus passifs et atteindre l\'indépendance.',
        is_active: 1,
      },
      {
        id: 'cat-investissement-trading',
        name: 'Investissement & Trading',
        slug: 'investissement-trading',
        icon: '📊',
        description: 'Bourse, immobilier, cryptomonnaies et gestion rigoureuse de portefeuille.',
        is_active: 1,
      },
      {
        id: 'cat-business-en-ligne-marketing',
        name: 'Business en ligne & Marketing',
        slug: 'business-en-ligne-marketing',
        icon: '💻',
        description: 'Acquisition client, tunnels de vente, e-commerce et création de marque.',
        is_active: 1,
      },
      {
        id: 'cat-developpement-personnel',
        name: 'Développement Personnel',
        slug: 'developpement-personnel',
        icon: '🧠',
        description: 'Optimisation cognitive, habitudes puissantes, discipline et clarté mentale.',
        is_active: 1,
      },
      {
        id: 'cat-spiritualite-bien-etre',
        name: 'Spiritualité & Bien-être',
        slug: 'spiritualite-bien-etre',
        icon: '🕊️',
        description: 'Sérénité intérieure, alignement personnel, méditation et énergie vitale.',
        is_active: 1,
      },
      {
        id: 'cat-amour-relation',
        name: 'Amour & Relation',
        slug: 'amour-relation',
        icon: '❤️',
        description: 'Communication bienveillante, intelligence relationnelle et harmonie du couple.',
        is_active: 1,
      },
      {
        id: 'cat-mindset-motivation',
        name: 'Mindset & Motivation',
        slug: 'mindset-motivation',
        icon: '⚡',
        description: 'Résilience à toute épreuve, détermination inébranlable et dépassement de soi.',
        is_active: 1,
      },
      {
        id: 'cat-autres',
        name: 'Autres',
        slug: 'autres',
        icon: '✨',
        description: 'Sujets transversaux, biographies inspirantes et essais prospectifs.',
        is_active: 1,
      },
    ];

    for (const cat of initialCategories) {
      insertCat.run(cat.id, cat.name, cat.slug, cat.icon, cat.description, cat.is_active, now, now);
    }
  }

  const checkProd = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (checkProd.count === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (
        id, title, author, slug, cover, category, normal_price, sale_price,
        short_description, full_description, key_points, bonus, audio_url,
        product_url, is_best_seller, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    const initialProducts = [
      {
        id: 'prod-1',
        title: 'L\'Empire du Business Moderne',
        author: 'Marc de Saint-Clair',
        slug: 'l-empire-du-business-moderne',
        cover: '/src/assets/images/cover_business_empire_1790615532791.jpg',
        category: 'business-entrepreneuriat',
        normal_price: 49.90,
        sale_price: 29.90,
        short_description: 'Le guide audio ultime pour structurer une entreprise rentable, automatiser ses processus et dominer son marché avec vision.',
        full_description: 'Une masterclass audio exhaustive de 7h45 qui décortique pas à pas la construction d\'un écosystème commercial résilient. Pensé pour les fondateurs et dirigeants exigeants, cet ouvrage audio transmet les modèles mentaux de scalabilité, la sélection des leviers d\'acquisition à haute rentabilité et l\'organisation d\'équipes autonomes focalisées sur le résultat.',
        key_points: JSON.stringify([
          'Valider une offre haut de gamme sans friction commerciale',
          'Construire une équipe autonome orientée résultats mesurables',
          'Systématiser l\'acquisition client pérenne sans dépendre des algorithmes'
        ]),
        bonus: 'Guide PDF exclusif "Matrice d\'automatisation d\'entreprise" (36 pages) + Fiche mémo des KPIs critiques.',
        audio_url: 'https://actions.google.com/sounds/v1/ambiences/office_working.ogg',
        product_url: '/produits/l-empire-du-business-moderne',
        is_best_seller: 1,
        is_active: 1,
      },
      {
        id: 'prod-2',
        title: 'La Voie de la Liberté Financière',
        author: 'Elena Valenti',
        slug: 'la-voie-de-la-liberte-financiere',
        cover: '/src/assets/images/cover_financial_liberty_1790615544438.jpg',
        category: 'liberte-financiere-succes',
        normal_price: 39.00,
        sale_price: 27.00,
        short_description: 'Déconstruisez vos croyances limitantes sur l\'argent et appliquez les 7 leviers éprouvés pour multiplier votre patrimoine personnel.',
        full_description: '6h15 d\'immersion financière pour reprendre le contrôle total de vos finances personnelles. De l\'élimination stratégique des dettes à l\'investissement passif automatisé, Elena Valenti partage avec pragmatisme les règles d\'or des patrimoines qui traversent les décennies.',
        key_points: JSON.stringify([
          'Comprendre la mécanique des flux de trésorerie passifs réguliers',
          'Éliminer la dette toxique et sécuriser son épargne active',
          'Les stratégies d\'allocation d\'actifs des 1%'
        ]),
        bonus: 'Calculateur Excel dynamique de liberté financière + Template de suivi mensuel de trésorerie.',
        audio_url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
        product_url: '/produits/la-voie-de-la-liberte-financiere',
        is_best_seller: 1,
        is_active: 1,
      },
      {
        id: 'prod-3',
        title: 'Le Pouvoir Inflexible du Mindset',
        author: 'Koffi Mensah',
        slug: 'le-pouvoir-inflexible-du-mindset',
        cover: '/src/assets/images/cover_mindset_power_1790615556990.jpg',
        category: 'mindset-motivation',
        normal_price: 35.00,
        sale_price: 24.50,
        short_description: 'Comment forger une résistance mentale invincible face à l\'adversité, dompter la peur de l\'échec et rester focalisé sur ses objectifs majeurs.',
        full_description: '5h30 de formation mentale intense. Koffi Mensah transmet les rituels psychologiques des athlètes d\'élite et des leaders mondiaux pour transformer les obstacles imprévus en opportunités de dépassement personnel.',
        key_points: JSON.stringify([
          'Reprogrammer ses schémas neuronaux de prise de décision',
          'Le protocole matinal des 60 premières minutes pour dominer sa journée',
          'Désamorcer le syndrome de l\'imposteur et l\'anxiété de performance'
        ]),
        bonus: 'Audio de conditionnement matinal de 10 minutes à écouter avant chaque défi important.',
        audio_url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
        product_url: '/produits/le-pouvoir-inflexible-du-mindset',
        is_best_seller: 1,
        is_active: 1,
      },
      {
        id: 'prod-4',
        title: 'Maîtriser les Marchés et le Trading Systématique',
        author: 'Gilles Rochefort',
        slug: 'maitriser-les-marches-et-le-trading-systematique',
        cover: '/src/assets/images/cover_business_empire_1790615532791.jpg',
        category: 'investissement-trading',
        normal_price: 55.00,
        sale_price: 34.00,
        short_description: 'Une méthode quantitative et psychologique pour aborder les marchés sans émotion, préserver son capital et exécuter avec discipline.',
        full_description: '8h20 d\'analyse financière approfondie. Apprenez à concevoir une stratégie de trading basée sur des règles statistiques claires plutôt que sur l\'intuition émotionnelle.',
        key_points: JSON.stringify([
          'Gestion millimétrée du ratio risque / rendement (Risk Management)',
          'Psychologie du trader professionnel en période de forte volatilité',
          'Construire une routine de surveillance efficace en 30 minutes par jour'
        ]),
        bonus: 'Checklist quotidienne de pré-marché + Journal de trading Notion prêt à l\'emploi.',
        audio_url: '',
        product_url: '/produits/maitriser-les-marches-et-le-trading-systematique',
        is_best_seller: 0,
        is_active: 1,
      },
      {
        id: 'prod-5',
        title: 'L\'Art du Marketing d\'Acquisition & Copywriting',
        author: 'Sarah Bensalem',
        slug: 'l-art-du-marketing-d-acquisition-copywriting',
        cover: '/src/assets/images/cover_financial_liberty_1790615544438.jpg',
        category: 'business-en-ligne-marketing',
        normal_price: 42.00,
        sale_price: 28.50,
        short_description: 'Apprenez à rédiger des messages qui captivent, convertissent et fidélisent. La science des mots appliquée au business moderne.',
        full_description: '6h50 d\'analyses tactiques de campagnes à plusieurs millions. Sarah Bensalem dévoile la psychologie de la persuasion éthique et la construction de récits captivants.',
        key_points: JSON.stringify([
          'La structure narrative irrésistible en 4 étapes clés',
          'Optimiser les pages de conversion pour un taux de transformation record',
          'Les déclencheurs cognitifs de la prise de décision rapide'
        ]),
        bonus: 'Swipe file de 50 accroches et courriels hautement convertisseurs.',
        audio_url: '',
        product_url: '/produits/l-art-du-marketing-d-acquisition-copywriting',
        is_best_seller: 1,
        is_active: 1,
      },
      {
        id: 'prod-6',
        title: 'L\'Éveil de la Présence & Alignement Intérieur',
        author: 'Thierry Vandevelde',
        slug: 'l-eveil-de-la-presence-alignement-interieur',
        cover: '/src/assets/images/cover_mindset_power_1790615556990.jpg',
        category: 'spiritualite-bien-etre',
        normal_price: 30.00,
        sale_price: 22.00,
        short_description: 'Un voyage audio immersif pour calmer le bruit mental, rétablir la connexion avec son intuition profonde et cultiver une paix inébranlable.',
        full_description: '4h40 d\'enregistrements apaisants mêlant philosophie intemporelle et techniques de pleine conscience adaptées à un quotidien professionnel exigeant.',
        key_points: JSON.stringify([
          'Exercices de respiration guidée pour désamorcer l\'anxiété en 3 minutes',
          'Ancrer l\'attention dans l\'instant présent sans fuir ses responsabilités',
          'Harmoniser valeurs fondamentales et ambitions concrètes'
        ]),
        bonus: 'Trois méditations guidées audio de 15 minutes en haute fidélité.',
        audio_url: '',
        product_url: '/produits/l-eveil-de-la-presence-alignement-interieur',
        is_best_seller: 0,
        is_active: 1,
      }
    ];

    for (const prod of initialProducts) {
      insertProd.run(
        prod.id,
        prod.title,
        prod.author,
        prod.slug,
        prod.cover,
        prod.category,
        prod.normal_price,
        prod.sale_price,
        prod.short_description,
        prod.full_description,
        prod.key_points,
        prod.bonus,
        prod.audio_url,
        prod.product_url,
        prod.is_best_seller,
        prod.is_active,
        now,
        now
      );
    }
  }

  const checkLm = db.prepare('SELECT COUNT(*) as count FROM lead_magnets').get() as { count: number };
  if (checkLm.count === 0) {
    const insertLm = db.prepare(`
      INSERT INTO lead_magnets (
        id, title, slug, image, description, benefits, file_url, active, downloads_count, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    const initialLeadMagnets = [
      {
        id: 'lm-guide-liberte-financiere',
        title: 'Guide PDF : Les 10 Principes Inviolables de l\'Indépendance Financière',
        slug: 'guide-liberte-financiere',
        image: '/src/assets/images/cover_financial_liberty_1790615544438.jpg',
        description: 'Découvrez la méthode étape par étape pour automatiser votre épargne, éliminer vos dettes et générer vos premiers flux de revenus passifs durables.',
        benefits: JSON.stringify([
          'Les 3 règles d\'or de l\'allocation de patrimoine pour débutants et confirmés',
          'Comment mettre en place un virement d\'investissement 100% automatisé chaque mois',
          'La matrice infaillible d\'élimination de la dette en 90 jours',
          'Fiche mémo et template Excel de suivi de trésorerie inclus'
        ]),
        file_url: '/downloads/guide-liberte-financiere-visionbooks.pdf',
        active: 1,
        downloads_count: 1420,
      },
      {
        id: 'lm-masterclass-audio-negociation',
        title: 'Masterclass Audio Confidentielle : L\'Art de Convaincre et Clôturer',
        slug: 'masterclass-audio-negociation',
        image: '/src/assets/images/cover_business_empire_1790615532791.jpg',
        description: 'Une session audio immersive de 45 minutes pour apprendre à négocier des contrats à forte valeur, surmonter les objections et imposer votre autorité commerciale.',
        benefits: JSON.stringify([
          'Techniques d\'ancrage psychologique pour défendre vos tarifs sans brader',
          'Les 5 questions stratégiques qui éliminent le doute chez votre prospect',
          'Script verbatim de relance WhatsApp à haute conversion'
        ]),
        file_url: '/downloads/masterclass-audio-negociation-visionbooks.mp3',
        active: 1,
        downloads_count: 890,
      },
      {
        id: 'lm-checklist-mindset-invincible',
        title: 'Checklist Décisionnelle : Le Protocole Mental des Dirigeants d\'Élite',
        slug: 'protocole-mindset-invincible',
        image: '/src/assets/images/cover_mindset_power_1790615556990.jpg',
        description: 'Le protocole matinal de 20 minutes pour forger un focus inébranlable, vaincre l\'inertie et aborder les journées complexes avec lucidité.',
        benefits: JSON.stringify([
          'Le rituel des 3 blocs matinaux sans distraction digitale',
          'Exercice neuro-cognitif de 3 minutes pour désamorcer le stress de décision',
          'La grille d\'évaluation hebdomadaire pour prioriser les tâches à fort impact'
        ]),
        file_url: '/downloads/checklist-mindset-invincible-visionbooks.pdf',
        active: 1,
        downloads_count: 654,
      }
    ];

    for (const lm of initialLeadMagnets) {
      insertLm.run(
        lm.id,
        lm.title,
        lm.slug,
        lm.image,
        lm.description,
        lm.benefits,
        lm.file_url,
        lm.active,
        lm.downloads_count,
        now,
        now
      );
    }
  }

  const checkLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number };
  if (checkLeads.count === 0) {
    const insertLead = db.prepare(`
      INSERT INTO leads (id, first_name, whatsapp, lead_magnet_id, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const initialLeads = [
      {
        id: 'lead-1',
        first_name: 'Moussa',
        whatsapp: '+221 77 123 45 67',
        lead_magnet_id: 'lm-guide-liberte-financiere',
        source: 'Page de capture /guide-liberte-financiere',
        created_at: '2026-09-28 09:30',
      },
      {
        id: 'lead-2',
        first_name: 'Claire',
        whatsapp: '+33 6 12 34 56 78',
        lead_magnet_id: 'lm-masterclass-audio-negociation',
        source: 'Page de capture /masterclass-audio-negociation',
        created_at: '2026-09-27 16:45',
      },
      {
        id: 'lead-3',
        first_name: 'Alain',
        whatsapp: '+32 470 11 22 33',
        lead_magnet_id: 'lm-checklist-mindset-invincible',
        source: 'Page de capture /protocole-mindset-invincible',
        created_at: '2026-09-26 11:20',
      },
      {
        id: 'lead-4',
        first_name: 'Fatou',
        whatsapp: '+225 07 88 99 00 11',
        lead_magnet_id: 'lm-guide-liberte-financiere',
        source: 'Page de capture /guide-liberte-financiere',
        created_at: '2026-09-25 14:15',
      },
    ];

    for (const l of initialLeads) {
      insertLead.run(l.id, l.first_name, l.whatsapp, l.lead_magnet_id, l.source, l.created_at);
    }
  }

  // Seed analytics_events if empty
  const checkEvents = db.prepare('SELECT COUNT(*) as count FROM analytics_events').get() as { count: number };
  if (checkEvents.count === 0) {
    const insertEvent = db.prepare(`
      INSERT INTO analytics_events (id, event_type, product_id, lead_id, page, visitor_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    // Helper to format date offset by days
    const getDateOffset = (daysAgo: number, hoursOffset: number = 0) => {
      const d = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) + (hoursOffset * 60 * 60 * 1000));
      return d.toISOString();
    };

    const initialEvents: {
      id: string;
      event_type: string;
      product_id: string | null;
      lead_id: string | null;
      page: string;
      visitor_id: string;
      metadata?: any;
      created_at: string;
    }[] = [
      // Site visits over the past 5 days
      { id: 'ev-1', event_type: 'site_visit', product_id: null, lead_id: null, page: '/', visitor_id: 'vis-101', created_at: getDateOffset(4, 2) },
      { id: 'ev-2', event_type: 'site_visit', product_id: null, lead_id: null, page: '/', visitor_id: 'vis-102', created_at: getDateOffset(4, 5) },
      { id: 'ev-3', event_type: 'product_view', product_id: 'prod-1', lead_id: null, page: '/produit/l-empire-du-business-moderne', visitor_id: 'vis-101', created_at: getDateOffset(4, 6) },
      { id: 'ev-4', event_type: 'product_click', product_id: 'prod-1', lead_id: null, page: '/', visitor_id: 'vis-101', created_at: getDateOffset(4, 6) },
      { id: 'ev-5', event_type: 'whatsapp_order_click', product_id: 'prod-1', lead_id: null, page: '/produit/l-empire-du-business-moderne', visitor_id: 'vis-101', created_at: getDateOffset(4, 7) },

      // Day 3
      { id: 'ev-6', event_type: 'site_visit', product_id: null, lead_id: null, page: '/', visitor_id: 'vis-103', created_at: getDateOffset(3, 1) },
      { id: 'ev-7', event_type: 'product_view', product_id: 'prod-2', lead_id: null, page: '/produit/la-voie-de-la-liberte-financiere', visitor_id: 'vis-103', created_at: getDateOffset(3, 2) },
      { id: 'ev-8', event_type: 'product_click', product_id: 'prod-2', lead_id: null, page: '/', visitor_id: 'vis-103', created_at: getDateOffset(3, 2) },
      { id: 'ev-9', event_type: 'whatsapp_order_click', product_id: 'prod-2', lead_id: null, page: '/produit/la-voie-de-la-liberte-financiere', visitor_id: 'vis-103', created_at: getDateOffset(3, 3) },
      { id: 'ev-10', event_type: 'site_visit', product_id: null, lead_id: null, page: '/categories/business-entrepreneuriat', visitor_id: 'vis-104', created_at: getDateOffset(3, 4) },
      { id: 'ev-11', event_type: 'product_view', product_id: 'prod-1', lead_id: null, page: '/produit/l-empire-du-business-moderne', visitor_id: 'vis-104', created_at: getDateOffset(3, 5) },
      { id: 'ev-12', event_type: 'lead_form_submit', product_id: null, lead_id: 'lead-4', page: '/lead-magnet/guide-liberte-financiere', visitor_id: 'vis-105', created_at: getDateOffset(3, 6) },
      { id: 'ev-13', event_type: 'lead_magnet_download', product_id: null, lead_id: 'lead-4', page: '/merci', visitor_id: 'vis-105', created_at: getDateOffset(3, 6) },

      // Day 2
      { id: 'ev-14', event_type: 'site_visit', product_id: null, lead_id: null, page: '/', visitor_id: 'vis-106', created_at: getDateOffset(2, 2) },
      { id: 'ev-15', event_type: 'site_visit', product_id: null, lead_id: null, page: '/', visitor_id: 'vis-107', created_at: getDateOffset(2, 3) },
      { id: 'ev-16', event_type: 'product_view', product_id: 'prod-3', lead_id: null, page: '/produit/le-pouvoir-inflexible-du-mindset', visitor_id: 'vis-106', created_at: getDateOffset(2, 4) },
      { id: 'ev-17', event_type: 'product_click', product_id: 'prod-3', lead_id: null, page: '/', visitor_id: 'vis-106', created_at: getDateOffset(2, 4) },
      { id: 'ev-18', event_type: 'lead_form_submit', product_id: null, lead_id: 'lead-3', page: '/lead-magnet/checklist-mindset-invincible', visitor_id: 'vis-107', created_at: getDateOffset(2, 5) },
      { id: 'ev-19', event_type: 'lead_magnet_download', product_id: null, lead_id: 'lead-3', page: '/merci', visitor_id: 'vis-107', created_at: getDateOffset(2, 5) },

      // Yesterday
      { id: 'ev-20', event_type: 'site_visit', product_id: null, lead_id: null, page: '/', visitor_id: 'vis-108', created_at: getDateOffset(1, 1) },
      { id: 'ev-21', event_type: 'site_visit', product_id: null, lead_id: null, page: '/', visitor_id: 'vis-109', created_at: getDateOffset(1, 2) },
      { id: 'ev-22', event_type: 'product_view', product_id: 'prod-5', lead_id: null, page: '/produit/l-art-du-marketing-d-acquisition-copywriting', visitor_id: 'vis-108', created_at: getDateOffset(1, 3) },
      { id: 'ev-23', event_type: 'product_click', product_id: 'prod-5', lead_id: null, page: '/', visitor_id: 'vis-108', created_at: getDateOffset(1, 3) },
      { id: 'ev-24', event_type: 'whatsapp_order_click', product_id: 'prod-5', lead_id: null, page: '/produit/l-art-du-marketing-d-acquisition-copywriting', visitor_id: 'vis-108', created_at: getDateOffset(1, 4) },
      { id: 'ev-25', event_type: 'lead_form_submit', product_id: null, lead_id: 'lead-2', page: '/lead-magnet/masterclass-audio-negociation', visitor_id: 'vis-110', created_at: getDateOffset(1, 5) },
      { id: 'ev-26', event_type: 'lead_magnet_download', product_id: null, lead_id: 'lead-2', page: '/merci', visitor_id: 'vis-110', created_at: getDateOffset(1, 5) },

      // Today
      { id: 'ev-27', event_type: 'site_visit', product_id: null, lead_id: null, page: '/', visitor_id: 'vis-111', created_at: getDateOffset(0, -2) },
      { id: 'ev-28', event_type: 'site_visit', product_id: null, lead_id: null, page: '/', visitor_id: 'vis-112', created_at: getDateOffset(0, -1) },
      { id: 'ev-29', event_type: 'product_view', product_id: 'prod-1', lead_id: null, page: '/produit/l-empire-du-business-moderne', visitor_id: 'vis-111', created_at: getDateOffset(0, -1) },
      { id: 'ev-30', event_type: 'product_click', product_id: 'prod-1', lead_id: null, page: '/', visitor_id: 'vis-111', created_at: getDateOffset(0, -1) },
      { id: 'ev-31', event_type: 'whatsapp_order_click', product_id: 'prod-1', lead_id: null, page: '/produit/l-empire-du-business-moderne', visitor_id: 'vis-111', created_at: getDateOffset(0, 0) },
      { id: 'ev-32', event_type: 'lead_form_submit', product_id: null, lead_id: 'lead-1', page: '/lead-magnet/guide-liberte-financiere', visitor_id: 'vis-113', created_at: getDateOffset(0, 0) },
      { id: 'ev-33', event_type: 'lead_magnet_download', product_id: null, lead_id: 'lead-1', page: '/merci', visitor_id: 'vis-113', created_at: getDateOffset(0, 0) },
    ];

    for (const ev of initialEvents) {
      insertEvent.run(
        ev.id,
        ev.event_type,
        ev.product_id,
        ev.lead_id,
        ev.page,
        ev.visitor_id,
        JSON.stringify(ev.metadata || {}),
        ev.created_at
      );
    }
  }

  // Update any existing events with legacy product names to proper product ids
  try {
    db.exec(`
      UPDATE analytics_events SET product_id = 'prod-1' WHERE product_id = 'prod-empire-business-moderne';
      UPDATE analytics_events SET product_id = 'prod-2' WHERE product_id = 'prod-voie-liberte-financiere';
      UPDATE analytics_events SET product_id = 'prod-3' WHERE product_id = 'prod-pouvoir-inflexible-mindset';
      UPDATE analytics_events SET product_id = 'prod-5' WHERE product_id = 'prod-alchimie-closing-haute-tension';
    `);
  } catch {}

  // Seed blog_posts if empty
  const checkBlog = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get() as { count: number };
  if (checkBlog.count === 0) {
    const insertPost = db.prepare(`
      INSERT INTO blog_posts (
        id, title, slug, excerpt, content, category, author, date, read_time, image_url, is_published, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const initialPosts = [
      {
        id: 'blog-1',
        title: "Comment maximiser sa rétention d'apprentissage avec les livres audio",
        slug: 'comment-maximiser-sa-retention-d-apprentissage-avec-les-livres-audio',
        excerpt: "Découvrez la méthode de la double écoute active et de la prise de notes différée pour retenir 80% du contenu d'un livre audio professionnel.",
        content: `L'écoute passive d'un livre audio est agréable, mais elle ne suffit pas lorsqu'il s'agit d'intégrer des stratégies business complexes ou des compétences d'investissement.\n\n### 1. La règle de la vitesse adaptée (1.2x à 1.4x)\nDes études en neurosciences cognitives démontrent qu'une accélération modérée force le cerveau à maintenir une attention focalisée et élimine les distractions parasites.\n\n### 2. Le carnet d'impact différé\nNe notez rien pendant que vous marchez ou conduisez. Prenez simplement 5 minutes le soir pour transcrire les 3 idées fondamentales que vous avez retenues. Cette récupération active renforce considérablement la mémoire à long terme.\n\n### 3. L'exécution sous 24 heures\nUn concept non appliqué dans les 24 heures a 90% de chances d'être oublié. Choisissez un seul levier par session d'écoute et mettez-le immédiatement à l'épreuve dans vos affaires.`,
        category: 'Méthodologie & Efficacité',
        author: 'Alexandre Beaulieu',
        date: '18 Mars 2026',
        read_time: '5 min',
        image_url: '/src/assets/images/cover_business_empire_1790615532791.jpg',
        is_published: 1,
      },
      {
        id: 'blog-2',
        title: 'Les 5 habitudes financières des entrepreneurs à succès en 2026',
        slug: 'les-5-habitudes-financieres-des-entrepreneurs-a-succes-en-2026',
        excerpt: "Au-delà du chiffre d'affaires, découvrez les règles de trésorerie et d'investissement passif adoptées par les fondateurs les plus résilients.",
        content: `La rentabilité brute d'une entreprise est inutile si le patrimoine personnel du dirigeant reste vulnérable aux aléas macroéconomiques.\n\n### 1. Séparer rigoureusement trésorerie d'entreprise et compte personnel\nLes entrepreneurs qui durent s'accordent une rémunération prévisible et automatisent l'investissement de leurs surplus vers des actifs productifs.\n\n### 2. La constitution d'un matelas de résilience de 12 mois\nDans un monde instable, la liquidité est le roi incontesté de la sérénité décisionnelle. Avoir 12 mois de train de vie sécurisé permet de refuser les clients toxiques et de saisir les meilleures opportunités.\n\n### 3. L'allocation d'actifs asymétrique\nPrivilégiez les investissements où le risque à la baisse est strictement capé, tandis que le potentiel de valorisation à long terme bénéficie des intérêts composés.`,
        category: 'Finance & Stratégie',
        author: 'Elena Valenti',
        date: '12 Mars 2026',
        read_time: '6 min',
        image_url: '/src/assets/images/cover_financial_liberty_1790615544438.jpg',
        is_published: 1,
      },
      {
        id: 'blog-3',
        title: 'Routine matinale et discipline mentale : le rituel des 30 minutes',
        slug: 'routine-matinale-et-discipline-mentale-le-rituel-des-30-minutes',
        excerpt: "Pourquoi commencer sa journée par 20 minutes d'écoute ciblée décuple la clarté stratégique et réduit drastiquement la fatigue décisionnelle.",
        content: `La façon dont vous occupez la première demi-heure de votre journée détermine la qualité de vos 14 heures suivantes.\n\n### 1. Bannir les réseaux sociaux avant 9h\nConsulter les notifications dès le réveil place votre cerveau en mode réactif et défensif. Vous subissez les priorités des autres au lieu d'imposer les vôtres.\n\n### 2. La dose matinale d'excellence audio\nÉcouter 20 minutes d'un ouvrage de référence pendant vos étirements ou votre préparation mentale nourrit votre subconscient avec des principes de leadership élevés.\n\n### 3. Définir votre « One Big Thing » quotidienne\nChaque matin, isolez l'unique tâche qui, une fois accomplie, rendra toutes les autres secondaires.`,
        category: 'Mindset & Leadership',
        author: 'Dr. Lucas Vane',
        date: '5 Mars 2026',
        read_time: '4 min',
        image_url: '/src/assets/images/cover_mindset_power_1790615556990.jpg',
        is_published: 1,
      },
    ];

    for (const post of initialPosts) {
      insertPost.run(
        post.id,
        post.title,
        post.slug,
        post.excerpt,
        post.content,
        post.category,
        post.author,
        post.date,
        post.read_time,
        post.image_url,
        post.is_published,
        now,
        now
      );
    }
  }

  // Seed testimonials if empty
  const checkTesti = db.prepare('SELECT COUNT(*) as count FROM testimonials').get() as { count: number };
  if (checkTesti.count === 0) {
    const insertTesti = db.prepare(`
      INSERT INTO testimonials (
        id, name, role, company, avatar_url, content, rating, audiobook_title, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const initialTestimonials = [
      {
        id: 'testi-1',
        name: 'Julien Renard',
        role: 'Fondateur & Dirigeant',
        company: 'Novacrest Capital',
        avatar_url: '',
        content: "VISION BOOKS a transformé mes temps de trajet quotidiens en un véritable accélérateur de croissance. La masterclass audio sur le Business Moderne m'a permis de restructurer entièrement nos processus d'acquisition avec une efficacité redoutable.",
        rating: 5,
        audiobook_title: "L'Empire du Business Moderne",
        is_active: 1,
      },
      {
        id: 'testi-2',
        name: 'Sarah Mallet',
        role: 'Consultante Financière',
        company: 'Patrimoine & Conseils',
        avatar_url: '',
        content: "La clarté des explications et le pragmatisme des modèles partagés sont remarquables. L'ouvrage sur la Liberté Financière m'a ouvert les yeux sur plusieurs failles de mon allocation d'actifs. Indispensable !",
        rating: 5,
        audiobook_title: 'La Voie de la Liberté Financière',
        is_active: 1,
      },
      {
        id: 'testi-3',
        name: 'Thomas Dupont',
        role: 'Directeur des Opérations',
        company: 'Apex European Group',
        avatar_url: '',
        content: "Des analyses d'une rigueur absolue. L'expérience d'écoute est fluide et la commande directe avec message pré-rempli sur WhatsApp permet de recevoir immédiatement ses liens sans friction.",
        rating: 5,
        audiobook_title: 'Le Pouvoir Inflexible du Mindset',
        is_active: 1,
      },
      {
        id: 'testi-4',
        name: 'Amélie Bensalem',
        role: 'Entrepreneure & Fondatrice',
        company: 'Lumina Growth',
        avatar_url: '',
        content: "Le bonus offert et les fiches mémo condensées apportent une valeur colossale. Un investissement rentabilisé dès la première semaine d'application. Bravo pour cette curation exigeante.",
        rating: 5,
        audiobook_title: "L'Art du Marketing d'Acquisition & Copywriting",
        is_active: 1,
      },
    ];

    for (const t of initialTestimonials) {
      insertTesti.run(
        t.id,
        t.name,
        t.role,
        t.company,
        t.avatar_url,
        t.content,
        t.rating,
        t.audiobook_title,
        t.is_active,
        now,
        now
      );
    }
  }

  // Seed default Pack VIP if empty
  const checkVip = db.prepare('SELECT COUNT(*) as count FROM vip_packs').get() as { count: number };
  if (checkVip.count === 0) {
    const insertVip = db.prepare(`
      INSERT INTO vip_packs (
        id, title, subtitle, image, normal_price, sale_price, description, content, cta_text, show_on_home, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertVip.run(
      'pack-vip-elite',
      'Pack VIP — La Bibliothèque Privée des Dirigeants',
      'Accès immédiat et illimité à l\'intégralité des 6 masterclasses audio, synthèses exécutives et bonus confidentiels.',
      '/src/assets/images/cover_business_empire_1790615532791.jpg',
      149.00,
      79.00,
      'Un investissement unique pour acquérir les modèles mentaux des plus grands stratèges et investisseurs mondiaux. Sans abonnement, écoute à vie.',
      JSON.stringify([
        "Les 6 Livres Audio Intégraux en Haute Définition Studio (320 kbps)",
        "Fiches Mémos & Plans d'Action Exécutifs condensés en format PDF",
        "Scripts confidentiels de vente et modèles de négociation à haute valeur",
        "Mises à jour gratuites et accès prioritaire aux futures parutions",
        "Assistance et conciergerie privée sur WhatsApp"
      ]),
      'Commander le Pack VIP sur WhatsApp',
      1,
      1,
      now,
      now
    );
  }
}

# AUDIT DE SÉCURITÉ - VISION BOOKS

## Analysé le : 2026-10-10

### PROBLÈMES CRITIQUES IDENTIFIÉS

#### 1. ROUTES API SANS PROTECTION

Le fichier `server.ts` contient **30+ routes Express** qui sont **TOUTES PUBLIQUES** :

**Routes Critiques Non Protégées :**

```
Lecture des données privées:
  GET  /api/leads                    → Retourne TOUS les prospects (CONFIDENTIEL)
  GET  /api/leads/:id                → Accès prospect spécifique (CONFIDENTIEL)
  GET  /api/settings                 → Paramètres internes (CONFIDENTIEL)
  GET  /api/analytics/events         → Événements analytics (PRIVÉ)
  GET  /api/analytics/stats          → Statistiques de conversion (PRIVÉ)
  GET  /api/vip-pack                 → Configuration Pack VIP (ADMIS SEULEMENT)

Modification des données:
  POST   /api/categories             → Créer catégorie (ADMIS SEULEMENT)
  PUT    /api/categories/:id         → Modifier catégorie (ADMIS SEULEMENT)
  PATCH  /api/categories/:id/toggle  → Activer/désactiver (ADMIS SEULEMENT)
  DELETE /api/categories/:id         → Supprimer catégorie (ADMIS SEULEMENT)
  
  POST   /api/products               → Créer produit (ADMIS SEULEMENT)
  PUT    /api/products/:id           → Modifier produit (ADMIS SEULEMENT)
  PATCH  /api/products/:id/*         → Modifier statut (ADMIS SEULEMENT)
  DELETE /api/products/:id           → Supprimer produit (ADMIS SEULEMENT)
  POST   /api/products/generate-ai   → Générer avec IA (ADMIS SEULEMENT)
  
  POST   /api/lead-magnets           → Créer magnet (ADMIS SEULEMENT)
  PUT    /api/lead-magnets/:id       → Modifier magnet (ADMIS SEULEMENT)
  PATCH  /api/lead-magnets/:id/*     → Modifier statut (ADMIS SEULEMENT)
  DELETE /api/lead-magnets/:id       → Supprimer magnet (ADMIS SEULEMENT)
  
  PUT    /api/leads/:id              → Modifier prospect (ADMIS SEULEMENT)
  DELETE /api/leads/:id              → Supprimer prospect (ADMIS SEULEMENT)
  
  PUT    /api/settings               → Modifier paramètres (ADMIS SEULEMENT)
  
  POST   /api/blog                   → Créer article (ADMIS SEULEMENT)
  PUT    /api/blog/:id               → Modifier article (ADMIS SEULEMENT)
  PATCH  /api/blog/:id/toggle        → Publier (ADMIS SEULEMENT)
  DELETE /api/blog/:id               → Supprimer article (ADMIS SEULEMENT)
  
  POST   /api/testimonials           → Créer témoignage (ADMIS SEULEMENT)
  PUT    /api/testimonials/:id       → Modifier témoignage (ADMIS SEULEMENT)
  PATCH  /api/testimonials/:id/*     → Modifier statut (ADMIS SEULEMENT)
  DELETE /api/testimonials/:id       → Supprimer témoignage (ADMIS SEULEMENT)
  
  PUT    /api/vip-pack               → Créer/modifier Pack VIP (ADMIS SEULEMENT)
  PATCH  /api/vip-pack/*             → Modifier Pack VIP (ADMIS SEULEMENT)
  DELETE /api/vip-pack               → Supprimer Pack VIP (ADMIS SEULEMENT)
  
  POST   /api/upload                 → Téléverser fichier (ADMIS SEULEMENT)
```

**Conséquences :**
- N'IMPORTE QUI peut lire tous les **prospects et leurs numéros WhatsApp privés**
- N'IMPORTE QUI peut **modifier ou supprimer les produits**
- N'IMPORTE QUI peut **changer les paramètres internes** (WhatsApp, prix, URLs)
- N'IMPORTE QUI peut **créer des articles de blog** ou **faux témoignages**
- N'IMPORTE QUI peut **voir les statistiques privées** (taux de conversion, clicks)
- N'IMPORTE QUI peut **télécharger des fichiers** sur le serveur

---

#### 2. ROUTES PUBLIQUES CORRECTES

Ces routes **DOIVENT RESTER PUBLIQUES** :

```
Catalogue public:
  GET  /api/categories?active_only=true    → Catégories actives publiques
  GET  /api/categories/:id                 → Détail catégorie publique
  GET  /api/products?active_only=true      → Produits actifs publics (prix, description)
  GET  /api/products/:id                   → Détail produit public
  GET  /api/blog?published_only=true       → Articles publiés
  GET  /api/blog/:id                       → Article détail
  GET  /api/lead-magnets?active_only=true  → Lead magnets publiés
  GET  /api/lead-magnets/:id               → Détail Lead magnet
  GET  /api/testimonials?active_only=true  → Témoignages actifs publics
  GET  /api/vip-pack                       → Infos VIP Pack publiques

Formulaires publics (non authentifiés):
  POST /api/leads                          → Créer prospect depuis formulaire
  POST /api/lead-magnets/:id/download      → Compter téléchargement
  POST /api/analytics/track                → Suivre événement visiteur
  POST /api/assistant/chat                 → Chat commercial (Gemini)
  GET  /api/order/whatsapp                 → Générer lien WhatsApp commande
  GET  /downloads/:filename                → Télécharger guide
```

---

#### 3. DONNÉES SENSIBLES EXPOSÉES

**Prospects (Leads) :**
- Prénoms complets
- Numéros WhatsApp privés
- Lead magnet associé
- Messages de relance (J1, J2, J3)
- Statuts de suivi

**Paramètres (Settings) :**
- Numéro WhatsApp métier
- Nom plateforme
- Email support
- Devise

**Analytics Privées :**
- Nombre de visiteurs
- Produits les plus vus
- Taux de conversion
- Événements clients

**Fichiers Audio Payants :**
- `audio_download_url` : URLs privées de téléchargement audio
- `product_details` : Contenu confidentiel

---

#### 4. AUTHENTIFICATION FIREBASE EXISTANTE

**Statut Actuel :**
- ✅ Google OAuth Firebase est configuré
- ✅ AuthContext.tsx vérifie les droits admin
- ✅ `ADMIN_EMAIL = 'barkissac80@gmail.com'` est la source de vérité
- ❌ **MAIS** : Vérification SEULEMENT côté frontend React
- ❌ **MAIS** : Aucune vérification côté serveur Express

**Problème :**
Un attaquant peut :
1. Contourner React/authentification frontend
2. Appeler directement `/api/leads` ou `/api/products` via curl/Postman
3. Obtenir toutes les données privées sans token

---

## SOLUTION RECOMMANDÉE

### Phase 1 : Audit & Audit Log
1. ✅ Identifier toutes les routes (FAIT)
2. ✅ Classer public vs admin (FAIT)
3. → Ajouter middleware Firebase Auth côté Express
4. → Protéger les routes admin avec ce middleware

### Phase 2 : Middleware Firebase
1. Créer middleware `requireFirebaseAdmin()` dans Express
2. Vérifier le token Firebase depuis `Authorization: Bearer {idToken}`
3. Valider que l'email utilisateur est dans `ADMIN_EMAILS`
4. Rejeter toute requête non authentifiée ou non autorisée

### Phase 3 : Protection des Routes
1. Ajouter `requireFirebaseAdmin` à TOUTES les routes de modification
2. Vérifier les routes de lecture sensibles (leads, settings, analytics)
3. Laisser publiques UNIQUEMENT les routes de catalogue

### Phase 4 : Tests de Sécurité
1. Vérifier qu'un visiteur public ne peut pas lire `/api/leads`
2. Vérifier qu'un visiteur public ne peut pas appeler `PUT /api/products/:id`
3. Vérifier que l'admin autorisé PEUT accéder à toutes les routes
4. Vérifier que le catalogue public fonctionne sans authentification

---

## IMPACT SUR FIREBASE

**Règles Firestore :**
- Les règles Firestore protègent déjà la collection `admins`
- Les règles permettent la lecture publique du catalogue
- Express + Firebase Auth ajoutent une couche supplémentaire côté serveur
- **Pas de modification des règles nécessaire** pour cette audit

---

## FICHIERS À MODIFIER

1. `server.ts` : Ajouter middleware Firebase + protéger routes
2. `src/server/auth.ts` (nouveau) : Middleware d'authentification Firebase
3. `src/types/index.ts` (mise à jour) : Types Express + authentification
4. `.env.example` : Documenter les variables

---

## STATUT ACTUEL

- ❌ **CRITIQUE** : Routes admin totalement exposées
- ❌ **CRITIQUE** : Données privées (prospects) accessibles publiquement
- ❌ **CRITIQUE** : N'importe qui peut modifier les produits
- ⚠️ **MOYEN** : IA Gemini appelle Firebase depuis backend (OK)
- ✅ **BON** : Firebase Auth Google configuré et fonctionnel
- ✅ **BON** : AuthContext vérifie admin côté frontend (insuffisant)

---

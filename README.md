# Marchés Publics Maroc — Plateforme de Veille

Plateforme open-source pour surveiller les marchés publics marocains issus de [marchespublics.gov.ma](https://www.marchespublics.gov.ma/pmmp/).

**Stack 100% gratuite :**
- Scraper : Python + Playwright (GitHub Actions)
- Base de données : Supabase (free tier)
- Frontend : Next.js 14 (Vercel free tier)

---

## 1. Supabase — Créer la base de données

1. Créer un compte sur [supabase.com](https://supabase.com) (gratuit)
2. Créer un nouveau projet
3. Aller dans **SQL Editor → New Query**
4. Copier-coller le contenu de `supabase/schema.sql` et exécuter
5. Récupérer vos clés dans **Settings → API** :
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secret, ne pas exposer côté client)

---

## 2. Scraper — Exécution locale

```bash
cd scraper

# Créer l'environnement Python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt
playwright install chromium

# Configurer les secrets
cp .env.example .env
# Éditer .env avec vos clés Supabase

# Tester (dry-run, affiche les résultats sans sauvegarder)
python scraper.py --dry-run --page-limit 2

# Scraper les 7 derniers jours
python scraper.py --days-back 7

# Scraper les 30 derniers jours
python scraper.py --days-back 30
```

---

## 3. GitHub Actions — Scraping automatique (toutes les 6h)

1. Pusher ce repo sur GitHub (public ou privé)
2. Dans **Settings → Secrets and variables → Actions**, ajouter :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Le workflow `.github/workflows/scrape.yml` se déclenchera automatiquement

Pour lancer manuellement : **Actions → Scrape Marchés Publics → Run workflow**

---

## 4. Frontend — Développement local

```bash
cd frontend

npm install

cp .env.local.example .env.local
# Éditer .env.local avec votre SUPABASE_URL et SUPABASE_ANON_KEY

npm run dev
# Ouvrir http://localhost:3000
```

---

## 5. Déploiement sur Vercel (gratuit)

1. Aller sur [vercel.com](https://vercel.com) → New Project → importer ce repo
2. Définir le **Root Directory** sur `frontend`
3. Ajouter les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Déployer

---

## Catégories disponibles

| Slug | Nom | Mots-clés principaux |
|------|-----|---------------------|
| `communication` | Communication & Relations Publiques | communication, publicité, relations publiques, médias |
| `creation-contenu` | Création de Contenu & Digital | contenu, rédaction, réseaux sociaux, vidéo |
| `informatique` | Informatique & Transformation Digitale | informatique, logiciel, développement, cloud |
| `etudes-conseil` | Études, Conseil & Formation | étude, audit, conseil, formation |
| `travaux` | Travaux & Construction | travaux, construction, réhabilitation |
| `fournitures` | Fournitures & Équipements | fourniture, équipement, matériel |
| `sante` | Santé & Médical | médical, santé, médicament |
| `services-generaux` | Services Généraux | gardiennage, nettoyage, entretien |
| `environnement` | Environnement & Énergie | énergie, solaire, eau, déchets |
| `agriculture` | Agriculture & Agroalimentaire | agriculture, pêche, élevage |

Pour ajouter une catégorie personnalisée, insérer dans la table `categories` :

```sql
INSERT INTO categories (slug, name, color, icon, keywords, is_custom) VALUES
  ('ma-categorie', 'Ma Catégorie', '#FF6B6B', '🎯', ARRAY['mot-clé 1', 'mot-clé 2'], TRUE);
```

---

## Ajuster le scraper selon la structure réelle du site

Le site marchespublics.gov.ma utilise le framework **PRADO**. Si les sélecteurs CSS ne matchent pas exactement :

1. Ouvrir le site dans Chrome DevTools (F12)
2. Aller sur la page de résultats
3. Inspecter le tableau des résultats pour trouver le bon sélecteur
4. Modifier `extract_rows()` dans `scraper/scraper.py`

Le scraper essaie automatiquement plusieurs sélecteurs dans l'ordre, et tombe sur un fallback générique si aucun ne marche.

---

## Structure du projet

```
mazal-marches/
├── scraper/
│   ├── scraper.py        # Scraper principal (Playwright)
│   ├── categories.py     # Détection automatique des catégories
│   └── requirements.txt
├── supabase/
│   └── schema.sql        # Schéma DB + vues + politiques RLS
├── .github/
│   └── workflows/
│       └── scrape.yml    # CI/CD GitHub Actions (cron)
└── frontend/             # Next.js 14
    ├── app/
    │   ├── page.tsx              # Page principale (liste + filtres)
    │   └── marche/[id]/page.tsx  # Page détail
    ├── components/
    │   ├── Header.tsx
    │   ├── MarketCard.tsx
    │   ├── FilterSidebar.tsx
    │   ├── StatsBar.tsx
    │   ├── CategoryBadge.tsx
    │   └── DeadlineBadge.tsx
    └── lib/
        ├── supabase.ts   # Requêtes DB
        └── types.ts      # Types TypeScript
```

# Moroccan Public Tenders — Monitoring Platform (vibe-coded)
An open-source platform for monitoring Moroccan public procurement tenders from [marchespublics.gov.ma](https://www.marchespublics.gov.ma/pmmp/).


**Free Stack:**
- Scraper: Python + Playwright (GitHub Actions)
- Database: Supabase (free tier)
- Frontend: Next.js 14 (Vercel free tier)


## Available Categories

| Slug | Name | Main Keywords |
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

## Adjust the scraper to match the actual structure of the site

marchespublics.gov.ma website uses the **PRADO** framework. If the CSS selectors don't match exactly:

1. Open the website in Chrome DevTools (F12)
2. Go to the results page
3. Inspect the results table to find the correct selector
4. Modify `extract_rows()` in `scraper/scraper.py`

The scraper automatically tries several selectors in order and falls back to a generic fallback if none of them work.

---

## Project Structure

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

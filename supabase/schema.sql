-- ─────────────────────────────────────────────────────────────────────────────
-- Marchés Publics Maroc — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Categories (preset + custom) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(64) UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  color       VARCHAR(16) NOT NULL DEFAULT '#6B7280',
  icon        VARCHAR(8),
  keywords    TEXT[] NOT NULL DEFAULT '{}',
  is_custom   BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = user-created
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Acheteurs (normalized buyers) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS acheteurs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  normalized  TEXT,             -- lowercase, diacritics removed for search
  ville       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Marchés (tenders) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        VARCHAR(128) UNIQUE,         -- e.g. "2025/001234/ICM"
  objet            TEXT,                         -- title / description
  acheteur         TEXT,                         -- raw buyer name from scrape
  acheteur_id      UUID REFERENCES acheteurs(id),
  type_procedure   VARCHAR(64),                  -- AOO, CONCA, AMI, etc.
  categorie        VARCHAR(64),                  -- Services, Travaux, Fournitures
  domaine          TEXT,                         -- sub-domain / sector
  programme        TEXT,                         -- context / programme
  lots             TEXT,                         -- lot description
  lieu_execution   TEXT,
  budget           NUMERIC(15, 2),               -- parsed amount in MAD
  budget_text      TEXT,                         -- raw budget string
  date_publication DATE,
  date_limite      DATE,                         -- submission deadline
  statut           VARCHAR(32) DEFAULT 'en_cours', -- en_cours | archive | attribue
  url              TEXT,                         -- source URL on marchespublics.gov.ma
  scraped_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Marché ↔ Category (many-to-many) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marche_categories (
  marche_id    UUID NOT NULL REFERENCES marches(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (marche_id, category_id)
);

-- ─── Custom Keywords (per user, saved in browser / Supabase) ─────────────────
CREATE TABLE IF NOT EXISTS custom_keywords (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword     TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS marches_date_pub    ON marches(date_publication DESC);
CREATE INDEX IF NOT EXISTS marches_date_limite ON marches(date_limite ASC);
CREATE INDEX IF NOT EXISTS marches_acheteur    ON marches(acheteur);
CREATE INDEX IF NOT EXISTS marches_categorie   ON marches(categorie);
CREATE INDEX IF NOT EXISTS marches_statut      ON marches(statut);
CREATE INDEX IF NOT EXISTS marches_budget      ON marches(budget);
CREATE INDEX IF NOT EXISTS marches_objet_fts   ON marches USING gin(to_tsvector('french', COALESCE(objet, '')));

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER marches_updated_at
  BEFORE UPDATE ON marches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security (public read, service-role write) ─────────────────────
ALTER TABLE marches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE marche_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE acheteurs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_keywords   ENABLE ROW LEVEL SECURITY;

-- Public anon can read everything
DROP POLICY IF EXISTS "Public read marches"           ON marches;
DROP POLICY IF EXISTS "Public read categories"        ON categories;
DROP POLICY IF EXISTS "Public read marche_categories" ON marche_categories;
DROP POLICY IF EXISTS "Public read acheteurs"         ON acheteurs;
DROP POLICY IF EXISTS "Public read custom_keywords"   ON custom_keywords;
DROP POLICY IF EXISTS "Service role write marches"    ON marches;
DROP POLICY IF EXISTS "Service role write categories" ON categories;
DROP POLICY IF EXISTS "Service role write mc"         ON marche_categories;
DROP POLICY IF EXISTS "Service role write acheteurs"  ON acheteurs;
DROP POLICY IF EXISTS "Service role write keywords"   ON custom_keywords;

CREATE POLICY "Public read marches"           ON marches           FOR SELECT USING (true);
CREATE POLICY "Public read categories"        ON categories        FOR SELECT USING (true);
CREATE POLICY "Public read marche_categories" ON marche_categories FOR SELECT USING (true);
CREATE POLICY "Public read acheteurs"         ON acheteurs         FOR SELECT USING (true);
CREATE POLICY "Public read custom_keywords"   ON custom_keywords   FOR SELECT USING (true);

-- Only service role (server/scraper) can write
CREATE POLICY "Service role write marches"       ON marches           FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write categories"    ON categories        FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write mc"            ON marche_categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write acheteurs"     ON acheteurs         FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write keywords"      ON custom_keywords   FOR ALL USING (auth.role() = 'service_role');

-- ─── Seed Categories ──────────────────────────────────────────────────────────
INSERT INTO categories (slug, name, color, icon, keywords) VALUES
  ('communication',    'Communication & Relations Publiques',     '#7C3AED', '📢', ARRAY['communication','publicité','relations publiques','médias','presse','campagne','agence de communication','attaché de presse','notoriété','événementiel']),
  ('creation-contenu', 'Création de Contenu & Digital',           '#EC4899', '✍️', ARRAY['contenu','rédaction','création de contenu','réseaux sociaux','social media','design graphique','graphisme','vidéo','audiovisuel','motion design','animation']),
  ('informatique',     'Informatique & Transformation Digitale',  '#3B82F6', '💻', ARRAY['informatique','logiciel','développement','application','site web','plateforme','digital','numérique','cybersécurité','cloud','intelligence artificielle','data']),
  ('etudes-conseil',   'Études, Conseil & Formation',             '#10B981', '📊', ARRAY['étude','conseil','audit','expertise','évaluation','diagnostic','consulting','formation','séminaire','assistance à maîtrise d''ouvrage','amo','stratégie']),
  ('travaux',          'Travaux & Construction',                   '#F59E0B', '🏗️', ARRAY['travaux','construction','réhabilitation','bâtiment','voirie','génie civil','infrastructure','aménagement','rénovation']),
  ('fournitures',      'Fournitures & Équipements',               '#EF4444', '📦', ARRAY['fourniture','équipement','matériel','mobilier','véhicule','achat','approvisionnement','consommable']),
  ('sante',            'Santé & Médical',                         '#06B6D4', '🏥', ARRAY['médical','santé','médicament','équipement médical','hôpital','laboratoire','pharmacie']),
  ('services-generaux','Services Généraux',                       '#6B7280', '🔧', ARRAY['gardiennage','sécurité','nettoyage','entretien','restauration','transport','maintenance']),
  ('environnement',    'Environnement & Énergie',                 '#22C55E', '🌱', ARRAY['environnement','énergie','solaire','eau','assainissement','déchets','recyclage','développement durable']),
  ('agriculture',      'Agriculture & Agroalimentaire',           '#84CC16', '🌾', ARRAY['agriculture','agricole','agroalimentaire','semence','engrais','irrigation','élevage','pêche'])
ON CONFLICT (slug) DO NOTHING;

-- ─── Useful Views ─────────────────────────────────────────────────────────────

-- Tenders with their categories as a JSON array
CREATE OR REPLACE VIEW marches_with_categories AS
SELECT
  m.*,
  COALESCE(
    json_agg(
      json_build_object('slug', c.slug, 'name', c.name, 'color', c.color, 'icon', c.icon)
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::json
  ) AS categories
FROM marches m
LEFT JOIN marche_categories mc ON mc.marche_id = m.id
LEFT JOIN categories c ON c.id = mc.category_id
GROUP BY m.id;

-- Stats summary
CREATE OR REPLACE VIEW stats AS
SELECT
  COUNT(*) AS total_marches,
  COUNT(*) FILTER (WHERE statut = 'en_cours') AS actifs,
  COUNT(*) FILTER (WHERE date_limite >= CURRENT_DATE) AS avec_deadline_active,
  COALESCE(SUM(budget), 0) AS budget_total,
  COALESCE(AVG(budget) FILTER (WHERE budget > 0), 0) AS budget_moyen,
  COUNT(DISTINCT acheteur) AS nb_acheteurs
FROM marches;

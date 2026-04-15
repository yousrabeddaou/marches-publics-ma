import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

// Lazy init — only created at request time, not at build time
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BASE_URL = "https://www.marchespublics.gov.ma";
const SEARCH_URL = `${BASE_URL}/index.php?page=entreprise.EntrepriseAdvancedSearch&searchAnnCons&AllCons`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};

// ─── Categories keyword matching ──────────────────────────────────────────────
const CATEGORIES: { slug: string; keywords: string[] }[] = [
  { slug: "communication",    keywords: ["communication", "publicité", "relations publiques", "médias", "presse", "campagne", "événementiel", "agence de communication"] },
  { slug: "creation-contenu", keywords: ["contenu", "rédaction", "réseaux sociaux", "social media", "graphisme", "vidéo", "audiovisuel", "motion design"] },
  { slug: "informatique",     keywords: ["informatique", "logiciel", "développement", "application", "site web", "plateforme", "digital", "numérique", "cloud", "cybersécurité", "ia ", "data"] },
  { slug: "etudes-conseil",   keywords: ["étude", "conseil", "audit", "expertise", "évaluation", "consulting", "formation", "stratégie", "amo "] },
  { slug: "travaux",          keywords: ["travaux", "construction", "réhabilitation", "bâtiment", "voirie", "génie civil", "infrastructure", "aménagement"] },
  { slug: "fournitures",      keywords: ["fourniture", "équipement", "matériel", "mobilier", "véhicule", "achat"] },
  { slug: "sante",            keywords: ["médical", "santé", "médicament", "hôpital", "laboratoire", "pharmacie"] },
  { slug: "services-generaux",keywords: ["gardiennage", "sécurité", "nettoyage", "entretien", "restauration", "transport", "maintenance"] },
  { slug: "environnement",    keywords: ["environnement", "énergie", "solaire", "eau", "assainissement", "déchets", "développement durable"] },
  { slug: "agriculture",      keywords: ["agriculture", "agricole", "pêche", "élevage", "irrigation"] },
];

function detectCategories(text: string): string[] {
  const lower = text.toLowerCase();
  return CATEGORIES
    .filter((c) => c.keywords.some((kw) => lower.includes(kw)))
    .map((c) => c.slug);
}

function parseDate(raw?: string): string | null {
  if (!raw) return null;
  const clean = raw.trim();
  // DD/MM/YYYY
  const m = clean.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}


// ─── Fetch + parse one page ───────────────────────────────────────────────────
async function scrapePage(url: string): Promise<{ marches: any[]; nextUrl: string | null }> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const marches: any[] = [];

  // Find results table — try multiple selectors
  let rows = $("table tr").filter((_, el) => $(el).find("td").length >= 4);

  rows.each((_, row) => {
    const cells = $(row).find("td").map((_, td) => $(td).text().trim().replace(/\s+/g, " ")).get();
    if (cells.length < 4) return;

    // Skip header rows
    if (cells.some((c) => /type|objet|référence|acheteur/i.test(c) && c.length < 30)) return;

    // Find link to detail page
    const href = $(row).find("a[href]").first().attr("href");
    const detailUrl = href
      ? href.startsWith("http") ? href : `${BASE_URL}/${href.replace(/^\//, "")}`
      : null;

    // Map columns — PRADO grid order:
    // [0] type_procedure, [1] categorie, [2] date_pub, [3] reference,
    // [4] programme, [5] objet, [6] acheteur, [7] lots, [8] lieu, [9-10] ..., [10] date_limite
    const marche = {
      type_procedure: cells[0] || null,
      categorie:      cells[1] || null,
      date_publication: parseDate(cells[2]),
      reference:      cells[3] || null,
      programme:      cells[4] || null,
      objet:          cells[5] || null,
      acheteur:       cells[6] || null,
      lots:           cells[7] || null,
      lieu_execution: cells[8] || null,
      date_limite:    parseDate(cells[10]),
      url:            detailUrl,
      statut:         "en_cours",
      budget:         null as number | null,
      budget_text:    null as string | null,
    };

    // Must have at minimum a reference or objet
    if (!marche.reference && !marche.objet) return;
    if (marche.reference && marche.reference.length > 128) return;

    marches.push(marche);
  });

  // Find next page link
  let nextUrl: string | null = null;
  $("a").each((_, el) => {
    const title = ($(el).attr("title") || "").toLowerCase();
    const text  = $(el).text().toLowerCase().trim();
    if (title.includes("suivant") || text === "suivant" || text === ">" || text === "»") {
      const h = $(el).attr("href");
      if (h && !h.startsWith("javascript")) {
        nextUrl = h.startsWith("http") ? h : `${BASE_URL}/${h.replace(/^\//, "")}`;
      }
    }
  });

  return { marches, nextUrl };
}

// ─── Save to Supabase ─────────────────────────────────────────────────────────
async function saveMarches(marches: any[]): Promise<number> {
  if (marches.length === 0) return 0;
  const sb = getSupabase();

  // Fetch category IDs once
  const { data: cats } = await sb.from("categories").select("id, slug");
  const catMap: Record<string, string> = {};
  (cats || []).forEach((c: { id: string; slug: string }) => { catMap[c.slug] = c.id; });

  let saved = 0;
  for (const m of marches) {
    try {
      const { data, error } = await sb
        .from("marches")
        .upsert(
          { ...m, scraped_at: new Date().toISOString() },
          { onConflict: "reference", ignoreDuplicates: false }
        )
        .select("id")
        .single();

      if (error || !data) continue;

      const slugs = detectCategories(`${m.objet || ""} ${m.domaine || ""}`);
      if (slugs.length > 0) {
        await sb.from("marche_categories").delete().eq("marche_id", data.id);
        const links = slugs
          .filter((s) => catMap[s])
          .map((s) => ({ marche_id: data.id, category_id: catMap[s] }));
        if (links.length > 0) await sb.from("marche_categories").insert(links);
      }
      saved++;
    } catch {
      // continue on individual errors
    }
  }
  return saved;
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  // Allow manual trigger with ?pages=N (default 5 pages)
  const { searchParams } = new URL(request.url);
  const maxPages = Math.min(parseInt(searchParams.get("pages") || "5"), 20);

  try {
    let url: string | null = SEARCH_URL;
    let totalSaved = 0;
    let pageNum = 0;

    while (url && pageNum < maxPages) {
      pageNum++;
      const { marches, nextUrl } = await scrapePage(url);
      const saved = await saveMarches(marches);
      totalSaved += saved;
      url = nextUrl;

      // Small delay between pages
      if (nextUrl) await new Promise((r) => setTimeout(r, 1000));
    }

    return NextResponse.json({
      success: true,
      pages_scraped: pageNum,
      marches_saved: totalSaved,
      scraped_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Scrape error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Vercel cron will call this route via POST
export async function POST(request: Request) {
  return GET(request);
}

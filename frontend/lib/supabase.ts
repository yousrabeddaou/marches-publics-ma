import { createClient } from "@supabase/supabase-js";
import type { Marche, Stats, Category, FilterState } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Marches ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 24;

export async function fetchMarches(
  filters: Partial<FilterState>,
  page = 0
): Promise<{ data: Marche[]; count: number }> {
  let q = supabase
    .from("marches_with_categories")
    .select("*", { count: "exact" });

  // Full-text search
  if (filters.search?.trim()) {
    q = q.textSearch("objet", filters.search.trim(), { type: "websearch", config: "french" });
  }

  // Type filter (Services / Travaux / Fournitures)
  if (filters.type && filters.type !== "all") {
    q = q.ilike("categorie", `%${filters.type}%`);
  }

  // Status filter
  if (filters.statut && filters.statut !== "all") {
    q = q.eq("statut", filters.statut);
  }

  // Acheteur filter
  if (filters.acheteur?.trim()) {
    q = q.ilike("acheteur", `%${filters.acheteur.trim()}%`);
  }

  // Budget range
  if (filters.budgetMin && filters.budgetMin > 0) {
    q = q.gte("budget", filters.budgetMin);
  }
  if (filters.budgetMax && filters.budgetMax > 0) {
    q = q.lte("budget", filters.budgetMax);
  }

  // Date range (publication)
  if (filters.dateFrom) {
    q = q.gte("date_publication", filters.dateFrom);
  }
  if (filters.dateTo) {
    q = q.lte("date_publication", filters.dateTo);
  }

  // Category filter (via join — done post-query below for simplicity)
  // Sorting
  const sortBy = filters.sortBy ?? "date_publication";
  const sortDir = filters.sortDir ?? "desc";
  q = q.order(sortBy, { ascending: sortDir === "asc" });

  // Pagination
  q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  const { data, count, error } = await q;
  if (error) throw error;

  let result = (data as Marche[]) ?? [];

  // Filter by category slug (client-side since categories is JSON array)
  if (filters.category && filters.category !== "all") {
    result = result.filter((m) =>
      m.categories?.some((c) => c.slug === filters.category)
    );
  }

  return { data: result, count: count ?? 0 };
}

export async function fetchMarche(id: string): Promise<Marche | null> {
  const { data, error } = await supabase
    .from("marches_with_categories")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Marche;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function fetchStats(): Promise<Stats | null> {
  const { data, error } = await supabase.from("stats").select("*").single();
  if (error) return null;
  return data as Stats;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) return [];
  return data as Category[];
}

// ─── Acheteurs (for autocomplete) ────────────────────────────────────────────

export async function fetchTopAcheteurs(limit = 50): Promise<string[]> {
  const { data, error } = await supabase
    .from("marches")
    .select("acheteur")
    .not("acheteur", "is", null)
    .limit(limit * 5);  // over-fetch then deduplicate
  if (error) return [];
  const unique = [...new Set((data as { acheteur: string }[]).map((r) => r.acheteur))];
  return unique.slice(0, limit);
}

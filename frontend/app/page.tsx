"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, LayoutGrid, List, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { FilterSidebar } from "@/components/FilterSidebar";
import { MarketCard } from "@/components/MarketCard";
import { StatsBar } from "@/components/StatsBar";
import { fetchMarches, fetchStats, fetchCategories } from "@/lib/supabase";
import type { FilterState, Marche, Stats, Category } from "@/lib/types";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  type: "all",
  category: "all",
  statut: "en_cours",
  budgetMin: 0,
  budgetMax: 0,
  dateFrom: "",
  dateTo: "",
  acheteur: "",
  sortBy: "date_publication",
  sortDir: "desc",
};

const PAGE_SIZE = 24;

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [marches, setMarches] = useState<Marche[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/refresh?pages=10");
      const data = await res.json();
      if (data.success) {
        setRefreshMsg(`✓ ${data.marches_saved} marchés ajoutés`);
        // Reload data
        const { data: newData, count } = await fetchMarches(filters, page);
        setMarches(newData);
        setTotalCount(count);
        fetchStats().then(setStats);
      } else {
        setRefreshMsg("Erreur : " + data.error);
      }
    } catch {
      setRefreshMsg("Erreur de connexion");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load metadata once
  useEffect(() => {
    fetchStats().then(setStats);
    fetchCategories().then(setCategories);
  }, []);

  // Load marches on filter/page change
  useEffect(() => {
    startTransition(async () => {
      try {
        const { data, count } = await fetchMarches(filters, page);
        setMarches(data);
        setTotalCount(count);
      } catch (err) {
        console.error(err);
      }
    });
  }, [filters, page]);

  // Reset page when filters change
  const handleFilterChange = useCallback((update: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...update }));
    setPage(0);
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        search={filters.search}
        onSearchChange={(v) => handleFilterChange({ search: v })}
      />

      <main className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Stats bar */}
        <StatsBar stats={stats} />

        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Marchés Publics</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Données issues de{" "}
              <a
                href="https://www.marchespublics.gov.ma/pmmp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                marchespublics.gov.ma
              </a>
            </p>
          </div>

          {/* Refresh + view toggle */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Récupération…" : "Actualiser les données"}
              </button>
              {refreshMsg && (
                <span className={`text-xs ${refreshMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
                  {refreshMsg}
                </span>
              )}
            </div>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <List size={16} />
            </button>
          </div>
          </div>
        </div>

        {/* Content layout */}
        <div className="flex gap-6 items-start">
          <FilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            categories={categories}
            totalCount={totalCount}
          />

          <div className="flex-1 min-w-0">
            {/* Result count + loading */}
            <div className="flex items-center gap-3 mb-4 h-7">
              {isPending ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Chargement…
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-800">
                    {totalCount.toLocaleString("fr-MA")}
                  </span>{" "}
                  marché{totalCount !== 1 ? "s" : ""} trouvé{totalCount !== 1 ? "s" : ""}
                  {page > 0 && ` · Page ${page + 1} / ${totalPages}`}
                </p>
              )}
            </div>

            {/* Grid / List */}
            {marches.length === 0 && !isPending ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg font-medium text-slate-600">Aucun marché trouvé</p>
                <p className="text-sm mt-1">Essayez d'élargir vos critères de recherche</p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                    : "flex flex-col gap-3"
                }
              >
                {isPending
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-200 p-5 h-56 skeleton"
                      />
                    ))
                  : marches.map((m) => <MarketCard key={m.id} marche={m} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  Précédent
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 7) {
                      p = i;
                    } else if (page < 4) {
                      p = i;
                    } else if (page > totalPages - 5) {
                      p = totalPages - 7 + i;
                    } else {
                      p = page - 3 + i;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 text-sm rounded-xl transition-colors ${
                          p === page
                            ? "bg-indigo-600 text-white font-semibold"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        <p>
          Données issues de{" "}
          <a
            href="https://www.marchespublics.gov.ma"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-600 underline underline-offset-2"
          >
            marchespublics.gov.ma
          </a>{" "}
          · Mise à jour automatique toutes les 6h
        </p>
      </footer>
    </div>
  );
}

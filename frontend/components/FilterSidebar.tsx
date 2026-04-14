"use client";

import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FilterState, Category } from "@/lib/types";

interface Props {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  categories: Category[];
  totalCount: number;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-slate-100 pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-sm font-semibold text-slate-700 hover:text-slate-900"
      >
        {title}
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

export function FilterSidebar({ filters, onChange, categories, totalCount }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = [
    filters.type !== "all",
    filters.category !== "all",
    filters.statut !== "all",
    filters.budgetMin > 0,
    filters.budgetMax > 0,
    !!filters.dateFrom,
    !!filters.dateTo,
    !!filters.acheteur,
  ].filter(Boolean).length;

  const reset = () =>
    onChange({
      type: "all",
      category: "all",
      statut: "all",
      budgetMin: 0,
      budgetMax: 0,
      dateFrom: "",
      dateTo: "",
      acheteur: "",
    });

  const sidebar = (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-slate-500" />
          <span className="font-semibold text-slate-800 text-sm">Filtres</span>
          {activeCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{totalCount.toLocaleString("fr-MA")} résultats</span>
          {activeCount > 0 && (
            <button onClick={reset} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Type */}
      <Section title="Type de marché">
        {["all", "Services", "Travaux", "Fournitures"].map((t) => (
          <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="type"
              value={t}
              checked={filters.type === t}
              onChange={() => onChange({ type: t })}
              className="accent-indigo-600"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-800">
              {t === "all" ? "Tous les types" : t}
            </span>
          </label>
        ))}
      </Section>

      {/* Category */}
      <Section title="Catégorie">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="radio"
            name="category"
            value="all"
            checked={filters.category === "all"}
            onChange={() => onChange({ category: "all" })}
            className="accent-indigo-600"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-800">Toutes</span>
        </label>
        {categories.map((cat) => (
          <label key={cat.slug} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="category"
              value={cat.slug}
              checked={filters.category === cat.slug}
              onChange={() => onChange({ category: cat.slug })}
              className="accent-indigo-600"
            />
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-800 leading-tight">
              {cat.icon} {cat.name}
            </span>
          </label>
        ))}
      </Section>

      {/* Status */}
      <Section title="Statut">
        {[
          { value: "all", label: "Tous" },
          { value: "en_cours", label: "En cours" },
          { value: "archive", label: "Archivé" },
        ].map((s) => (
          <label key={s.value} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="statut"
              value={s.value}
              checked={filters.statut === s.value}
              onChange={() => onChange({ statut: s.value })}
              className="accent-indigo-600"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-800">{s.label}</span>
          </label>
        ))}
      </Section>

      {/* Acheteur */}
      <Section title="Acheteur public">
        <input
          type="text"
          placeholder="Ministère, commune…"
          value={filters.acheteur}
          onChange={(e) => onChange({ acheteur: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-colors"
        />
      </Section>

      {/* Budget range */}
      <Section title="Budget (MAD)">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Min</label>
            <input
              type="number"
              placeholder="0"
              value={filters.budgetMin || ""}
              onChange={(e) => onChange({ budgetMin: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Max</label>
            <input
              type="number"
              placeholder="∞"
              value={filters.budgetMax || ""}
              onChange={(e) => onChange({ budgetMax: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
        </div>
      </Section>

      {/* Date publication */}
      <Section title="Date de publication">
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Du</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onChange({ dateFrom: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Au</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onChange({ dateTo: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
        </div>
      </Section>

      {/* Sort */}
      <Section title="Trier par">
        <div className="space-y-2">
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as FilterState["sortBy"] })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 transition-colors"
          >
            <option value="date_publication">Date de publication</option>
            <option value="date_limite">Date limite</option>
            <option value="budget">Budget</option>
          </select>
          <div className="flex gap-2">
            {(["desc", "asc"] as const).map((d) => (
              <button
                key={d}
                onClick={() => onChange({ sortDir: d })}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                  filters.sortDir === d
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {d === "desc" ? "Plus récent" : "Plus ancien"}
              </button>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm"
        >
          <SlidersHorizontal size={15} />
          Filtres
          {activeCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </button>

        {mobileOpen && (
          <div className="mt-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-lg">
            <button
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs mb-4"
            >
              <X size={14} /> Fermer
            </button>
            {sidebar}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white rounded-2xl border border-slate-200 p-5 h-fit sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin">
        {sidebar}
      </aside>
    </>
  );
}

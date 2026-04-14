"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, MapPin, ExternalLink, Tag } from "lucide-react";
import type { Marche } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { DeadlineBadge } from "./DeadlineBadge";

interface Props {
  marche: Marche;
}

function formatBudget(amount?: number, text?: string): string | null {
  if (amount && amount > 0) {
    if (amount >= 1_000_000)
      return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, "")} M MAD`;
    if (amount >= 1_000)
      return `${(amount / 1_000).toFixed(0)} K MAD`;
    return `${amount.toLocaleString("fr-MA")} MAD`;
  }
  return text ?? null;
}

const PROCEDURE_COLORS: Record<string, string> = {
  AOO: "bg-blue-100 text-blue-700",
  CONCA: "bg-purple-100 text-purple-700",
  AMI: "bg-teal-100 text-teal-700",
  AO: "bg-indigo-100 text-indigo-700",
};

export function MarketCard({ marche }: Props) {
  const budget = formatBudget(marche.budget, marche.budget_text);
  const pubDate = marche.date_publication
    ? format(parseISO(marche.date_publication), "d MMM yyyy", { locale: fr })
    : null;

  const procColor = PROCEDURE_COLORS[marche.type_procedure?.toUpperCase() ?? ""] ?? "bg-slate-100 text-slate-600";

  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 card-lift group">
      {/* Top row: procedure type + status + date */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {marche.type_procedure && (
            <span className={`chip font-mono ${procColor}`}>
              {marche.type_procedure}
            </span>
          )}
          {marche.categorie && (
            <span className="chip bg-slate-100 text-slate-600">
              {marche.categorie}
            </span>
          )}
        </div>
        {pubDate && (
          <time className="text-xs text-slate-400 whitespace-nowrap shrink-0">
            {pubDate}
          </time>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-3 group-hover:text-indigo-700 transition-colors">
        {marche.objet || "Sans titre"}
      </h3>

      {/* Buyer + location */}
      <div className="flex flex-col gap-1.5">
        {marche.acheteur && (
          <div className="flex items-start gap-2">
            <Building2 size={13} className="text-slate-400 mt-0.5 shrink-0" />
            <span className="text-xs text-slate-600 line-clamp-2">{marche.acheteur}</span>
          </div>
        )}
        {marche.lieu_execution && (
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 truncate">{marche.lieu_execution}</span>
          </div>
        )}
      </div>

      {/* Categories */}
      {marche.categories?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {marche.categories.slice(0, 3).map((cat) => (
            <CategoryBadge key={cat.slug} category={cat} />
          ))}
          {marche.categories.length > 3 && (
            <span className="chip bg-slate-100 text-slate-500">
              +{marche.categories.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: budget + deadline + link */}
      <div className="mt-auto pt-3 border-t border-slate-100 flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          {budget && (
            <div className="budget-badge">
              <span>💰</span>
              <span>{budget}</span>
            </div>
          )}
          <DeadlineBadge dateLimit={marche.date_limite} />
        </div>

        <div className="flex items-center gap-2">
          {marche.reference && (
            <span className="text-xs text-slate-400 font-mono hidden sm:block truncate max-w-[120px]">
              {marche.reference}
            </span>
          )}
          <div className="flex gap-1.5">
            <Link
              href={`/marche/${marche.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Détails
            </Link>
            {marche.url && (
              <a
                href={marche.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                title="Voir sur marchespublics.gov.ma"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

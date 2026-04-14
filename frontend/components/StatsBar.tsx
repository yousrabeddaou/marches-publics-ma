"use client";

import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react";
import type { Stats } from "@/lib/types";

interface Props {
  stats: Stats | null;
}

function formatBudgetBig(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} Mrd MAD`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} M MAD`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K MAD`;
  return `${n.toLocaleString("fr-MA")} MAD`;
}

export function StatsBar({ stats }: Props) {
  const items = [
    {
      icon: <TrendingUp size={18} className="text-indigo-500" />,
      label: "Marchés actifs",
      value: stats?.actifs?.toLocaleString("fr-MA") ?? "—",
      sub: `sur ${stats?.total_marches?.toLocaleString("fr-MA") ?? "—"} au total`,
    },
    {
      icon: <Calendar size={18} className="text-amber-500" />,
      label: "Avec deadline active",
      value: stats?.avec_deadline_active?.toLocaleString("fr-MA") ?? "—",
      sub: "à ne pas rater",
    },
    {
      icon: <DollarSign size={18} className="text-emerald-500" />,
      label: "Budget total",
      value: stats ? formatBudgetBig(stats.budget_total) : "—",
      sub: `moy. ${stats ? formatBudgetBig(stats.budget_moyen) : "—"}`,
    },
    {
      icon: <Users size={18} className="text-pink-500" />,
      label: "Acheteurs publics",
      value: stats?.nb_acheteurs?.toLocaleString("fr-MA") ?? "—",
      sub: "entités distinctes",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-start gap-3"
        >
          <div className="mt-0.5 p-2 bg-slate-50 rounded-xl">{item.icon}</div>
          <div>
            <div className="font-bold text-xl text-slate-800">{item.value}</div>
            <div className="text-xs font-medium text-slate-600">{item.label}</div>
            <div className="text-xs text-slate-400">{item.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

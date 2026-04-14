"use client";

import { differenceInCalendarDays, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock } from "lucide-react";

interface Props {
  dateLimit?: string;
}

export function DeadlineBadge({ dateLimit }: Props) {
  if (!dateLimit) return null;

  const today = new Date();
  const deadline = parseISO(dateLimit);
  const days = differenceInCalendarDays(deadline, today);

  let bg: string;
  let text: string;
  let label: string;

  if (days < 0) {
    bg = "bg-slate-100 text-slate-500";
    text = "Expiré";
    label = `Expiré le ${format(deadline, "d MMM yyyy", { locale: fr })}`;
  } else if (days === 0) {
    bg = "bg-red-100 text-red-700";
    text = "Aujourd'hui !";
    label = "Date limite aujourd'hui";
  } else if (days <= 3) {
    bg = "bg-red-100 text-red-700";
    text = `${days}j restant${days > 1 ? "s" : ""}`;
    label = format(deadline, "d MMM yyyy", { locale: fr });
  } else if (days <= 7) {
    bg = "bg-amber-100 text-amber-700";
    text = `${days}j restants`;
    label = format(deadline, "d MMM yyyy", { locale: fr });
  } else {
    bg = "bg-emerald-100 text-emerald-700";
    text = `${days}j restants`;
    label = format(deadline, "d MMM yyyy", { locale: fr });
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${bg}`} title={label}>
      <Clock size={12} />
      <span>{text}</span>
      <span className="opacity-60">· {format(deadline, "d MMM", { locale: fr })}</span>
    </div>
  );
}

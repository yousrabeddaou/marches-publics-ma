import { notFound } from "next/navigation";
import Link from "next/link";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  MapPin,
  Tag,
} from "lucide-react";
import { fetchMarche } from "@/lib/supabase";
import { CategoryBadge } from "@/components/CategoryBadge";

interface Props {
  params: { id: string };
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="mt-0.5 text-slate-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">
          {label}
        </dt>
        <dd className="text-sm text-slate-800 break-words">{value}</dd>
      </div>
    </div>
  );
}

export default async function MarchePage({ params }: Props) {
  const marche = await fetchMarche(params.id);
  if (!marche) notFound();

  const today = new Date();
  const deadlineDate = marche.date_limite ? parseISO(marche.date_limite) : null;
  const daysLeft = deadlineDate ? differenceInCalendarDays(deadlineDate, today) : null;

  const deadlineColor =
    daysLeft === null
      ? "text-slate-500 bg-slate-100"
      : daysLeft < 0
      ? "text-slate-500 bg-slate-100"
      : daysLeft <= 3
      ? "text-red-700 bg-red-100"
      : daysLeft <= 7
      ? "text-amber-700 bg-amber-100"
      : "text-emerald-700 bg-emerald-100";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>
          <div className="w-px h-5 bg-slate-200" />
          <span className="text-sm font-medium text-slate-700 truncate">
            {marche.reference ?? "Détail du marché"}
          </span>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {marche.type_procedure && (
                  <span className="chip bg-indigo-100 text-indigo-700 font-mono">
                    {marche.type_procedure}
                  </span>
                )}
                {marche.categorie && (
                  <span className="chip bg-slate-100 text-slate-600">
                    {marche.categorie}
                  </span>
                )}
                <span
                  className={`chip ${
                    marche.statut === "en_cours"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {marche.statut === "en_cours" ? "En cours" : "Archivé"}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 leading-snug">
                {marche.objet ?? "Sans titre"}
              </h1>
              {marche.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {marche.categories.map((cat) => (
                    <CategoryBadge key={cat.slug} category={cat} size="md" />
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                Informations détaillées
              </h2>
              <dl>
                <InfoRow icon={<Tag size={16} />} label="Référence" value={marche.reference} />
                <InfoRow icon={<Building2 size={16} />} label="Acheteur public" value={marche.acheteur} />
                <InfoRow icon={<MapPin size={16} />} label="Lieu d'exécution" value={marche.lieu_execution} />
                <InfoRow icon={<FileText size={16} />} label="Programme / Contexte" value={marche.programme} />
                <InfoRow icon={<Tag size={16} />} label="Lots" value={marche.lots} />
                <InfoRow icon={<Tag size={16} />} label="Domaine d'activité" value={marche.domaine} />
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Budget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-emerald-600 mb-3">
                <DollarSign size={18} />
                <span className="font-semibold text-sm">Budget</span>
              </div>
              {marche.budget ? (
                <p className="text-2xl font-bold text-slate-800">
                  {marche.budget.toLocaleString("fr-MA")}
                  <span className="text-base font-normal text-slate-500 ml-1">MAD</span>
                </p>
              ) : marche.budget_text ? (
                <p className="text-lg font-semibold text-slate-700">{marche.budget_text}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">Non précisé</p>
              )}
            </div>

            {/* Dates */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Calendar size={18} />
                <span className="font-semibold text-sm">Dates clés</span>
              </div>

              {marche.date_publication && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Publication</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {format(parseISO(marche.date_publication), "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              )}

              {deadlineDate && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Date limite de dépôt</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {format(deadlineDate, "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                  {daysLeft !== null && (
                    <div
                      className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${deadlineColor}`}
                    >
                      <Clock size={14} />
                      {daysLeft < 0
                        ? "Expiré"
                        : daysLeft === 0
                        ? "Aujourd'hui !"
                        : `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Source link */}
            {marche.url && (
              <a
                href={marche.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
              >
                <ExternalLink size={16} />
                Voir sur marchespublics.gov.ma
              </a>
            )}

            {/* Scraped at */}
            <p className="text-xs text-slate-400 text-center">
              Données collectées le{" "}
              {format(parseISO(marche.scraped_at), "d MMM yyyy à HH:mm", { locale: fr })}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

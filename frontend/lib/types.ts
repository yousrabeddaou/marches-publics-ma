export interface Category {
  id: string;
  slug: string;
  name: string;
  color: string;
  icon?: string;
  keywords: string[];
  is_custom: boolean;
}

export interface Marche {
  id: string;
  reference?: string;
  objet?: string;
  acheteur?: string;
  type_procedure?: string;
  categorie?: string;         // Services | Travaux | Fournitures
  domaine?: string;
  programme?: string;
  lots?: string;
  lieu_execution?: string;
  budget?: number;
  budget_text?: string;
  date_publication?: string;  // ISO date
  date_limite?: string;       // ISO date
  statut: "en_cours" | "archive" | "attribue";
  url?: string;
  scraped_at: string;
  categories: CategoryRef[];  // from the view
}

export interface CategoryRef {
  slug: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Stats {
  total_marches: number;
  actifs: number;
  avec_deadline_active: number;
  budget_total: number;
  budget_moyen: number;
  nb_acheteurs: number;
}

export interface FilterState {
  search: string;
  type: string;        // Services | Travaux | Fournitures | all
  category: string;    // category slug | all
  statut: string;      // en_cours | archive | all
  budgetMin: number;
  budgetMax: number;
  dateFrom: string;
  dateTo: string;
  acheteur: string;
  sortBy: "date_publication" | "date_limite" | "budget";
  sortDir: "asc" | "desc";
}

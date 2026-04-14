"""
Keyword-based auto-categorization for Moroccan public tenders.
Each category has a list of keywords matched against the tender's title (objet).
"""

from typing import List, Dict

CATEGORIES: List[Dict] = [
    {
        "slug": "communication",
        "name": "Communication & Relations Publiques",
        "color": "#7C3AED",
        "icon": "📢",
        "keywords": [
            "communication", "publicité", "publicite", "relations publiques",
            "relation presse", "relations presse", "agence de communication",
            "campagne de communication", "médias", "medias", "presse", "rp ",
            " rp,", "relations médias", "attaché de presse", "community manager",
            "e-réputation", "e-reputation", "image de marque", "branding",
            "notoriété", "notoriete", "veille médiatique", "revue de presse",
            "événementiel", "evenementiel", "organisation d'événement",
            "conférence de presse",
        ],
    },
    {
        "slug": "creation-contenu",
        "name": "Création de Contenu & Digital",
        "color": "#EC4899",
        "icon": "✍️",
        "keywords": [
            "contenu", "rédaction", "redaction", "création de contenu",
            "copywriting", "réseaux sociaux", "social media", "médias sociaux",
            "design graphique", "graphisme", "infographie", "illustration",
            "vidéo", "video", "audiovisuel", "production audiovisuelle",
            "photographie", "reportage photo", "podcast", "web série",
            "motion design", "animation", "newsletter", "blog", "editorial",
            "storytelling", "traduction", "rédactionnel",
        ],
    },
    {
        "slug": "informatique",
        "name": "Informatique & Transformation Digitale",
        "color": "#3B82F6",
        "icon": "💻",
        "keywords": [
            "informatique", "logiciel", "système d'information", "si ",
            "développement", "developpement", "application", "appli ",
            "site web", "plateforme", "portail", "digital", "numérique",
            "numerique", "cybersécurité", "cybersecurite", "cloud",
            "intelligence artificielle", "ia ", " ia,", "machine learning",
            "data", "big data", "erp", "crm", "infrastructure réseau",
            "télécommunication", "telecommunication", "fibre optique",
            "réseau informatique", "serveur", "datacenter", "saas",
            "blockchain", "iot", "objets connectés", "maintenance informatique",
            "infogérance", "infogerance",
        ],
    },
    {
        "slug": "etudes-conseil",
        "name": "Études, Conseil & Formation",
        "color": "#10B981",
        "icon": "📊",
        "keywords": [
            "étude", "etude", "conseil", "audit", "expertise", "évaluation",
            "evaluation", "diagnostic", "consulting", "formation", "séminaire",
            "seminaire", "atelier", "coaching", "accompagnement",
            "assistance à maîtrise d'ouvrage", "amo", "assistance technique",
            "mission d'assistance", "renforcement des capacités",
            "stratégie", "strategie", "plan stratégique", "enquête", "enquete",
            "sondage", "recherche", "analyse", "benchmark",
        ],
    },
    {
        "slug": "travaux",
        "name": "Travaux & Construction",
        "color": "#F59E0B",
        "icon": "🏗️",
        "keywords": [
            "travaux", "construction", "réhabilitation", "rehabilitation",
            "bâtiment", "batiment", "voirie", "génie civil", "infrastructure",
            "aménagement", "amenagement", "rénovation", "renovation",
            "extension", "démolition", "demolition", "terrassement",
            "étanchéité", "etancheite", "ravalement", "peinture bâtiment",
            "plomberie", "électricité bâtiment", "menuiserie", "carrelage",
            "revêtement", "revetement", "isolation", "climatisation",
        ],
    },
    {
        "slug": "fournitures",
        "name": "Fournitures & Équipements",
        "color": "#EF4444",
        "icon": "📦",
        "keywords": [
            "fourniture", "équipement", "equipement", "matériel", "materiel",
            "mobilier", "véhicule", "vehicule", "automobile", "flotte",
            "achat", "approvisionnement", "consommable", "bureau",
            "imprimante", "ordinateur", "serveur", "téléphone", "telephone",
            "cartouche", "papeterie", "outillage", "machine", "instrument",
            "uniforme", "vêtement", "vetement", "protection individuelle",
            "epi ", "équipement sportif",
        ],
    },
    {
        "slug": "sante",
        "name": "Santé & Médical",
        "color": "#06B6D4",
        "icon": "🏥",
        "keywords": [
            "médical", "medical", "santé", "sante", "médicament", "medicament",
            "équipement médical", "dispositif médical", "hôpital", "hopital",
            "clinique", "laboratoire", "pharmacie", "vaccin", "chirurgie",
            "réactif", "reactif", "consommable médical", "ambulance",
            "soin", "stérilisation", "sterilisation",
        ],
    },
    {
        "slug": "services-generaux",
        "name": "Services Généraux",
        "color": "#6B7280",
        "icon": "🔧",
        "keywords": [
            "gardiennage", "sécurité", "securite", "nettoyage", "propreté",
            "proprete", "entretien", "restauration collective", "traiteur",
            "transport", "maintenance", "reprographie", "impression",
            "hébergement", "hebergement", "hôtellerie", "location",
            "jardinage", "espaces verts", "déménagement", "demenagement",
        ],
    },
    {
        "slug": "environnement",
        "name": "Environnement & Énergie",
        "color": "#22C55E",
        "icon": "🌱",
        "keywords": [
            "environnement", "énergie", "energie", "solaire", "photovoltaïque",
            "photovoltaique", "eau", "assainissement", "déchets", "dechets",
            "recyclage", "développement durable", "developpement durable",
            "efficacité énergétique", "efficacite energetique", "traitement eau",
            "gestion eau", "réseau eau", "hydraulique", "irrigation",
        ],
    },
    {
        "slug": "agriculture",
        "name": "Agriculture & Agroalimentaire",
        "color": "#84CC16",
        "icon": "🌾",
        "keywords": [
            "agriculture", "agricole", "agroalimentaire", "semence",
            "engrais", "pesticide", "irrigation agricole", "élevage",
            "pêche", "peche", "forêt", "foret", "reboisement",
            "alimentation", "agroéquipement",
        ],
    },
]


def categorize_marche(marche: dict) -> List[str]:
    """
    Returns list of category slugs that match the tender based on keywords
    found in the objet (title) field.
    """
    text = " ".join([
        (marche.get("objet") or ""),
        (marche.get("domaine") or ""),
        (marche.get("type_procedure") or ""),
    ]).lower()

    matched = []
    for cat in CATEGORIES:
        for kw in cat["keywords"]:
            if kw.lower() in text:
                matched.append(cat["slug"])
                break  # Only add each category once

    return matched


def get_category_by_slug(slug: str) -> Dict | None:
    return next((c for c in CATEGORIES if c["slug"] == slug), None)

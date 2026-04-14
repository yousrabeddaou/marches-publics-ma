#!/bin/bash
cd "$(dirname "$0")/scraper"
source venv/bin/activate
echo "▶ Scraping des marchés publics (7 derniers jours)..."
python3 scraper.py --days-back 7
echo ""
echo "✓ Terminé ! Rafraîchissez http://localhost:3000"
read -p "Appuyez sur Entrée pour fermer..."

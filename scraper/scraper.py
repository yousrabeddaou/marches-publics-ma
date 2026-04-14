"""
Scraper for marchespublics.gov.ma using Playwright (handles PRADO JS framework).
Saves tenders to Supabase.

Usage:
    python scraper.py                  # Scrape last 7 days
    python scraper.py --days-back 30   # Scrape last 30 days
    python scraper.py --full           # Scrape ALL records (slow!)
    python scraper.py --page-limit 10  # Scrape max 10 pages
"""

import argparse
import asyncio
import json
import os
import re
import sys
from datetime import datetime, date, timedelta
from typing import Optional
from dotenv import load_dotenv

# Load .env file automatically
load_dotenv()

from bs4 import BeautifulSoup, Tag
from playwright.async_api import async_playwright, Page, Browser
from supabase import create_client, Client

from categories import categorize_marche

# ─────────────────────────── Config ───────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

BASE_URL = "https://www.marchespublics.gov.ma"
SEARCH_URL = (
    f"{BASE_URL}/index.php"
    f"?page=entreprise.EntrepriseAdvancedSearch&searchAnnCons&AllCons"
)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# ─────────────────────────── Helpers ──────────────────────────────────────────

def clean(text: Optional[str]) -> Optional[str]:
    if text is None:
        return None
    return re.sub(r"\s+", " ", text).strip() or None


def parse_date_fr(text: Optional[str]) -> Optional[str]:
    """
    Parses French-format dates like '15/04/2025' or '15-04-2025'.
    Returns ISO format 'YYYY-MM-DD' or None.
    """
    if not text:
        return None
    text = clean(text) or ""
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def parse_budget(text: Optional[str]) -> Optional[float]:
    """
    Parses budget strings like '1 234 567,00 DH' or '1,234,567.00 MAD'.
    Returns float or None.
    """
    if not text:
        return None
    # Remove currency labels
    text = re.sub(r"[A-Za-z\s]", "", text)
    # Normalize: remove spaces used as thousands separator
    text = text.replace(" ", "").replace("\u00a0", "")
    # Handle French decimal comma
    if "," in text and "." not in text:
        text = text.replace(",", ".")
    elif "," in text and "." in text:
        # e.g. 1,234,567.00 → remove commas
        text = text.replace(",", "")
    try:
        return float(text)
    except ValueError:
        return None


# ─────────────────────────── Parsing ──────────────────────────────────────────

def extract_rows(soup: BeautifulSoup) -> list[Tag]:
    """Find all tender rows in the results table."""
    # PRADO TDataGrid usually renders as <table> with class or id containing 'DataGrid'
    # Try multiple selectors in order of specificity
    selectors = [
        "table.datagrid tbody tr",
        "table#ctl0_Content_AnnonsSearchResult tbody tr",
        "table[id*='DataGrid'] tbody tr",
        "table[id*='Grid'] tbody tr",
        "table[id*='Result'] tbody tr",
        ".datagrid-item",
        ".datagrid-alternating-item",
        "tr.DataGridItem",
        "tr.DataGridAlternatingItem",
    ]
    for sel in selectors:
        rows = soup.select(sel)
        if rows:
            return [r for r in rows if r.find("td")]  # skip empty rows
    # Fallback: grab all <tr> with ≥ 4 <td>s from any table
    all_rows = []
    for table in soup.find_all("table"):
        for row in table.find_all("tr"):
            cells = row.find_all("td")
            if len(cells) >= 4:
                all_rows.append(row)
    return all_rows


def parse_row(row: Tag, detail_url: Optional[str] = None) -> Optional[dict]:
    """Extract fields from a table row."""
    cells = row.find_all("td")
    if len(cells) < 4:
        return None

    # Try to find the detail page link
    link = row.find("a", href=True)
    url = None
    if link:
        href = link["href"]
        if href.startswith("http"):
            url = href
        elif href.startswith("/"):
            url = BASE_URL + href
        elif href.startswith("index.php"):
            url = BASE_URL + "/" + href

    # Extract text from each cell
    texts = [clean(c.get_text(" ", strip=True)) for c in cells]

    # The PRADO grid column order (from our research):
    # 0: Type de procédure (AOO, CONCA, etc.)
    # 1: Catégorie (Services, Travaux, Fournitures)
    # 2: Date de publication
    # 3: Numéro de référence
    # 4: Contexte/Programme
    # 5: Objet (description)
    # 6: Entité acheteur
    # 7: Lots
    # 8: Lieu d'exécution
    # 9: Clauses sociales/environnementales
    # 10: Délai de soumission
    # 11: Détails (link)

    # We map by position but also try label-based matching
    def cell(idx: int) -> Optional[str]:
        return texts[idx] if idx < len(texts) else None

    marche = {
        "type_procedure": cell(0),
        "categorie": cell(1),
        "date_publication": parse_date_fr(cell(2)),
        "reference": cell(3),
        "programme": cell(4),
        "objet": cell(5),
        "acheteur": cell(6),
        "lots": cell(7),
        "lieu_execution": cell(8),
        "date_limite": parse_date_fr(cell(10)),
        "url": url or detail_url,
        "budget": None,
        "budget_text": None,
        "statut": "en_cours",
        "domaine": None,
        "scraped_at": datetime.utcnow().isoformat(),
    }

    # Filter out header rows
    if marche["reference"] and any(
        kw in (marche["reference"] or "").lower()
        for kw in ["référence", "reference", "numéro", "numero"]
    ):
        return None

    return marche


# ─────────────────────────── Detail Page ──────────────────────────────────────

async def scrape_detail(page: Page, url: str) -> dict:
    """Visit the detail page and extract extra fields (budget, etc.)."""
    try:
        await page.goto(url, wait_until="networkidle", timeout=15000)
        content = await page.content()
        soup = BeautifulSoup(content, "html.parser")

        result = {}

        # Look for budget / montant
        for label_text in ["montant", "budget", "valeur", "coût", "cout"]:
            label = soup.find(string=re.compile(label_text, re.IGNORECASE))
            if label:
                parent = label.find_parent()
                if parent:
                    sibling = parent.find_next_sibling()
                    if sibling:
                        raw_budget = clean(sibling.get_text())
                        result["budget_text"] = raw_budget
                        result["budget"] = parse_budget(raw_budget)
                        break

        # Look for domaine / secteur
        for label_text in ["domaine", "secteur", "activité", "activite"]:
            label = soup.find(string=re.compile(label_text, re.IGNORECASE))
            if label:
                parent = label.find_parent()
                if parent:
                    sibling = parent.find_next_sibling()
                    if sibling:
                        result["domaine"] = clean(sibling.get_text())
                        break

        return result
    except Exception as e:
        print(f"  [warn] detail page failed: {url}: {e}")
        return {}


# ─────────────────────────── Supabase ─────────────────────────────────────────

def upsert_marche(supabase: Client, marche: dict, category_slugs: list[str]):
    """Upsert a marche and its categories into Supabase."""
    if not marche.get("reference"):
        return

    try:
        # Upsert into marches table
        result = (
            supabase.table("marches")
            .upsert(
                {k: v for k, v in marche.items() if k != "categories"},
                on_conflict="reference",
            )
            .execute()
        )
        marche_id = result.data[0]["id"] if result.data else None
        if not marche_id:
            return

        # Clear existing categories for this marche
        supabase.table("marche_categories").delete().eq("marche_id", marche_id).execute()

        # Fetch category IDs
        if category_slugs:
            cats = (
                supabase.table("categories")
                .select("id, slug")
                .in_("slug", category_slugs)
                .execute()
            )
            for cat in cats.data:
                supabase.table("marche_categories").insert(
                    {"marche_id": marche_id, "category_id": cat["id"]}
                ).execute()

    except Exception as e:
        print(f"  [error] supabase upsert failed: {e}")


# ─────────────────────────── Main Scraper ─────────────────────────────────────

async def go_to_next_page(page: Page) -> bool:
    """
    Clicks the 'next page' button in the PRADO pagination.
    Returns True if navigation succeeded, False if no next page.
    """
    # Try multiple selectors for PRADO pagination next button
    selectors = [
        "a[title*='suivant']",
        "a[title*='Suivant']",
        "a[title*='next']",
        "a[title*='Next']",
        "input[value='suivant']",
        "input[value='>']",
        "span.pager a:last-child",
        ".pagination a:last-child",
        "a:has-text('Suivant')",
        "a:has-text('>')",
        "a:has-text('»')",
        "[id*='Next']",
        "[id*='next']",
    ]
    for sel in selectors:
        try:
            btn = await page.query_selector(sel)
            if btn:
                is_disabled = await btn.get_attribute("disabled")
                css_class = await btn.get_attribute("class") or ""
                if is_disabled or "disabled" in css_class:
                    return False
                await btn.click()
                await page.wait_for_load_state("networkidle", timeout=15000)
                return True
        except Exception:
            continue
    return False


async def set_page_size(page: Page, size: int = 100):
    """Set the number of results per page."""
    selectors = [
        "select[id*='PageSize']",
        "select[id*='ItemsPerPage']",
        "select[id*='PerPage']",
        "select[name*='pagesize']",
    ]
    for sel in selectors:
        try:
            el = await page.query_selector(sel)
            if el:
                await page.select_option(sel, str(size))
                await page.wait_for_load_state("networkidle", timeout=10000)
                print(f"  Set page size to {size}")
                return
        except Exception:
            continue


async def scrape(
    days_back: int = 7,
    full: bool = False,
    page_limit: Optional[int] = None,
    dry_run: bool = False,
):
    cutoff_date = None
    if not full:
        cutoff_date = (date.today() - timedelta(days=days_back)).isoformat()
        print(f"Scraping tenders published after {cutoff_date}")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if not dry_run else None

    async with async_playwright() as pw:
        browser: Browser = await pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"],
        )
        context = await browser.new_context(extra_http_headers=HEADERS)
        page = await context.new_page()
        detail_page = await context.new_page()

        print(f"Navigating to {SEARCH_URL}")
        await page.goto(SEARCH_URL, wait_until="networkidle", timeout=30000)

        # Try to set 100 results per page
        await set_page_size(page, 100)

        page_num = 1
        total_scraped = 0
        stop_early = False

        while not stop_early:
            if page_limit and page_num > page_limit:
                print(f"Reached page limit ({page_limit})")
                break

            print(f"\n── Page {page_num} ────────────────────────────")
            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")

            rows = extract_rows(soup)
            if not rows:
                print("No rows found. Dumping page title for debug:")
                title_el = soup.find("title")
                print(f"  Page title: {title_el.get_text() if title_el else 'N/A'}")
                break

            print(f"  Found {len(rows)} rows")

            for row in rows:
                marche = parse_row(row)
                if not marche:
                    continue

                # Stop if we've gone past the cutoff date
                pub_date = marche.get("date_publication")
                if cutoff_date and pub_date and pub_date < cutoff_date:
                    print(f"  Reached cutoff date ({pub_date} < {cutoff_date}), stopping")
                    stop_early = True
                    break

                # Optionally fetch detail page for budget
                if marche.get("url"):
                    detail_data = await scrape_detail(detail_page, marche["url"])
                    marche.update(detail_data)

                # Auto-categorize
                category_slugs = categorize_marche(marche)
                marche["categories_matched"] = category_slugs

                total_scraped += 1

                if dry_run:
                    print(json.dumps(
                        {k: v for k, v in marche.items() if k not in ("scraped_at",)},
                        ensure_ascii=False,
                        indent=2,
                    ))
                else:
                    upsert_marche(supabase, marche, category_slugs)

                if total_scraped % 50 == 0:
                    print(f"  Progress: {total_scraped} tenders scraped")

            if stop_early:
                break

            # Navigate to next page
            has_next = await go_to_next_page(page)
            if not has_next:
                print("No next page found, done.")
                break

            page_num += 1

        await browser.close()

    print(f"\n✓ Done! Total scraped: {total_scraped}")
    return total_scraped


# ─────────────────────────── Entry Point ──────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape marchespublics.gov.ma")
    parser.add_argument("--days-back", type=int, default=7, help="Days to look back (default: 7)")
    parser.add_argument("--full", action="store_true", help="Scrape ALL records (very slow)")
    parser.add_argument("--page-limit", type=int, default=None, help="Max pages to scrape")
    parser.add_argument("--dry-run", action="store_true", help="Print to stdout, don't save to DB")
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        if not args.dry_run:
            print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars")
            sys.exit(1)

    asyncio.run(scrape(
        days_back=args.days_back,
        full=args.full,
        page_limit=args.page_limit,
        dry_run=args.dry_run,
    ))

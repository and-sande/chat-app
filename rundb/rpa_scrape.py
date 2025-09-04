#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse, json, os, re, time, urllib.parse
from datetime import datetime
from typing import Any, Dict, List, Optional

from playwright.sync_api import sync_playwright

NOR_MONTHS = {
    "januar": 1, "februar": 2, "mars": 3, "april": 4, "mai": 5, "juni": 6,
    "juli": 7, "august": 8, "september": 9, "oktober": 10, "november": 11, "desember": 12
}
ENG_MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12
}

def norm_space(s: Optional[str]) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())

def parse_date_from_text(txt: Optional[str]) -> Optional[str]:
    if not txt: return None
    t = txt.lower()
    m = re.search(r"(\d{1,2})\s*\.?\s*([a-zæøå]+)\s*(\d{4})", t)
    if not m: return None
    day, mon, year = int(m.group(1)), m.group(2), int(m.group(3))
    month = NOR_MONTHS.get(mon) or ENG_MONTHS.get(mon)
    if not month: return None
    try:
        return datetime(year, month, day).strftime("%Y-%m-%d")
    except ValueError:
        return None

# ---------------- images (official site only) ----------------
def is_likely_logo(url: str) -> bool:
    u = url.lower()
    return any(x in u for x in ["logo", "favicon", "icon", ".svg"])

def ext_from_content_type(ct: Optional[str]) -> str:
    if not ct: return ".bin"
    ct = ct.lower()
    if "png"  in ct: return ".png"
    if "jpeg" in ct or "jpg" in ct: return ".jpg"
    if "webp" in ct: return ".webp"
    if "gif"  in ct: return ".gif"
    return ".bin"

def ensure_dir(p: Optional[str]) -> None:
    if p and not os.path.isdir(p):
        os.makedirs(p, exist_ok=True)

def download_image(ctx, url: str, target_noext: str, min_bytes: int = 20000) -> Optional[str]:
    try:
        if not url or is_likely_logo(url): return None
        resp = ctx.request.get(url, timeout=20000)
        if not resp.ok: return None
        clen = int(resp.headers.get("content-length") or "0")
        if clen and clen < min_bytes: return None
        ext = ext_from_content_type(resp.headers.get("content-type"))
        path = target_noext + ext
        with open(path, "wb") as f:
            f.write(resp.body())
        if os.path.getsize(path) < min_bytes:
            os.remove(path)
            return None
        return path
    except Exception:
        return None

def find_official_image_url(page) -> Optional[str]:
    # Prefer og:image; fallback to first non-logo <img>
    og = page.locator("meta[property='og:image']").first
    if og.count():
        v = og.get_attribute("content")
        if v and not is_likely_logo(v):
            return v
    imgs = page.locator("img")
    n = min(imgs.count(), 12)
    for i in range(n):
        try:
            src = imgs.nth(i).get_attribute("src")
            if src and not is_likely_logo(src):
                return src
        except Exception:
            continue
    return None

# ---------------- distances ----------------
DISTANCE_LABEL_PATTERNS = [
    # (regex pattern, normalized label, approx_km)
    (r"\bhalf[-\s]?marathon\b", "Half-marathon", 21.0975),
    (r"\bhalvmaraton\b",        "Halvmaraton",    21.0975),

    # Full marathon, EXCLUDING 'half-' / 'half ' / 'halv' prefixes with fixed-width lookbehind
    (r"(?<!half-)(?<!half )(?<!halv)marathon\b", "Marathon", 42.195),
    (r"(?<!half-)(?<!half )(?<!halv)maraton\b",  "Maraton",  42.195),

    # Generic textual buckets (no fixed km)
    (r"\bultra\b", "Ultra", None),
]

def parse_distance_tokens(text: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []

    # 1) numeric like '5.8 km'
    for m in re.finditer(r"\b(\d+(?:[.,]\d+)?)\s*km\b", text, flags=re.I):
        out.append({"distance_km": float(m.group(1).replace(",", "."))})

    # 2) '5k', '10k'
    for m in re.finditer(r"\b(\d{1,2})\s*k\b", text, flags=re.I):
        out.append({"distance_km": float(m.group(1))})

    # 3) textual labels (longer/specific patterns first)
    for pat, label, approx in DISTANCE_LABEL_PATTERNS:
        for m in re.finditer(pat, text, flags=re.I):
            pretty = m.group(0)  # preserve page casing if it differs
            item: Dict[str, Any] = {"label": pretty if pretty.lower() != label.lower() else label}
            if approx is not None:
                item["approx_km"] = approx
            out.append(item)

    # de-dupe
    seen, ded = set(), []
    for d in out:
        sig = f"km:{d['distance_km']:.3f}" if "distance_km" in d else f"label:{d['label'].lower()}"
        if sig not in seen:
            ded.append(d); seen.add(sig)
    return ded

# ---------------- key/value extraction ----------------
LABELS = {
    "organizer": ("Arrangør", "Arrangoer"),
    "series":    ("Løpsserie", "Lopsserie"),
    "country":   ("Land",),
    "type":      ("Type",),
    "dist":      ("Distanser",),
}

def query_value_after_label(page, label_texts: List[str]) -> Optional[str]:
    """Try multiple DOM shapes near 'Label:' to get its value."""
    for lbl in label_texts:
        # 1) <dt>Label</dt><dd>Value</dd>
        try:
            dd = page.locator(f"xpath=//dt[normalize-space()='{lbl}']/following-sibling::dd[1]").first
            if dd.count(): 
                v = norm_space(dd.text_content() or "")
                if v: return v
        except Exception:
            pass
        # 2) element with 'Label:' then sibling
        try:
            sib = page.locator(
                f"xpath=//*[normalize-space()='{lbl}:']/following-sibling::*[1]"
            ).first
            if sib.count():
                v = norm_space(sib.text_content() or "")
                if v: return v
        except Exception:
            pass
        # 3) same container, split on colon
        try:
            node = page.locator(
                f"xpath=//*[contains(normalize-space(.), '{lbl}:')]"
            ).first
            if node.count():
                txt = norm_space(node.text_content() or "")
                # Extract after 'Label:'
                m = re.search(rf"{re.escape(lbl)}\s*:\s*(.+)$", txt, flags=re.I)
                if m:
                    return norm_space(m.group(1))
        except Exception:
            pass
    return None

def regex_fallback(body_text: str, key_variants: List[str]) -> Optional[str]:
    for k in key_variants:
        m = re.search(rf"{re.escape(k)}\s*:\s*(.+)", body_text, flags=re.I)
        if m:
            # stop at line break or another key-like token
            val = m.group(1).splitlines()[0]
            return norm_space(val)
    return None

# ---------------- main scrape ----------------
def scrape_event(url: str, media_dir: Optional[str], headless: bool = True) -> Dict[str, Any]:
    slug = urllib.parse.urlparse(url).path.rstrip("/").split("/")[-1]
    ensure_dir(media_dir)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=headless)
        ctx = pw.chromium.launch_persistent_context("", headless=headless, locale="nb-NO")
        page = ctx.new_page()

        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(800)  # let hydration finish

        # Title & date
        title = None
        try:
            title = norm_space(page.get_by_role("heading", level=1).first.text_content() or "")
        except Exception:
            pass
        date_line = None
        try:
            date_line = norm_space(page.get_by_role("heading", level=2).first.text_content() or "")
        except Exception:
            pass
        date_iso = parse_date_from_text(date_line)
        date_confirmed = bool(re.search(r"bekreftet", date_line or "", flags=re.I))

        # Whole body text for robust fallbacks
        body_text = page.text_content("body") or ""

        # Try DOM selectors first
        organizer  = query_value_after_label(page, list(LABELS["organizer"]))
        series     = query_value_after_label(page, list(LABELS["series"]))
        country    = query_value_after_label(page, list(LABELS["country"]))
        race_type  = query_value_after_label(page, list(LABELS["type"]))
        dist_text  = query_value_after_label(page, list(LABELS["dist"]))

        # Fallback to regex over the whole page text if any are missing
        if not organizer:
            organizer = regex_fallback(body_text, list(LABELS["organizer"]))
        if not series:
            series = regex_fallback(body_text, list(LABELS["series"]))
        if not country:
            country = regex_fallback(body_text, list(LABELS["country"]))
        if not race_type:
            race_type = regex_fallback(body_text, list(LABELS["type"]))
        if not dist_text:
            dist_text = regex_fallback(body_text, list(LABELS["dist"]))

        # Distances (labels and numeric) — combine KV + dedicated section + whole body
        distances: List[Dict[str, Any]] = []
        if dist_text:
            distances += parse_distance_tokens(dist_text)
        # Also scan a likely "Løpsdistanser" section
        msec = re.search(r"(L[øo]psdistanser.*)", body_text, flags=re.I | re.S)
        if msec:
            distances += parse_distance_tokens(msec.group(1))
        distances += parse_distance_tokens(body_text)
        # de-dupe
        seen, ded = set(), []
        for d in distances:
            sig = f"km:{d['distance_km']:.3f}" if "distance_km" in d else f"label:{d['label'].lower()}"
            if sig not in seen:
                ded.append(d); seen.add(sig)
        distances = ded

        # Location hint
        location_text = None
        for line in (body_text or "").splitlines():
            if "Norway" in line or "Norge" in line:
                location_text = norm_space(line); break

        # If country still missing, infer from location_text
        if not country and location_text:
            if re.search(r"\bNorway\b|\bNorge\b", location_text, flags=re.I):
                country = "Norge"

        # Links
        def link_by_text(*names) -> Optional[str]:
            for name in names:
                try:
                    loc = page.get_by_role("link", name=re.compile(name, re.I))
                    if loc.count():
                        href = loc.first.get_attribute("href")
                        if href: return href
                except Exception:
                    continue
            return None

        results_url      = link_by_text(r"^Deltakere$", r"Resultat", r"Live")
        registration_url = link_by_text(r"^Påmelding$")
        official_site    = link_by_text(r"^Nettside$")
        organizer_site   = link_by_text(r"Arrangørnettside")

        # Official image only (no Racedays image)
        official_image_url = None
        official_image_path = None
        if official_site:
            try:
                page.goto(official_site, wait_until="domcontentloaded", timeout=20000)
                time.sleep(0.5)
                official_image_url = find_official_image_url(page)
                if media_dir and official_image_url:
                    official_image_path = download_image(
                        ctx, urllib.parse.urljoin(official_site, official_image_url),
                        os.path.join(media_dir, f"{slug}_official"), min_bytes=20000
                    )
            except Exception:
                pass

        ctx.close()
        browser.close()

    return {
        "source": "racedays",
        "source_url": url,
        "slug": slug,
        "scraped_at": datetime.utcnow().isoformat() + "Z",
        "title": title,
        "date_text": date_line,
        "date_iso": date_iso,
        "date_confirmed": date_confirmed,
        "country": country or None,
        "location_text": location_text,
        "organizer": organizer or None,
        "series": series or None,
        "race_type": race_type or None,
        "distances": distances,
        "images": {
            "official_image_url": official_image_url,
            "official_image_path": official_image_path,
        },
        "links": {
            "results": results_url,
            "registration": registration_url,
            "official_site": official_site,
            "organizer_site": organizer_site,
        },
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url", help="Racedays event URL (https://www.racedays.run/event/...)")
    ap.add_argument("--out", help="Write JSON to file (default: stdout)")
    ap.add_argument("--media-dir", help="Directory to save official image (default: none)")
    ap.add_argument("--headed", action="store_true", help="Show browser for debugging")
    args = ap.parse_args()

    data = scrape_event(args.url, media_dir=args.media_dir, headless=(not args.headed))
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Wrote {args.out}")
    else:
        print(json.dumps(data, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()

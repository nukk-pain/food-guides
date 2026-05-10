"""
Extract structured restaurant records + per-restaurant images from
'2025년판 우체국 추천 맛집가이드 (부산지방우정청)' PDF.

Output:
  data/raw/postoffice-busan-2025.json   — all 245 restaurants
  data/raw/images/<post>-<no>-<idx>.<ext> — extracted photos

Run:
  .venv/bin/python extract_pdf.py
  .venv/bin/python extract_pdf.py --debug-page 5
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import fitz

SCRIPT_DIR = Path(__file__).parent
PKG_DIR = SCRIPT_DIR.parent
PDF_PATH = PKG_DIR / "data" / "source" / "postoffice-busan-2025.pdf"
OUT_JSON = PKG_DIR / "data" / "raw" / "postoffice-busan-2025.json"
OUT_IMG_DIR = PKG_DIR / "data" / "raw" / "images"

ANCHOR_RE = re.compile(
    r"^(?P<post>[가-힣]+우체국)(?:\s*\((?P<area>[^)]+)\))?\s*추천\s*(?P<no>\d+)\s*$"
)
PHONE_RE = re.compile(r"\b(?:\d{2,4}-\d{3,4}-\d{4}|\d{4}-\d{4})\b")
ADDR_PREFIXES = ("부산광역시", "울산광역시", "경상남도", "경남", "부산", "울산")
HOURS_HINTS = ("휴무", "연중무휴", "라스트오더", "정기휴무", "영업")
TIME_RE = re.compile(r"\d{1,2}:\d{2}")
PRICE_RE = re.compile(r"[₩￦]")

# Regional grouping per PDF table of contents
REGION_OF_POST: dict[str, str] = {
    # 부산권 (14)
    "부산우체국": "부산권",
    "동래우체국": "부산권",
    "남부산우체국": "부산권",
    "부산사상우체국": "부산권",
    "부산금정우체국": "부산권",
    "부산사하우체국": "부산권",
    "해운대우체국": "부산권",
    "부산진우체국": "부산권",
    "북부산우체국": "부산권",
    "부산연제우체국": "부산권",
    "동부산우체국": "부산권",
    "부산영도우체국": "부산권",
    "부산강서우체국": "부산권",
    "기장우체국": "부산권",
    # 경남권 (20)
    "마산우체국": "경남권",
    "진주우체국": "경남권",
    "진해우체국": "경남권",
    "창원우체국": "경남권",
    "김해우체국": "경남권",
    "양산우체국": "경남권",
    "거제우체국": "경남권",
    "통영우체국": "경남권",
    "거창우체국": "경남권",
    "고성우체국": "경남권",
    "남해우체국": "경남권",
    "밀양우체국": "경남권",
    "사천우체국": "경남권",
    "산청우체국": "경남권",
    "의령우체국": "경남권",
    "창녕우체국": "경남권",
    "하동우체국": "경남권",
    "함안우체국": "경남권",
    "함양우체국": "경남권",
    "합천우체국": "경남권",
    # 울산권 (3)
    "울산우체국": "울산권",
    "남울산우체국": "울산권",
    "동울산우체국": "울산권",
}

# Adobe InDesign CID glitches: PUA/CJK chars that should be middle-dot or comma.
# Inferred from intro page: "2025 부산䞱울산䞱경남권의 맛" → "2025 부산·울산·경남권의 맛"
TEXT_REPLACE = {
    "䞱": "·",
    "䞵": "·",
    "ㅣ": "|",  # 페이지 라벨에 쓰임
    "ݍ": "",   # 인트로 앞 깨진 글리프
    "￦": "₩",
}


def normalize(text: str) -> str:
    for k, v in TEXT_REPLACE.items():
        text = text.replace(k, v)
    return text.strip()


@dataclass
class Span:
    text: str
    x: float
    y: float
    size: float


@dataclass
class Anchor:
    pno: int  # 1-based PDF page
    post: str
    area: str | None
    no: int
    x: float
    y: float


@dataclass
class Card:
    anchor: Anchor
    bbox: tuple[float, float, float, float]  # x0, y0, x1, y1


@dataclass
class Restaurant:
    id: str
    region: str
    postOffice: str
    postOfficeArea: str | None
    recommendationNo: int
    name: str
    description: str
    menu: str
    address: str
    phone: str
    hours: str
    pdfPage: int
    images: list[str] = field(default_factory=list)


def extract_spans(page: fitz.Page) -> list[Span]:
    """Spans inside the printable area, excluding page chrome (footer + side region labels)."""
    pw, ph = page.rect.width, page.rect.height
    margin_x = 25.0
    footer_y = ph * 0.93
    out: list[Span] = []
    d = page.get_text("dict")
    for block in d["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            for s in line["spans"]:
                txt = normalize(s["text"])
                if not txt:
                    continue
                bbox = s["bbox"]
                x, y = bbox[0], bbox[1]
                if y >= footer_y:
                    continue
                # Side region labels ("부", "산", "권" stacked vertically at page margins)
                if (x < margin_x or x > pw - margin_x) and len(txt) <= 2:
                    continue
                out.append(Span(text=txt, x=x, y=y, size=round(s["size"], 1)))
    return out


def extract_anchors(doc: fitz.Document) -> list[Anchor]:
    anchors: list[Anchor] = []
    for pno in range(doc.page_count):
        page = doc[pno]
        d = page.get_text("dict")
        for block in d["blocks"]:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                joined = normalize("".join(s["text"] for s in line["spans"]))
                m = ANCHOR_RE.match(joined)
                if not m:
                    continue
                first = line["spans"][0]
                anchors.append(
                    Anchor(
                        pno=pno + 1,
                        post=m.group("post"),
                        area=m.group("area"),
                        no=int(m.group("no")),
                        x=first["bbox"][0],
                        y=first["bbox"][1],
                    )
                )
    return anchors


def card_bboxes_for_page(page: fitz.Page, anchors: list[Anchor]) -> list[Card]:
    """
    Split the page into card regions based on anchor x/y positions.
    Layout: 2x2 grid (max 4 cards per page).
    Page width ≈ 839 (spread), split at x=420 → left/right page.
    Each side split vertically at the midpoint between top-anchor and bottom-anchor.
    """
    pw, ph = page.rect.width, page.rect.height
    x_split = pw / 2  # ~420

    # Group anchors by side (left/right)
    left = sorted([a for a in anchors if a.x < x_split], key=lambda a: a.y)
    right = sorted([a for a in anchors if a.x >= x_split], key=lambda a: a.y)

    cards: list[Card] = []

    def split_side(side_anchors: list[Anchor], x0: float, x1: float) -> None:
        if not side_anchors:
            return
        if len(side_anchors) == 1:
            cards.append(Card(side_anchors[0], (x0, 0.0, x1, ph)))
            return
        if len(side_anchors) == 2:
            top, bot = side_anchors
            mid = (top.y + bot.y) / 2 - 5  # small margin above bottom anchor
            # Actually: bottom card starts at bot.y - small margin (anchor sits ABOVE its photo block)
            split_y = bot.y - 10
            cards.append(Card(top, (x0, 0.0, x1, split_y)))
            cards.append(Card(bot, (x0, split_y, x1, ph)))
            return
        # >2 on one side: shouldn't happen given probe results (max 4/page = 2 each side)
        # Fallback: equal vertical splits
        n = len(side_anchors)
        for i, a in enumerate(side_anchors):
            y0 = i * ph / n
            y1 = (i + 1) * ph / n
            cards.append(Card(a, (x0, y0, x1, y1)))

    split_side(left, 0.0, x_split)
    split_side(right, x_split, pw)
    return cards


def in_bbox(x: float, y: float, bbox: tuple[float, float, float, float]) -> bool:
    return bbox[0] <= x <= bbox[2] and bbox[1] <= y <= bbox[3]


def classify_card_text(card: Card, spans: list[Span]) -> dict:
    """Pick out 식당명/소개/메뉴/주소/전화/영업시간 from spans inside card bbox."""
    inside = [s for s in spans if in_bbox(s.x, s.y, card.bbox)]

    # Skip the anchor span itself (small font, top of card)
    inside = [s for s in inside if not ANCHOR_RE.match(s.text)]

    # 식당명: largest font (typically 16pt)
    name_spans = sorted(inside, key=lambda s: -s.size)
    name = ""
    name_y = 0.0
    if name_spans and name_spans[0].size >= 12:
        name = name_spans[0].text
        name_y = name_spans[0].y

    # The 8pt block beneath the name has menu/address/phone/hours stacked in y order.
    # Description is the 8pt span(s) ABOVE the name.
    body = [s for s in inside if s.size <= 9 and s.text != name]
    above = [s for s in body if s.y < name_y]
    below = [s for s in body if s.y > name_y]

    description = " ".join(s.text for s in sorted(above, key=lambda s: (s.y, s.x)))

    # Below: classify each span by content
    menu_parts: list[str] = []
    address = ""
    phone = ""
    hours = ""
    leftover_below: list[str] = []

    for s in sorted(below, key=lambda s: (s.y, s.x)):
        t = s.text
        m_phone = PHONE_RE.search(t)
        if m_phone:
            extra = t.replace(m_phone.group(0), "").strip()
            phone = m_phone.group(0) + ((" " + extra) if extra else "")
            continue
        if PRICE_RE.search(t):
            menu_parts.append(t)
            continue
        if any(t.startswith(p) for p in ADDR_PREFIXES):
            # First address line wins; ignore subsequent ones (multi-line addresses joined later)
            if not address:
                address = t
            else:
                address += " " + t
            continue
        if any(h in t for h in HOURS_HINTS) or TIME_RE.search(t):
            hours = (hours + " " + t).strip()
            continue
        leftover_below.append(t)

    # 메뉴: when restaurant has no ₩ items (rare; some entries quote menu without price)
    if not menu_parts and leftover_below:
        # The first leftover under name is likely menu (e.g. "강원도물회" without ₩)
        menu_parts = [leftover_below[0]]
        leftover_below = leftover_below[1:]

    # leftover_below 가 남으면 description 끝에 합치기
    if leftover_below:
        description = (description + " " + " ".join(leftover_below)).strip()

    return {
        "name": name,
        "description": description,
        "menu": "  ".join(menu_parts).strip(),
        "address": address,
        "phone": phone,
        "hours": hours,
    }


def collect_card_images(
    doc: fitz.Document,
    page: fitz.Page,
    card: Card,
    out_dir: Path,
    seq_index: int,
) -> list[str]:
    """Save images that overlap the card bbox. Returns list of image paths (relative to package data/raw/)."""
    saved: list[str] = []
    cx0, cy0, cx1, cy1 = card.bbox
    seen: set[int] = set()
    for img in page.get_images(full=True):
        xref = img[0]
        if xref in seen:
            continue
        for r in page.get_image_rects(xref):
            # filter: image must overlap card bbox AND have meaningful size (>30x30)
            if r.width < 30 or r.height < 30:
                continue
            if r.x1 < cx0 or r.x0 > cx1:
                continue
            if r.y1 < cy0 or r.y0 > cy1:
                continue
            seen.add(xref)
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            ext = base.get("ext", "png")
            data = base["image"]
            slug = f"{card.anchor.post}-{card.anchor.no}-{len(saved) + 1:02d}.{ext}"
            target = out_dir / slug
            target.write_bytes(data)
            saved.append(f"images/{slug}")
            break
    return saved


def build_restaurant(
    doc: fitz.Document,
    page: fitz.Page,
    card: Card,
    spans: list[Span],
    out_img_dir: Path,
    idx: int,
) -> Restaurant:
    fields = classify_card_text(card, spans)
    images = collect_card_images(doc, page, card, out_img_dir, idx)
    a = card.anchor
    return Restaurant(
        id=f"{a.post}-{a.no}",
        region=REGION_OF_POST.get(a.post, "unknown"),
        postOffice=a.post,
        postOfficeArea=a.area,
        recommendationNo=a.no,
        pdfPage=a.pno,
        images=images,
        **fields,
    )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--debug-page", type=int, default=None, help="Print debug for a single PDF page (1-based).")
    p.add_argument("--no-images", action="store_true", help="Skip image extraction")
    args = p.parse_args()

    OUT_IMG_DIR.mkdir(parents=True, exist_ok=True)
    if not args.no_images:
        # Clear stale images
        for f in OUT_IMG_DIR.glob("*.*"):
            f.unlink()

    pdf_real = PDF_PATH.resolve()
    sha = hashlib.sha256(pdf_real.read_bytes()).hexdigest()
    doc = fitz.open(str(pdf_real))

    anchors = extract_anchors(doc)
    page_anchors: dict[int, list[Anchor]] = defaultdict(list)
    for a in anchors:
        page_anchors[a.pno].append(a)

    restaurants: list[Restaurant] = []
    for pno, page_anch in sorted(page_anchors.items()):
        page = doc[pno - 1]
        spans = extract_spans(page)
        cards = card_bboxes_for_page(page, page_anch)
        for card in cards:
            r = build_restaurant(
                doc, page, card, spans,
                out_img_dir=OUT_IMG_DIR if not args.no_images else Path("/tmp"),
                idx=len(restaurants) + 1,
            )
            if args.debug_page == pno:
                print(json.dumps(asdict(r), ensure_ascii=False, indent=2))
            restaurants.append(r)

    restaurants.sort(key=lambda r: (r.region, r.postOffice, r.recommendationNo))

    out = {
        "metadata": {
            "source": "2025년판 우체국 추천 맛집가이드 — 부산지방우정청",
            "year": 2025,
            "totalCount": len(restaurants),
            "extractedAt": datetime.now(timezone.utc).isoformat(),
            "sourceFile": "data/source/postoffice-busan-2025.pdf",
            "sourceSha256": sha,
            "pdfPageCount": doc.page_count,
        },
        "restaurants": [asdict(r) for r in restaurants],
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(restaurants)} restaurants to {OUT_JSON.relative_to(PKG_DIR)}")
    if not args.no_images:
        n_images = sum(len(r.images) for r in restaurants)
        print(f"Saved {n_images} images to {OUT_IMG_DIR.relative_to(PKG_DIR)}")
    # Quick QA
    missing = [r for r in restaurants if not r.name or not r.address or not r.phone]
    if missing:
        print(f"\n⚠ {len(missing)} restaurants missing name/address/phone:")
        for r in missing[:10]:
            print(f"  {r.id} (page {r.pdfPage}): name={r.name!r}, addr={r.address!r}, phone={r.phone!r}")
    no_images = [r for r in restaurants if not r.images]
    if no_images and not args.no_images:
        print(f"\n⚠ {len(no_images)} restaurants without any image:")
        for r in no_images[:10]:
            print(f"  {r.id} (page {r.pdfPage})")


if __name__ == "__main__":
    main()

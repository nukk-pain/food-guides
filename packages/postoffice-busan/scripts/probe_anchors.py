"""
Probe pass: detect every '<우체국명> 추천 N' anchor across all PDF pages.
Verifies whether anchors total 245 (matches PDF claim).
Run: .venv/bin/python probe_anchors.py
"""
import re
import sys
from pathlib import Path

import fitz

ANCHOR_RE = re.compile(r"^(?P<post>[가-힣]+우체국)(?:\s*\([^)]*\))?\s*추천\s*(?P<no>\d+)\s*$")
PDF_PATH = Path(__file__).parent.parent / "data" / "source" / "postoffice-busan-2025.pdf"


def main() -> None:
    doc = fitz.open(PDF_PATH)
    anchors: list[tuple[int, str, int, float, float]] = []
    for pno in range(doc.page_count):
        page = doc[pno]
        d = page.get_text("dict")
        for block in d["blocks"]:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                spans_text = "".join(s["text"] for s in line["spans"]).strip()
                m = ANCHOR_RE.match(spans_text)
                if not m:
                    continue
                first_span = line["spans"][0]
                bbox = first_span["bbox"]
                anchors.append(
                    (pno + 1, m.group("post"), int(m.group("no")), bbox[0], bbox[1])
                )

    print(f"Total anchors: {len(anchors)} (expected 245)")

    # Distribution by 우체국
    from collections import Counter

    counts = Counter((a[1] for a in anchors))
    print(f"\nUnique 우체국: {len(counts)}")
    for post, c in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {c:3d}  {post}")

    # Anchors per page (cards/page)
    page_counts = Counter(a[0] for a in anchors)
    print(f"\nPages with anchors: {len(page_counts)}")
    print(
        f"  cards/page: min={min(page_counts.values())}, max={max(page_counts.values())}, mean={sum(page_counts.values())/len(page_counts):.2f}"
    )
    distribution = Counter(page_counts.values())
    print(f"  distribution: {dict(sorted(distribution.items()))}")

    # Sanity: anchor sequencing per 우체국 (should be 1..N consecutive)
    print("\nAnchor sequence sanity:")
    by_post: dict[str, list[int]] = {}
    for _, post, no, _, _ in anchors:
        by_post.setdefault(post, []).append(no)
    for post, nos in by_post.items():
        nos_sorted = sorted(nos)
        expected = list(range(1, len(nos_sorted) + 1))
        if nos_sorted != expected:
            print(f"  ⚠ {post}: got {nos_sorted}, expected {expected}")
    print("  (no warnings = all sequences are 1..N)")


if __name__ == "__main__":
    main()

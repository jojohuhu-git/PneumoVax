#!/usr/bin/env python3
"""Print a PDF's text with x/y coordinates, in reading order.

Why this exists (C7, 2026-10-17). Four of the six documents the app cites are
PDFs, and the CDC job aids among them are TABLES: rows are prior-vaccine
histories, columns are "Option A" / "Option B". A flat text dump (pdftotext,
pdfminer's extract_text) interleaves the columns, so you can read the sentence
">=8 weeks" without being able to tell which patient row it belongs to. That is
exactly how a true-sounding quote ends up attached to the wrong patient, which
is the error C6/G4 exist to prevent.

Printing each text block with its coordinates lets you rebuild the table: group
by y for the row, read x for the column. A cell merged across two rows shows up
at the midpoint between their labels.

Needs no install: pdfminer.six is already present. poppler is NOT required (the
Read tool's PDF rendering wants pdftoppm; this does not).

    python3 scripts/pdfLayout.py <file.pdf> [page]
"""
import logging
import sys

logging.disable(logging.CRITICAL)   # pdfminer warns per glyph on CDC's fonts
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer, LAParams


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = sys.argv[1]
    only = int(sys.argv[2]) if len(sys.argv) > 2 else None
    # Tight line_margin keeps a table cell's own lines together without
    # swallowing the neighbouring column.
    laparams = LAParams(line_margin=0.3, char_margin=1.5, word_margin=0.1,
                        detect_vertical=False)
    for pno, page in enumerate(extract_pages(path, laparams=laparams), start=1):
        if only and pno != only:
            continue
        print(f"\n{'=' * 70}\nPAGE {pno}   (page box: {page.bbox})\n{'=' * 70}")
        items = []
        for el in page:
            if isinstance(el, LTTextContainer):
                text = el.get_text().strip()
                if text:
                    items.append((round(el.y1, 1), round(el.x0, 1), round(el.x1, 1), text))
        # Top-to-bottom, then left-to-right: the order a person reads a table.
        for y1, x0, x1, text in sorted(items, key=lambda r: (-r[0], r[1])):
            flat = ' / '.join(s.strip() for s in text.split('\n') if s.strip())
            print(f"y={y1:7.1f} x={x0:6.1f}-{x1:6.1f} | {flat}")


if __name__ == '__main__':
    main()

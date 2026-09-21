"""post-merge hook logic: surface release arrears after every merge.

A feature's live TRACK.md carries the Phase 6 release boxes as literal checkboxes
(custom-conventions §2). Merging is an integration event, not completion, so this hook
prints every live TRACK that still holds unchecked boxes at the one moment the
"effort ended, so it must be done" illusion strikes. Frozen `TRACK_v*.md` are closed
versions and never scanned.

Purely informational: exit code is always 0.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

_UNCHECKED = re.compile(r"^\s*[-*]\s\[ \]")


def open_boxes(text: str) -> int:
    return sum(1 for line in text.splitlines() if _UNCHECKED.match(line))


def scan(repo_root: Path) -> list[tuple[Path, int]]:
    arrears = []
    for track in sorted(repo_root.glob("docs/features/*/TRACK.md")):
        n = open_boxes(track.read_text(encoding="utf-8"))
        if n:
            arrears.append((track.relative_to(repo_root), n))
    return arrears


def main() -> int:
    repo_root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    arrears = scan(repo_root)
    if arrears:
        print("\n⚠ Release boxes still open — merged is not released:")
        for path, n in arrears:
            print(f"  - {path} — {n} open box(es)")
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())

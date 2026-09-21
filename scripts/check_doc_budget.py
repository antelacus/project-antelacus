#!/usr/bin/env python3
"""Doc-budget checker: the docs an AI session loads stay inside their size and date budgets.

The budgets' home is `custom-conventions` §7 (Budgets and the repo-infra kit):
  project CLAUDE.md ≤ 250 · REQ ≤ 400 · DESIGN ≤ 600 · live TRACK.md ≤ 300 lines ·
  one TRACK batch entry ≤ 10 lines · REQ and DESIGN carry no ISO dates.
Over budget, the only legal moves are move-to-home or delete — this script never edits.

Why a mechanism rather than a rule: a rule plus a one-time cleanup regrows. A budget that CI
reads is a standing constraint. Retirement trigger: if this never fires red across a version,
write its retirement into the TRACK and delete it.

Scope (each one is a line the checker does NOT cross):
- Files: `CLAUDE.md` at the repo root; `docs/features/*/{REQ,DESIGN,TRACK}.md`. Frozen
  siblings (`TRACK_v*.md`, `REQ_v*.md`) are snapshots and out of scope by their names.
- Dates: ISO `YYYY-MM-DD` only. A date under a heading tagged `[冻结]` is legal — that
  section is a point-in-time record by declaration.
- A batch entry is one `###` block inside TRACK zone `## 二、`; its length is its non-blank
  lines, heading excluded.

Modes: default = enforce (exit 1 on any violation). `--report` = print everything, exit 0.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

CAPS = {"CLAUDE": 250, "REQ": 400, "DESIGN": 600, "TRACK": 300}
BATCH_ENTRY_CAP = 10
NO_DATE_KINDS = {"REQ", "DESIGN"}

# Per-doc size overrides (repo-relative path → cap). Each entry is a Project Lead ruling, cited
# in a comment beside it. It may be LOWERED freely, never raised without a new ruling. An entry
# whose doc no longer exists is a violation (a dead override is a budget nobody is under).
CAP_OVERRIDES: dict[str, int] = {}

# Docs deliberately outside the budget. Keep this SHORT and give each entry its reason — the
# summary line prints the count, so an exemption stays visible instead of reading as "ok".
EXEMPT_DOCS: dict[str, str] = {}

FEATURE_DOCS = {"REQ.md": "REQ", "DESIGN.md": "DESIGN", "TRACK.md": "TRACK"}

_ISO_DATE_RE = re.compile(r"(?<![\d.])20\d{2}-\d{2}-\d{2}(?![\d.])")
_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
_BATCH_ZONE_RE = re.compile(r"^##\s+二、")
_H2_RE = re.compile(r"^##\s")


@dataclass
class Report:
    doc: str
    kind: str
    readings: list[str] = field(default_factory=list)
    violations: list[str] = field(default_factory=list)


def iter_budget_docs(root: Path):
    """(path, kind) for every doc the budget covers, exempt ones included."""
    claude = root / "CLAUDE.md"
    if claude.is_file():
        yield claude, "CLAUDE"
    for feature_dir in sorted((root / "docs" / "features").glob("*/")):
        for name, kind in FEATURE_DOCS.items():
            p = feature_dir / name
            if p.is_file():
                yield p, kind


def dates_outside_frozen(lines: list[str]) -> list[tuple[int, str]]:
    """ISO dates on lines not covered by a `[冻结]` heading (its own or an ancestor's)."""
    found = []
    stack: list[tuple[int, bool]] = []  # (heading level, tagged frozen)
    for no, line in enumerate(lines, 1):
        m = _HEADING_RE.match(line)
        if m:
            level = len(m.group(1))
            while stack and stack[-1][0] >= level:
                stack.pop()
            stack.append((level, "[冻结]" in m.group(2)))
        if any(frozen for _, frozen in stack):
            continue
        for d in _ISO_DATE_RE.finditer(line):
            found.append((no, d.group(0)))
    return found


def batch_entries(lines: list[str]) -> list[tuple[int, str, int]]:
    """(heading line_no, title, non-blank body lines) for each `###` block in zone 二."""
    entries = []
    in_zone = False
    current: tuple[int, str] | None = None
    count = 0
    for no, line in enumerate(lines, 1):
        if _H2_RE.match(line):
            if current:
                entries.append((*current, count))
                current = None
            in_zone = bool(_BATCH_ZONE_RE.match(line))
            continue
        if not in_zone:
            continue
        m = _HEADING_RE.match(line)
        if m and len(m.group(1)) == 3:
            if current:
                entries.append((*current, count))
            current, count = (no, m.group(2).strip()), 0
        elif current and line.strip():
            count += 1
    if current:
        entries.append((*current, count))
    return entries


def check_doc(path: Path, kind: str, root: Path) -> Report:
    lines = path.read_text(encoding="utf-8").splitlines()
    rep = Report(doc=path.relative_to(root).as_posix(), kind=kind)

    cap = CAP_OVERRIDES.get(rep.doc, CAPS[kind])
    rep.readings.append(f"{len(lines)}/{cap} lines")
    if len(lines) > cap:
        rep.violations.append(f"{kind} is {len(lines)} lines, budget {cap}")

    if kind in NO_DATE_KINDS:
        dated = dates_outside_frozen(lines)
        rep.readings.append(f"dates: {len(dated)}")
        if dated:
            first_no, first_date = dated[0]
            rep.violations.append(
                f"{len(dated)} date(s) in a living doc (first {first_date} at :{first_no}) — "
                "a ruling belongs in TRACK 一, a story in the commit body"
            )

    if kind == "TRACK":
        over = [(no, t, n) for no, t, n in batch_entries(lines) if n > BATCH_ENTRY_CAP]
        rep.readings.append(f"batch entries over {BATCH_ENTRY_CAP} lines: {len(over)}")
        for no, title, n in over:
            rep.violations.append(f"batch entry at :{no} is {n} lines, budget {BATCH_ENTRY_CAP} — {title[:60]}")
    return rep


def run(root: Path, enforce: bool) -> int:
    print(f"doc-budget ({'enforce' if enforce else 'report'}; budgets = custom-conventions §7)")
    total = 0
    budgeted = exempt = 0
    for table, label in ((CAP_OVERRIDES, "override"), (EXEMPT_DOCS, "exemption")):
        for rel in sorted(rel for rel in table if not (root / rel).is_file()):
            print(f"  OVER {label} {rel}  ·  names a doc that does not exist — delete the entry")
            total += 1
    for path, kind in iter_budget_docs(root):
        rel = path.relative_to(root).as_posix()
        if rel in EXEMPT_DOCS:
            exempt += 1
            print(f"  skip {kind:6} {rel}  ·  exempt: {EXEMPT_DOCS[rel]}")
            continue
        budgeted += 1
        rep = check_doc(path, kind, root)
        print(f"  {'OVER' if rep.violations else 'ok':4} {rep.kind:6} {rep.doc}  ·  {' · '.join(rep.readings)}")
        for v in rep.violations:
            print(f"         ✗ {v}")
        total += len(rep.violations)
    print(f"\nbudgeted {budgeted} · exempt {exempt} · {total} violation(s).", end=" ")
    if budgeted == 0:
        print("Nothing was checked — a checker that checks nothing proves nothing.")
        return 1 if enforce else 0
    if total and enforce:
        print("The only legal moves are move-to-home or delete.")
        return 1
    print("Report mode: exit 0." if total else "")
    return 0


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    return run(REPO_ROOT, enforce="--report" not in argv)


if __name__ == "__main__":
    sys.exit(main())

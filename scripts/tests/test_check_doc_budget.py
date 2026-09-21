"""Tests for the doc-budget checker. Installed at `scripts/tests/` beside `scripts/check_doc_budget.py`."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import check_doc_budget as cdb  # noqa: E402


def make_repo(tmp_path: Path, docs: dict[str, str]) -> Path:
    for rel, text in docs.items():
        p = tmp_path / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
    return tmp_path


def body(n: int) -> str:
    return "\n".join(f"line {i}" for i in range(n)) + "\n"


def test_doc_within_cap_passes(tmp_path):
    root = make_repo(tmp_path, {"docs/features/f/REQ.md": body(400)})
    assert cdb.run(root, enforce=True) == 0


def test_doc_over_cap_fails_in_enforce_and_passes_in_report(tmp_path):
    root = make_repo(tmp_path, {"docs/features/f/REQ.md": body(401)})
    assert cdb.run(root, enforce=True) == 1
    assert cdb.run(root, enforce=False) == 0


def test_each_kind_uses_its_own_cap(tmp_path):
    root = make_repo(tmp_path, {
        "CLAUDE.md": body(251),
        "docs/features/f/DESIGN.md": body(601),
        "docs/features/f/TRACK.md": body(301),
    })
    reports = [cdb.check_doc(p, k, root) for p, k in cdb.iter_budget_docs(root)]
    assert [bool(r.violations) for r in reports] == [True, True, True]


def test_frozen_siblings_are_out_of_scope(tmp_path):
    root = make_repo(tmp_path, {
        "docs/features/f/TRACK.md": body(10),
        "docs/features/f/TRACK_v1.0.0.md": body(5000),
        "docs/features/f/REQ_v1.md": body(5000),
    })
    assert [p.name for p, _ in cdb.iter_budget_docs(root)] == ["TRACK.md"]


def test_date_in_living_doc_is_a_violation(tmp_path):
    root = make_repo(tmp_path, {"docs/features/f/DESIGN.md": "## 2 总体设计\n改于 2026-09-21\n"})
    assert cdb.run(root, enforce=True) == 1


def test_date_under_frozen_heading_is_legal_and_scope_ends_with_the_section():
    lines = [
        "## 1 概述",
        "### 1.1 需求背景 [冻结]",
        "访谈于 2026-01-05",
        "#### 补充",
        "又于 2026-01-09",
        "### 1.2 范围",
        "改于 2026-02-01",
    ]
    assert cdb.dates_outside_frozen(lines) == [(7, "2026-02-01")]


def test_dates_are_allowed_in_track(tmp_path):
    root = make_repo(tmp_path, {"docs/features/f/TRACK.md": "## 一、范围与裁定\n- 2026-09-21 · 裁定\n"})
    assert cdb.run(root, enforce=True) == 0


def test_version_like_strings_are_not_dates():
    assert cdb.dates_outside_frozen(["依赖 1.2026-01-01.3 与 §2026-01"]) == []


def test_batch_entry_counts_non_blank_lines_only_inside_zone_two():
    lines = ["## 一、范围与裁定", "### 不是批次"] + ["x"] * 20 + [
        "## 二、批次", "### Batch 1 — 短", "a", "", "b",
        "### Batch 2 — 长", *["y"] * 11,
        "## 三、门与发布", "### 也不是批次", *["z"] * 20,
    ]
    assert [(t, n) for _, t, n in cdb.batch_entries(lines)] == [("Batch 1 — 短", 2), ("Batch 2 — 长", 11)]


def test_oversized_batch_entry_is_a_violation(tmp_path):
    text = "## 二、批次\n### Batch 1\n" + "x\n" * 11
    root = make_repo(tmp_path, {"docs/features/f/TRACK.md": text})
    assert cdb.run(root, enforce=True) == 1


def test_override_raises_the_cap_and_a_dead_override_is_a_violation(tmp_path, monkeypatch):
    root = make_repo(tmp_path, {"docs/features/f/REQ.md": body(500)})
    monkeypatch.setattr(cdb, "CAP_OVERRIDES", {"docs/features/f/REQ.md": 600})
    assert cdb.run(root, enforce=True) == 0
    monkeypatch.setattr(cdb, "CAP_OVERRIDES", {"docs/features/gone/REQ.md": 600})
    assert cdb.run(root, enforce=True) == 1


def test_exempt_doc_is_skipped_but_counted_in_the_summary(tmp_path, monkeypatch, capsys):
    root = make_repo(tmp_path, {
        "docs/features/f/REQ.md": body(5000),
        "docs/features/g/REQ.md": body(10),
    })
    monkeypatch.setattr(cdb, "EXEMPT_DOCS", {"docs/features/f/REQ.md": "legacy, frozen project"})
    assert cdb.run(root, enforce=True) == 0
    assert "budgeted 1 · exempt 1 · 0 violation(s)" in capsys.readouterr().out


def test_checking_nothing_is_red(tmp_path):
    assert cdb.run(tmp_path, enforce=True) == 1

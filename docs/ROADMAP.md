# Lumpia Roadmap 🥟

> Goal: A fast, intelligent VS Code extension for comment-aware text wrapping across 40+ languages.

## Project Analysis

### Current State (v0.0.1)

Lumpia is a minimal VS Code extension with a single command (`lumpia.roll`, `Alt+R`) that wraps plain text to a configurable column width. The `rollText` function is ~25 lines of greedy line-filling with paragraph boundary detection.

**What it can do:**
- Wrap selected text or current line to `lumpia.column` (default 80)
- Preserve paragraph boundaries (blank lines)
- Handle multiple selections (each wrapped independently)

**What it cannot do:**
- Detect or preserve comment syntax (`//`, `#`, `/* */`, etc.)
- Preserve indentation
- Understand structured content (lists, code blocks, doc tags)
- Support per-language settings
- Auto-wrap while typing
- Handle CJK/emoji display width correctly

### Target Feature Set

| Feature | Status |
|---------|--------|
| Basic text wrapping | ✅ Implemented |
| Comment-aware wrapping (40+ langs) | 🔲 Planned (M1) |
| Per-language settings | 🔲 Planned (M2) |
| Ruler integration + cycling | 🔲 Planned (M2) |
| Whole comment vs paragraph mode | 🔲 Planned (M2) |
| Context-aware auto-wrap | 🔲 Planned (M4) |
| Double sentence spacing | 🔲 Planned (M2) |
| Unwrap command | 🔲 Planned (M2) |
| Markdown in comments | 🔲 Planned (M3) |
| Doc comments (JSDoc, etc.) | 🔲 Planned (M3) |
| Preserved line breaks | 🔲 Planned (M2) |
| Custom column command | 🔲 Planned (M2) |
| Smart document wrapping | 🔲 Planned (M2) |
| CJK/emoji display width | 🔲 Planned (M1) |
| Format-on-save | 🔲 Planned (M4) |
| Opinionated mode | 🔲 Planned (M4) |
| AI/prompt awareness | 🔲 Planned (M4) |

### Architecture

| Aspect | Target |
|--------|--------|
| Language | Pure TypeScript |
| Parser | Regex-first, Tree-sitter optional |
| Bundle size | <100KB |
| Platform | VS Code |

---

## Milestones

### M1: Engine & Safety Foundation (Weeks 1-3)

**Goal:** Refactor to modular architecture, implement comment-aware wrapping for top languages, establish golden test harness.

| ID | Task | ADR |
|----|------|-----|
| M1-1 | Modular file architecture refactor | ADR-002 |
| M1-2 | Backend-neutral parser interface | ADR-001 |
| M1-3 | Regex region provider — Tier 1 languages | ADR-001 |
| M1-4 | Comment prefix detection & normalization | ADR-003 |
| M1-5 | Indentation preservation | ADR-003 |
| M1-6 | Block-based content model (paragraph, code, list, heading) | ADR-005 |
| M1-7 | Column/config resolution with precedence | ADR-004 |
| M1-8 | Unicode display width handling | ADR-010 |
| M1-9 | Golden test harness with fixtures | — |
| M1-10 | Selection semantics (cursor in comment, partial, whole doc) | — |
| M1-11 | No-op preservation guarantees | — |

**Tier 1 languages (fully tested):** TypeScript, JavaScript, Python, Go, Rust, C/C++, Java, C#, Ruby, Shell/Bash

### M2: Core Feature Completion (Weeks 4-6)

**Goal:** Complete the core wrapping feature set with full configuration, selection modes, and document support.

| ID | Task | ADR |
|----|------|-----|
| M2-1 | Ruler integration + cycling behavior | ADR-004 |
| M2-2 | Whole comment vs paragraph mode (`lumpia.wholeComment`) | — |
| M2-3 | Unwrap command (`lumpia.unwrap`) | — |
| M2-4 | Custom column command (`lumpia.rollAtColumn`) | — |
| M2-5 | Double sentence spacing option | — |
| M2-6 | Smart whole-document wrapping (only comments in code files) | — |
| M2-7 | Per-language settings via `[language]` sections | ADR-004 |
| M2-8 | Preserve line breaks (trailing double-space) | ADR-005 |
| M2-9 | Markdown/plaintext document full support | ADR-005 |
| M2-10 | CRLF/LF + trailing newline preservation | — |

### M3: Smart Content & Language Expansion (Weeks 7-9)

**Goal:** Robust handling of structured content in comments. Broad language coverage.

| ID | Task | ADR |
|----|------|-----|
| M3-1 | Markdown-aware comment parsing (lists, code blocks, blockquotes) | ADR-005 |
| M3-2 | JSDoc/TSDoc tag handling (`@param`, `@returns`, `@example`) | ADR-005 |
| M3-3 | XMLDoc tag handling (C#, F#, VB) | ADR-005 |
| M3-4 | Python docstring support (triple-quote, reST, NumPy, Google style) | — |
| M3-5 | Rustdoc / Godoc / Dartdoc support | ✅ |
| M3-6 | LaTeX document support | — |
| M3-7 | Tier 2 language expansion (20+ more languages) | — |
| M3-8 | Tier 3 language fallback (plaintext wrapping for unknown) | — |
| M3-9 | HTML/XML embedded comment support | — |

**Tier 2 languages (basic line/block):** PHP, Perl, Lua, SQL, Swift, Kotlin, Scala, R, Julia, Elixir, Erlang, Haskell, F#, Clojure, YAML, TOML, INI, Dockerfile, Makefile, CSS/SCSS/Less, Elm

### M4: Advanced Features & Differentiators (Weeks 10-13)

**Goal:** Ship novel features that make Lumpia best-in-class for comment wrapping.

| ID | Task | ADR |
|----|------|-----|
| M4-1 | Improved auto-wrap (context-aware, comment-only) | ADR-006 |
| M4-2 | Auto-wrap toggle command + status bar indicator | ADR-006 |
| M4-3 | Format-on-save integration (opt-in) | ADR-007 |
| M4-4 | Opinionated mode (community-standard columns per language) | ADR-008 |
| M4-5 | AI/prompt-aware preservation (fenced blocks, tagged comments) | ADR-009 |
| M4-6 | Custom preserved-block markers setting | ADR-009 |
| M4-7 | Tree-sitter WASM backend spike/prototype | ADR-001 |
| M4-8 | Performance benchmarking suite | — |
| M4-9 | Adoption guide and settings documentation | — |

---

## Language Support Tiers

| Tier | Description | Target Count |
|------|-------------|-------------|
| **Tier 1** | Fully tested: line/block/doc comments, Markdown in comments, golden fixtures | 10 languages |
| **Tier 2** | Tested: basic line/block comment wrapping | 20+ languages |
| **Tier 3** | Plaintext fallback for unrecognized languages | All others |

---

## Architecture Decision Records

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](docs/adr/001-hybrid-parsing-architecture.md) | Hybrid Parsing Architecture | Proposed |
| [ADR-002](docs/adr/002-modular-architecture.md) | Modular File Architecture | Proposed |
| [ADR-003](docs/adr/003-comment-prefix-detection.md) | Comment Prefix Detection | Proposed |
| [ADR-004](docs/adr/004-config-resolution-precedence.md) | Config Resolution & Precedence | Proposed |
| [ADR-005](docs/adr/005-block-content-model.md) | Block-Based Content Model | Proposed |
| [ADR-006](docs/adr/006-auto-wrap-strategy.md) | Auto-Wrap Strategy | Proposed |
| [ADR-007](docs/adr/007-format-on-save.md) | Format-on-Save Integration | Proposed |
| [ADR-008](docs/adr/008-opinionated-defaults.md) | Opinionated Wrapping Defaults | Proposed |
| [ADR-009](docs/adr/009-ai-prompt-awareness.md) | AI/Prompt-Aware Wrapping | Proposed |
| [ADR-010](docs/adr/010-unicode-display-width.md) | Unicode Display Width | Proposed |

---

## Success Criteria

### v0.1.0 (end of M1)
- Comment-aware wrapping works for Tier 1 languages
- Golden test suite with 50+ fixtures
- No regressions in existing plain-text wrapping

### v0.2.0 (end of M2)
- Complete wrapping feature set with ruler cycling, unwrap, and per-language settings
- Ruler integration, unwrap, per-language settings all working

### v0.3.0 (end of M3)
- 30+ languages supported at Tier 1 or Tier 2
- Doc comment handling for major ecosystems

### v1.0.0 (end of M4)
- Full feature set for all common wrapping use cases
- Auto-wrap, format-on-save, opinionated mode shipped
- Sub-100ms wrapping performance on real-world files
- Published on VS Code Marketplace

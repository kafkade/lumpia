# Changelog

## Unreleased

### Added

- Added CI workflow for pull request validation (lint, build, test)
- Added release workflow for automated GitHub Releases and VS Code Marketplace publishing
- Added vitest and unit tests for `rollText`
- Added PR and issue templates
- Comment-aware wrapping with language detection for 12 languages (TypeScript, JavaScript, Python, Go, Rust, C, C++, Java, C#, Ruby, Shell, CSS)
- Structured comment prefix detection (indent, marker, spacing) for line, block, and doc comments
- `lumpia.reformat` setting to normalize comment prefix spacing to a single space after the marker
- Block-aware content model: wrapping engine now recognizes paragraphs, lists, code fences, headings, tables, blockquotes, doc tags, and indented code — each wrapped according to its semantics
- Unicode display width support for correct column calculation with CJK, emoji, fullwidth characters, and tab expansion
- Config resolution with 7-level precedence: explicit arg → ruler cycling → language-specific → global → editor.rulers → editor.wordWrapColumn → default (80)
- `Lumpia: Roll Text at Column…` command (`lumpia.rollAtColumn`) for one-off wrapping at a specific column width
- `Lumpia: Unwrap Text` command (`lumpia.unwrap`) to join hard-wrapped lines back into single-line paragraphs, preserving paragraph boundaries and comment prefixes; also available via `lumpia.rollAtColumn` by leaving the column input empty
- Golden test harness with 52 fixture pairs across TypeScript, Python, Rust, Markdown, and edge cases (CJK, emoji, tabs, long words)
- Selection semantics: empty cursor expands to paragraph (plaintext/markdown) or wraps entire comment region (code); selections wrap only selected lines; multiple cursors processed independently with deduplication
- No-op preservation: wrapping already-wrapped text produces zero changes; CRLF line endings preserved; trailing newlines neither added nor removed
- Ruler cycling: repeated `Alt+R` cycles through `editor.rulers` values; ruler `0` triggers unwrap; per-document session memory; status bar shows active ruler
- `lumpia.wholeComment` setting: when `false`, empty cursor wraps only the current paragraph within a comment instead of the entire block; selections always override

## 0.0.1

- Initial release
- Basic text rolling to configurable column width

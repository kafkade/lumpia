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
- Golden test harness with 85 fixture pairs across TypeScript, Python, Rust, C#, Ruby, Shell, Java, Go, Markdown, and edge cases (CJK, emoji, tabs, long words)
- Selection semantics: empty cursor expands to paragraph (plaintext/markdown) or wraps entire comment region (code); selections wrap only selected lines; multiple cursors processed independently with deduplication
- No-op preservation: wrapping already-wrapped text produces zero changes; CRLF line endings preserved; trailing newlines neither added nor removed
- Ruler cycling: repeated `Alt+R` cycles through `editor.rulers` values; ruler `0` triggers unwrap; per-document session memory; status bar shows active ruler
- `lumpia.wholeComment` setting: when `false`, empty cursor wraps only the current paragraph within a comment instead of the entire block; selections always override
- Whole-document wrapping (`Ctrl+A`, `Alt+R`): wraps only comments and docstrings in code files (code is never modified) and every paragraph in Markdown/plaintext files; handles a 10,000-line file in well under 500ms
- `lumpia.doubleSentenceSpacing` setting: when `true`, wrapping inserts two spaces after sentence-ending punctuation (`.`, `?`, `!`, including when followed by a closing quote or bracket); disabled by default and per-language overridable
- Per-language settings support: `lumpia.column`, `lumpia.reformat`, and `lumpia.wholeComment` now honor VS Code's native `[language]` override sections (declared with `language-overridable` scope), so language-specific values take precedence over the global setting

### Changed

- Files with mixed line endings are now normalized to the dominant style (CRLF or LF) when wrapping, instead of always switching to CRLF whenever any CRLF was present

### Fixed

- Wrapping no longer breaks Markdown links, images, and references across lines: inline links (`[label](url)`), images (`![alt](src)`), reference links (`[text][ref]`), and autolinks (`<url>`) are kept intact even when their label or title contains spaces
- Wrapping in the editor now preserves the document's line-ending style: CRLF documents keep CRLF and no longer get LF characters inserted into wrapped lines

## 0.0.1

- Initial release
- Basic text rolling to configurable column width

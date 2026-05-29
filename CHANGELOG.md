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
- Golden test harness with 52 fixture pairs across TypeScript, Python, Rust, Markdown, and edge cases (CJK, emoji, tabs, long words)

## 0.0.1

- Initial release
- Basic text rolling to configurable column width

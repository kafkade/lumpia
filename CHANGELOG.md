# Changelog

## Unreleased

### Added

- Dart language support (`.dart`): Dartdoc `///` line doc comments and `/** */`
  block doc comments are now recognized and wrapped as Markdown, so cross-reference
  links (`[Class]`, `[method]`) and fenced code examples are preserved while prose
  reflows.
- Python docstring wrapping for triple-quoted (`"""`/`'''`) docstrings in all major styles: reST/Sphinx field lists (`:param name:`, `:returns:`, `:raises Exc:`) wrap with a hanging indent; Google-style sections (`Args:`, `Returns:`, `Raises:`, …) keep their header and wrap each `name (type): description` entry with a hanging indent; NumPy-style sections (`Parameters`/`Returns` underlined with dashes) preserve the header, dash underline, and `name : type` entries while reflowing descriptions; plain prose and fenced code examples inside docstrings are handled as before. Section-aware parsing is scoped to docstring regions, so other comments and Markdown are unaffected.
- XMLDoc doc-comment tag handling for C#, F#, and VB (`///` and VB `'''`): block-level tags (`<summary>`, `<param>`, `<typeparam>`, `<returns>`, `<remarks>`, `<value>`, `<exception>`, `<para>`) are wrapped structurally — kept on one line when they fit, otherwise the opening/closing tags sit on their own lines with the content wrapped between them; `<code>` and `<example>` content is preserved verbatim; self-closing tags (`<see cref="..."/>`, `<paramref/>`) and inline `<c>...</c>` spans are treated as atomic tokens so they are never split across a wrap boundary. Adds F# (`.fs`/`.fsi`/`.fsx`) and Visual Basic (`.vb`) as recognized languages.
- JSDoc/TSDoc doc-comment tag handling: `@example` blocks are preserved verbatim (code and blank lines kept intact) until the next tag or end of comment; `@type`, `@typedef`, and `@template` tags are preserved verbatim; inline tags like `{@link ...}` are treated as atomic tokens so they are never split across a wrap boundary. Existing hanging-indent wrapping for `@param`, `@returns`, `@throws`, `@deprecated`, and `@see` is unchanged.
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
- Godoc code examples indented with a tab (gofmt's convention) are now preserved verbatim instead of being reflowed as prose, matching the existing handling of 4-space-indented code blocks

## 0.0.1

- Initial release
- Basic text rolling to configurable column width

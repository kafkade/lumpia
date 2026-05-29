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

## 0.0.1

- Initial release
- Basic text rolling to configurable column width

# ADR-001: Hybrid Parsing Architecture — Regex-First with Backend-Neutral Interface

## Status

Proposed

## Context

Lumpia needs to detect comment regions in source code across 40+ languages to wrap only wrappable text (comments, docstrings, markdown) while leaving code untouched. Two primary approaches exist:

1. **Pure TypeScript regex-based parsing**: Fast to implement, zero native dependencies, small bundle size (~0 overhead). Handles line comments (`//`, `#`, `--`, `;`) and block comments (`/* */`, `<!-- -->`, `""" """`) well. Regex-based parsing has been proven to support 60+ languages successfully in production extensions.

2. **Tree-sitter WASM**: Provides AST-level accuracy, handles edge cases (comments inside strings, template literals, nested blocks) perfectly. Adds ~2-5MB bundle size, requires async WASM initialization, and grammar management per language.

Production experience shows that regex-based parsing is sufficient for the core use case. However, tricky edge cases (e.g., comment-like text inside string literals) can produce incorrect results.

### Constraints

- Must work on Windows and macOS VS Code
- Must support VS Code Web/Remote eventually
- Aggressive timeline (13 weeks for MVP)
- Bundle size matters for marketplace extensions

## Decision

**Adopt a backend-neutral parser interface with regex-based implementation first, tree-sitter WASM as optional accuracy mode later.**

### Core Interface

```typescript
interface WrappableRegion {
  range: { startLine: number; startCol: number; endLine: number; endCol: number };
  languageId: string;
  kind: 'line-comment' | 'block-comment' | 'doc-comment' | 'docstring' | 'markdown' | 'latex' | 'plaintext';
  prefix: string;           // e.g., "// ", "# ", " * "
  suffix?: string;          // e.g., " */" for block comments
  innerIndent: number;      // indent level of content within the comment
  contentRange: { startLine: number; endLine: number };
}

interface RegionProvider {
  getRegions(document: TextDocument, range: Range): WrappableRegion[];
}
```

### Phase 1 (M1-M3): `RegexRegionProvider`

- Pure TypeScript, zero dependencies
- Language definitions as data (comment markers, doc-comment patterns)
- Regex-based prefix/suffix matching per line
- Handles 95%+ of real-world cases

### Phase 2 (M4+): `TreeSitterRegionProvider` (optional)

- WASM-based, loaded lazily
- User opt-in via `lumpia.parserBackend: "tree-sitter"`
- Validates/replaces regex results for complex files
- Only loaded when enabled

## Consequences

### Positive

- Ship fast with zero native dependencies
- Small bundle size for Phase 1
- Backend swap is invisible to the wrapping engine
- Tree-sitter can be added incrementally, per-language
- Works in VS Code Web without WASM complications initially

### Negative

- Regex parsing has known blind spots (comments in strings, template literals)
- Must maintain language definitions as data (markers, patterns)
- Tree-sitter integration deferred means some edge cases won't be fixed until Phase 2

### Risks

- If regex parsing proves insufficient for key languages earlier than expected, tree-sitter work may need to be pulled forward
- The interface must be designed carefully to accommodate both backends without leaking abstraction

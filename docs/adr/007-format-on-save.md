# ADR-007: Format-on-Save Integration Strategy

## Status

Proposed

## Context

Users want Lumpia to optionally wrap comments when saving a file, integrated with VS Code's format-on-save workflow. This is a novel feature for comment wrapping extensions.

### Challenges

- VS Code's `editor.formatOnSave` triggers registered `DocumentFormattingEditProvider` implementations
- Multiple formatters can conflict when several are registered for the same language
- Wrapping the entire document on save could be slow for large files
- Users may not want ALL comments wrapped — only ones they've edited
- Must never modify code, only wrappable regions

## Decision

### Register as a DocumentFormattingEditProvider (opt-in)

```jsonc
{
  "lumpia.formatOnSave": false,        // opt-in, disabled by default
  "lumpia.formatOnSave.scope": "all"   // "all" | "changed" | "selection"
}
```

### Scoping options

1. **`all`** — Wrap all comments in the document (whole-document pass)
2. **`changed`** — Only wrap comments that contain lines modified since last save (uses VS Code's dirty diff)
3. **`selection`** — Only wrap if there's an active selection (niche use case)

### Implementation approach

1. Register `DocumentFormattingEditProvider` when `lumpia.formatOnSave` is enabled
2. On format request, detect all wrappable regions in the document
3. For each region, wrap content and compare with original
4. Only emit `TextEdit` for regions that actually changed (no-op preservation)
5. Return edits to VS Code's formatting pipeline

### Safety constraints

1. **Opt-in only** — never format on save unless explicitly enabled
2. **No-op preservation** — if wrapping produces identical text, emit no edit
3. **Respect formatter ordering** — VS Code runs formatters sequentially; Lumpia should run after code formatters to wrap comments that may have been reflowed by code formatting
4. **Performance bound** — skip format-on-save for files exceeding configurable line limit (default 10,000)
5. **Dry-run logging** — in debug mode, log what would be changed without applying

### Interaction with other settings

- `lumpia.formatOnSave` is independent of `lumpia.autoWrap.enabled`
- Both can be active simultaneously (auto-wrap for typing, format-on-save as a final pass)
- Column resolution follows the same precedence as manual wrapping (ADR-004)

## Consequences

### Positive

- Fills a gap in existing comment wrapping tools
- Integrates with VS Code's native formatting pipeline
- "Changed" scope avoids touching code you didn't edit
- No-op preservation prevents meaningless diffs

### Negative

- Another formatter in the pipeline may slow save
- "All" scope may produce large diffs if comments were never wrapped before
- Users may not realize Lumpia is modifying their files on save (mitigated by opt-in default)
- Interaction with other formatters needs careful testing

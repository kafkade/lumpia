# ADR-004: Configuration Resolution and Column Precedence

## Status

Proposed

## Context

Multiple settings can influence the target wrapping column:

- `lumpia.column` (global setting)
- Per-language `lumpia.column` override
- VS Code `editor.rulers` (visual guides)
- The `lumpia.rollAtColumn` command (one-off override)
- Opinionated mode defaults (future)
- Repeated invocation ruler cycling

Without clear precedence, these settings conflict unpredictably. Users need a clear, documented precedence model they can rely on.

## Decision

### Column resolution precedence (highest to lowest)

1. **Explicit command argument** — `lumpia.rollAtColumn` prompt value
2. **Ruler cycling state** — if the user has pressed Alt+R multiple times to cycle through rulers, use the currently selected ruler (per-document, per-session)
3. **Language-specific `lumpia.column`** — from `[language]` section in settings
4. **Global `lumpia.column`** — workspace or user setting
5. **`editor.rulers`** — first ruler value from VS Code settings (or first language-specific ruler)
6. **`editor.wordWrapColumn`** — VS Code's built-in word wrap column
7. **Default: 80**

### Ruler cycling behavior

When multiple `editor.rulers` are configured and `lumpia.column` is **not** set:

- First invocation: wrap to the first ruler
- Second invocation (same document, same session): wrap to the second ruler
- Continue cycling through all rulers
- A ruler value of `0` means "unwrap" (infinite column)
- The selected ruler is remembered per-document for the session

### Per-language settings model

```jsonc
{
  // Global
  "lumpia.column": 80,

  // Language-specific
  "[python]": {
    "lumpia.column": 79,
    "lumpia.doubleSentenceSpacing": true
  },
  "[javascript]": {
    "lumpia.column": 100
  }
}
```

### Full settings schema

| Setting | Type | Default | Scope |
|---------|------|---------|-------|
| `lumpia.column` | number | 80 | resource |
| `lumpia.wholeComment` | boolean | true | resource |
| `lumpia.doubleSentenceSpacing` | boolean | false | resource |
| `lumpia.autoWrap.enabled` | boolean | false | resource |
| `lumpia.autoWrap.notification` | "icon" \| "text" | "icon" | window |
| `lumpia.reformat` | boolean | false | resource |
| `lumpia.opinionated` | boolean | false | resource |
| `lumpia.parserBackend` | "regex" \| "tree-sitter" | "regex" | window |

## Consequences

### Positive

- Clear, documented precedence eliminates user confusion
- Intuitive behavior that matches common expectations for wrapping extensions
- Per-language settings use VS Code's native `[language]` mechanism
- Ruler cycling provides quick column switching without settings changes

### Negative

- Complex precedence chain requires careful implementation and testing
- Ruler cycling state is ephemeral (per-session) — may surprise users who expect persistence
- Some settings interact in non-obvious ways (e.g., opinionated mode vs explicit column)

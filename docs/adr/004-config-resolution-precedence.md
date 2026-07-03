# ADR-004: Configuration Resolution and Column Precedence

## Status

Accepted

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

Per-language overrides require VS Code's `language-overridable` scope (a
resource-level scope that additionally participates in `[language]` sections).
A plain `resource` scope is settable per folder but is **not** applied inside
`[language]` blocks, and `window` scope ignores both.

| Setting                        | Type                     | Default | Scope                | Implemented |
| ------------------------------ | ------------------------ | ------- | -------------------- | ----------- |
| `lumpia.column`                | number                   | 80      | language-overridable | yes         |
| `lumpia.reformat`              | boolean                  | false   | language-overridable | yes         |
| `lumpia.wholeComment`          | boolean                  | true    | language-overridable | yes         |
| `lumpia.doubleSentenceSpacing` | boolean                  | false   | language-overridable | not yet     |
| `lumpia.autoWrap.enabled`      | boolean                  | false   | language-overridable | not yet     |
| `lumpia.autoWrap.notification` | "icon" \| "text"         | "icon"  | window               | not yet     |
| `lumpia.opinionated`           | boolean                  | false   | language-overridable | not yet     |
| `lumpia.parserBackend`         | "regex" \| "tree-sitter" | "regex" | window               | not yet     |

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

# ADR-008: Opinionated Wrapping Defaults

## Status

Proposed

## Context

Users want a "just works" mode where Lumpia automatically determines the best wrapping column and behavior per language, applying consistent formatting without configuration.

Currently, column width is user-configured. But different language communities have strong conventions:

| Language | Convention | Source |
|----------|-----------|--------|
| Python | 79 (code), 72 (docstrings) | PEP 8 |
| Rust | 100 | rustfmt default |
| Go | no hard wrap convention | gofmt |
| JavaScript/TypeScript | 80 or 100 | Community standard |
| Java | 80-120 | Google Java Style: 100 |
| C/C++ | 80 | Google C++ Style |
| Ruby | 80 | RuboCop default |
| Markdown | 80 | CommonMark convention |
| Git commit messages | 72 (body) | Git convention |

## Decision

### Add `lumpia.opinionated` mode (default: false)

When enabled, Lumpia applies community-standard wrapping conventions per language without requiring manual configuration.

### Behavior when opinionated mode is on

1. **Column width** — automatically set per language based on community convention
2. **Double sentence spacing** — off everywhere (modern convention)
3. **Whole comment** — true (wrap entire comment blocks)
4. **Reformat** — true (normalize prefix spacing)
5. **Doc comment handling** — language-appropriate (JSDoc for JS/TS, docstrings for Python, etc.)

### Precedence

Opinionated defaults are **lower priority** than explicit user settings:

1. Explicit `lumpia.column` (global or per-language) → user wins
2. Ruler → user wins
3. Opinionated default → applied if no explicit setting
4. Fallback 80

### Built-in convention table

```typescript
const OPINIONATED_COLUMNS: Record<string, number> = {
  python: 79,
  rust: 100,
  go: 80,
  javascript: 80,
  typescript: 80,
  java: 100,
  c: 80,
  cpp: 80,
  csharp: 100,
  ruby: 80,
  markdown: 80,
  latex: 80,
  'git-commit': 72,
  // ... more languages
};
```

### Non-goal

Opinionated mode does NOT auto-format code. It only affects comment/text wrapping behavior. Code formatting remains the responsibility of language-specific formatters.

## Consequences

### Positive

- Zero-config experience for most users
- Encourages community-standard formatting
- Reduces "what column should I use?" decision fatigue
- Still overridable for teams with custom conventions

### Negative

- Convention choices are inherently subjective
- Some users may disagree with the defaults
- Must maintain the convention table as standards evolve
- "Opinionated" framing may deter users who want full control

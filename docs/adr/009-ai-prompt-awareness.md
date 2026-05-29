# ADR-009: AI/Prompt-Aware Wrapping

## Status

Proposed

## Context

AI-assisted coding tools (GitHub Copilot, ChatGPT, Claude) generate comments, docstrings, and prompt/response blocks that have specific formatting expectations. Users working with AI tools need wrapping that understands these patterns.

### Concrete scenarios

1. **Copilot-generated comments** — may contain structured content (lists, code refs) that should wrap cleanly
2. **Prompt blocks in comments** — developers store AI prompts in comments with markers like `// prompt:`, `// AI:`, `@ai`, etc.
3. **Fenced AI blocks** — ` ```prompt `, ` ```copilot `, ` ```ai ` code fences that should be preserved verbatim
4. **`.github/copilot-instructions.md`** — Markdown file that should wrap like any other Markdown document
5. **Inline chat context** — Copilot inline chat generates edits that may need wrapping

### What this is NOT

This ADR does not propose deep Copilot API integration (e.g., hooking into Copilot's generation pipeline). Such APIs are not publicly stable. Instead, this focuses on wrapping behavior that is **Copilot-friendly** — recognizing and respecting AI-related content patterns.

## Decision

### 1. Preserve AI-marker fenced blocks

Add these to the list of preserved (never-wrapped) code fence languages:

- ` ```prompt `
- ` ```copilot `
- ` ```ai `
- ` ```system `
- ` ```user `
- ` ```assistant `

This is purely additive — these are treated like any other code fence.

### 2. Custom preserved-block markers (configurable)

```jsonc
{
  "lumpia.preserveBlocks": ["prompt", "copilot", "ai", "system", "user", "assistant"]
}
```

Users can add custom markers for their own AI workflows.

### 3. AI-tagged comment handling

Comments starting with specific tags are wrapped as paragraphs but preserve the tag:

- `// AI:` → wraps content, preserves `// AI:` prefix
- `// prompt:` → same
- `// @ai` → same

These are detected as doc-tag-like blocks with hanging indent.

### 4. Markdown file support is automatic

Files like `.github/copilot-instructions.md` are Markdown — Lumpia's Markdown wrapping handles them naturally. No special AI-specific logic needed.

### 5. No deep Copilot API integration in V1

Copilot's extension APIs for inline chat and completions are not stable or documented for third-party use. We will not attempt to hook into these. If stable APIs become available, a future ADR can address integration.

## Consequences

### Positive

- Handles the concrete use cases developers actually encounter
- Minimal implementation overhead (mostly configuration and block detection)
- Configurable for custom AI workflows
- Does not depend on unstable APIs

### Negative

- "AI-aware" marketing may overpromise relative to actual functionality
- Custom markers add configuration surface area
- AI comment patterns may evolve rapidly, requiring updates

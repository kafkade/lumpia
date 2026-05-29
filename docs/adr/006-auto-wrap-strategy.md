# ADR-006: Auto-Wrap Implementation Strategy

## Status

Proposed

## Context

Traditional auto-wrap implementations only break the current line when the cursor passes the wrapping column. They do **not** reflow the entire paragraph — only the current line.

Users want Lumpia's auto-wrap to be smarter:

- Context-aware (only inside comments, not code)
- Handles the current line AND optionally reflows the paragraph
- Debounced to avoid jitter
- Safe — never corrupts code

### Constraints

- Must use `vscode.workspace.onDidChangeTextDocument` (no direct keystroke access)
- Must not trigger on paste, undo/redo, or formatter changes
- Must be opt-in (disabled by default)
- Must respect the same column resolution as manual wrapping
- Must work with multiple cursors

## Decision

### Core approach: Document change listener with safety checks

```typescript
// Pseudocode
onDidChangeTextDocument(event) {
  if (!autoWrapEnabled) return;
  if (event.reason === TextDocumentChangeReason.Undo) return;
  if (event.reason === TextDocumentChangeReason.Redo) return;

  for (const change of event.contentChanges) {
    // Only trigger on single-character insertions (typing)
    if (change.text.length > 1 && change.text !== '\n') continue;

    const line = document.lineAt(change.range.start.line);
    if (displayWidth(line.text) <= column) continue;

    // Check if cursor is inside a wrappable region
    const region = regionProvider.getRegionAt(document, change.range.start);
    if (!region) continue;

    // Wrap the current line only (not the whole paragraph)
    wrapCurrentLine(editor, line, region, column);
  }
}
```

### Safety constraints (hard rules)

1. **Only activate inside recognized wrappable regions** — never on code lines
2. **Only trigger on single-character insertions or Enter** — not paste, format, undo/redo
3. **Debounce 50ms** — avoid rapid consecutive wraps
4. **Never modify lines other than the current line** (in basic mode)
5. **No-op if wrapping would produce identical text**
6. **Respect VS Code's `editor.formatOnType` setting** — don't conflict
7. **Maximum line limit** — don't process if document exceeds configurable limit (default 10,000 lines)

### Enhanced mode (opt-in): paragraph reflow

A `lumpia.autoWrap.reflow` setting enables full paragraph reflow on the current paragraph when auto-wrap triggers. This is more aggressive but produces cleaner results.

### Status bar indicator

Show auto-wrap state in the status bar:

- 🟢 Enabled (from settings)
- ⚪ Disabled (from settings)
- 🟠 Temporarily enabled (toggle command)
- 🔘 Temporarily disabled (toggle command)

### Toggle command

`lumpia.toggleAutoWrap` — toggles auto-wrap for the current document (per-session, not persisted).

## Consequences

### Positive

- Safe by default — opt-in, comment-only, single-char triggers
- Familiar, intuitive behavior for users of wrapping tools
- Enhanced reflow mode goes beyond basic line-breaking
- Clear visual feedback via status bar

### Negative

- Document change listener fires frequently — must be very efficient
- Edge cases with multi-cursor editing
- Debouncing may feel laggy to fast typists
- Enhanced reflow mode may produce unexpected changes for users new to auto-wrap

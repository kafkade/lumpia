# ADR-003: Comment Prefix Detection and Normalization Strategy

## Status

Accepted

## Context

When wrapping text inside comments, Lumpia must:

1. **Detect** the comment prefix on each line (e.g., `// `, `# `, ` * `, `/// `)
2. **Strip** the prefix before wrapping the content
3. **Re-apply** the prefix after wrapping
4. **Handle variations** (different indentation levels, inconsistent spacing, doc-comment markers)

This is the core challenge that separates a text wrapper from a comment-aware wrapper.

### Examples of prefix complexity

```javascript
// Simple line comment
//   Indented content
//
// New paragraph

/**
 * Block comment with leading asterisk
 * @param name - Description that
 *   wraps across lines
 */

/// Triple-slash doc comment
/// with continuation
```

```python
# Hash comment
#   Indented content

"""
Docstring that may or may not
have consistent indentation
"""
```

## Decision

### 1. Prefix detection uses the first non-blank content line as reference

For a contiguous comment block, the prefix is determined by the first line that contains actual text content. Subsequent lines are expected to share the same prefix pattern (with possible indentation variation).

### 2. Prefix is split into: indent + marker + spacing

```typescript
interface CommentPrefix {
  indent: string;    // Leading whitespace before the marker ("    ")
  marker: string;    // The comment marker itself ("//", "#", "*", "///")
  spacing: string;   // Whitespace between marker and content (" ", "  ")
}
```

### 3. Block comments detect body prefix separately from open/close

For block comments (`/* ... */`), the opening and closing lines are treated as decoration (not wrapped), and body lines have their own prefix pattern (typically ` * `).

### 4. Normalization on output respects `reformat` setting

- **reformat: false** (default): Preserve original prefix exactly as found
- **reformat: true**: Normalize prefix to canonical form (single space after marker)

### 5. Indented continuation lines preserve relative indent

When content inside a comment is indented (e.g., list items, code examples), the relative indentation from the comment prefix is preserved:

```javascript
// This is a paragraph that wraps
// normally across lines.
//
// - This is a list item that also
//   wraps, preserving the 2-space
//   indent of continuation lines.
```

## Consequences

### Positive

- Handles the most common prefix patterns reliably
- Preserves existing formatting when reformat is off
- Can normalize inconsistent prefixes when reformat is on
- Block comment handling isolates decoration from content

### Negative

- Edge cases with mixed indentation (tabs + spaces) require special handling
- Some languages have unusual comment styles that may not fit the model cleanly

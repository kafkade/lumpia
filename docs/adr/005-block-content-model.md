# ADR-005: Block-Based Content Model for Wrapping

## Status

Proposed

## Context

Lumpia's core value is not just wrapping text — it's understanding the **structure** of text inside comments and documents. A comment may contain markdown-like content: paragraphs, lists, code blocks, headings, blockquotes, and doc tags.

Lumpia's current `rollText` function treats all text as flat paragraphs separated by blank lines. This is insufficient for:

- Markdown lists (should preserve indent, not reflow into paragraphs)
- Fenced code blocks (should never be wrapped)
- Headings (should stay on one line)
- Doc tags like `@param`, `@returns` (should wrap with hanging indent)
- Blockquotes (should preserve `>` prefix)
- Trailing double-space line breaks (should be preserved)

## Decision

### Adopt a block-based content model

Before wrapping, comment content is parsed into a sequence of typed blocks:

```typescript
type ContentBlock =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'list-item'; marker: string; indent: number; lines: string[] }
  | { type: 'code-fence'; lines: string[] }         // never wrapped
  | { type: 'indented-code'; lines: string[] }       // never wrapped
  | { type: 'heading'; line: string }                 // never wrapped
  | { type: 'blockquote'; prefix: string; blocks: ContentBlock[] }
  | { type: 'doc-tag'; tag: string; lines: string[] } // wrapped with hanging indent
  | { type: 'blank-line' }
  | { type: 'preserved-break'; line: string }          // trailing double-space
  | { type: 'table'; lines: string[] }                 // never wrapped
```

### Wrapping rules per block type

| Block Type | Wrapped? | Behavior |
|-----------|----------|----------|
| paragraph | Yes | Greedy fill to column |
| list-item | Yes | Wrap with hanging indent matching marker width |
| code-fence | No | Pass through verbatim |
| indented-code | No | Pass through verbatim |
| heading | No | Pass through verbatim |
| blockquote | Yes | Recursively wrap inner blocks, preserve `>` prefix |
| doc-tag | Yes | Wrap with hanging indent aligned past tag + name |
| blank-line | No | Preserved as paragraph separator |
| preserved-break | No | Line ending with `  ` (double space) keeps its break |
| table | No | Pass through verbatim |

### Content detection is best-effort

Comment content is parsed as markdown-ish (not strict CommonMark). The goal is to recognize common patterns, not to be a full markdown parser. Unrecognized content is treated as a paragraph.

## Consequences

### Positive

- Handles the structures that matter most to users
- Code examples in comments are never corrupted
- Doc tags wrap intelligently with hanging indent
- Lists maintain their structure
- Model is extensible (new block types can be added)

### Negative

- More complex than flat paragraph splitting
- Edge cases between "is this a list or a paragraph?" require heuristics
- Blockquote nesting adds recursive complexity
- Must be integrated into the wrapping engine from the start (not bolted on later)

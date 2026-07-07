# Lumpia 🥟

Idiomatically roll text to a specific line width — like a perfectly rolled lumpia.

Unlike your editor's soft wrap, Lumpia actually reshapes your text by inserting line breaks at the right column — respecting comments, paragraph boundaries, and structure. We call it *rolling* because, well, that's what you do with lumpia. 🥟

## Features

- Roll selected text or the current line to a configurable column width
- Preserves paragraph boundaries
- Whole-document wrapping: select all (`Ctrl+A`) then `Alt+R` to wrap **only comments** in code files, leaving code untouched — Markdown and plaintext files wrap every paragraph
- Keybinding: `Alt+R`

## Configuration

| Setting                        | Default | Description                                                                                                  |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------ |
| `lumpia.column`                | `80`    | The column at which to roll text.                                                                            |
| `lumpia.reformat`              | `false` | Normalize comment prefix spacing to a single space after the marker.                                         |
| `lumpia.wholeComment`          | `true`  | When `true`, an empty cursor wraps the entire comment block; when `false`, wraps only the current paragraph. |
| `lumpia.doubleSentenceSpacing` | `false` | Insert two spaces after sentence-ending punctuation (`.`, `?`, `!`) while wrapping.                          |

### Per-language settings

Every Lumpia setting supports VS Code's native `[language]` overrides, so you
can tune wrapping per language. Language-specific values take precedence over
the global value:

```jsonc
{
  "lumpia.column": 80,
  "[python]": {
    "lumpia.column": 79,
    "lumpia.reformat": true
  },
  "[javascript]": {
    "lumpia.column": 100
  }
}
```

## Usage

1. Place your cursor on a line, or select text
2. Press `Alt+R` (or run **Lumpia: Roll Text** from the command palette)
3. Text is rolled to the configured column width

### Whole-document wrapping

Select the entire document (`Ctrl+A`) and press `Alt+R` to wrap the whole file
at once. In code files only comments and docstrings are rolled — your code is
never modified. In Markdown and plaintext files every paragraph is wrapped. In
LaTeX files (`.tex`, `.sty`, `.cls`) prose paragraphs are wrapped while
commands, environments, math, verbatim blocks, and comments are preserved.

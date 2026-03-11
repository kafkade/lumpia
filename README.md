# Lumpia 🥟

Idiomatically roll text to a specific line width — like a perfectly rolled lumpia.

Unlike your editor's soft wrap, Lumpia actually reshapes your text by inserting line breaks at the right column — respecting comments, paragraph boundaries, and structure. We call it *rolling* because, well, that's what you do with lumpia. 🥟

## Features

- Roll selected text or the current line to a configurable column width
- Preserves paragraph boundaries
- Keybinding: `Alt+R`

## Configuration

| Setting         | Default | Description                       |
| --------------- | ------- | --------------------------------- |
| `lumpia.column` | `80`    | The column at which to roll text. |

## Usage

1. Place your cursor on a line, or select text
2. Press `Alt+R` (or run **Lumpia: Roll Text** from the command palette)
3. Text is rolled to the configured column width

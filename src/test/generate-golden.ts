/**
 * Generate golden fixture files.
 *
 * Usage:  npx tsx src/test/generate-golden.ts
 *
 * Creates .input.txt, .expected.txt, and .meta.json files under
 * src/test/fixtures/ by running rollText on each defined input.
 */

import { rollText } from "../engine/wrapper";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

interface FixtureDef {
  category: string;
  name: string;
  input: string;
  column?: number;
  tabWidth?: number;
}

const fixtures: FixtureDef[] = [
  // ═══════════════════════════════════════════════════════════════════
  // typescript/ — inner content from TS/JS comments
  // ═══════════════════════════════════════════════════════════════════
  {
    category: "typescript",
    name: "line-comment-simple",
    column: 40,
    input:
      "This is a long comment that describes a function and needs to be wrapped at the target column width",
  },
  {
    category: "typescript",
    name: "line-comment-multiline",
    column: 40,
    input:
      "First line of\nthe comment that\ncontinues here and should be reflowed into proper paragraphs",
  },
  {
    category: "typescript",
    name: "jsdoc-param",
    column: 60,
    input:
      "@param name The name of the user that will be displayed in the greeting message and also logged to the console",
  },
  {
    category: "typescript",
    name: "jsdoc-returns",
    column: 60,
    input:
      "@returns The formatted greeting string containing the user name and the current date and time information",
  },
  {
    category: "typescript",
    name: "jsdoc-mixed",
    column: 60,
    input: [
      "Creates a personalized greeting message for the user.",
      "The message includes the current time and locale info.",
      "",
      "@param name The user's full name as entered in the form",
      "@param locale The locale string for date formatting",
      "@returns The formatted greeting string",
    ].join("\n"),
  },
  {
    category: "typescript",
    name: "jsdoc-with-types",
    column: 60,
    input:
      "@param {string} userName The name of the user that will be displayed in the greeting and logged to the console for debugging",
  },
  {
    category: "typescript",
    name: "block-comment-prose",
    column: 60,
    input: [
      "This module provides utility functions for string manipulation.",
      "It includes helpers for truncation, padding, and case conversion.",
      "All functions are pure and do not modify their inputs.",
    ].join("\n"),
  },
  {
    category: "typescript",
    name: "todo-comment",
    column: 60,
    input:
      "TODO: Implement the user authentication flow with OAuth2 and refresh tokens, including proper error handling for expired sessions",
  },
  {
    category: "typescript",
    name: "link-in-comment",
    column: 40,
    input:
      "See the documentation at https://example.com/docs/api/v2/authentication for more details about the auth flow",
  },
  {
    category: "typescript",
    name: "already-wrapped",
    column: 80,
    input: "This line is already short enough.\nNo wrapping needed here.",
  },

  // ═══════════════════════════════════════════════════════════════════
  // python/ — inner content from Python comments and docstrings
  // ═══════════════════════════════════════════════════════════════════
  {
    category: "python",
    name: "hash-comment-simple",
    column: 40,
    input:
      "Calculate the fibonacci number for the given input value using dynamic programming",
  },
  {
    category: "python",
    name: "hash-comment-multiline",
    column: 40,
    input:
      "This function takes\na list of integers and\nreturns the sum of all positive values in the list",
  },
  {
    category: "python",
    name: "docstring-prose",
    column: 60,
    input: [
      "A utility module for processing CSV files.",
      "Handles encoding detection, delimiter inference,",
      "and streaming reads for large files.",
    ].join("\n"),
  },
  {
    category: "python",
    name: "docstring-params",
    column: 60,
    input: [
      "Process a batch of records from the input queue.",
      "",
      "@param records The list of record objects to process in this batch iteration",
      "@param timeout Maximum time in seconds to wait for each record to be processed",
      "@returns The number of successfully processed records",
    ].join("\n"),
  },
  {
    category: "python",
    name: "docstring-mixed",
    column: 60,
    input: [
      "Calculate the moving average of a time series.",
      "",
      "Uses a sliding window approach with configurable",
      "window size and optional weighting.",
      "",
      "@param data The input time series data points",
      "@param window_size Size of the sliding window",
      "@returns List of computed moving average values",
    ].join("\n"),
  },
  {
    category: "python",
    name: "docstring-code-example",
    column: 60,
    input: [
      "Parse a date string into a datetime object.",
      "",
      "Example usage:",
      "",
      "```python",
      "dt = parse_date('2024-01-15')",
      "print(dt.year)  # 2024",
      "```",
      "",
      "Supports ISO 8601 and common US date formats.",
    ].join("\n"),
  },
  {
    category: "python",
    name: "numpy-style",
    column: 60,
    input: [
      "Compute the cross-correlation between two signals.",
      "",
      "Parameters",
      "----------",
      "signal_a : array_like",
      "    The first input signal for cross-correlation analysis",
      "signal_b : array_like",
      "    The second input signal for cross-correlation analysis",
      "",
      "Returns",
      "-------",
      "result : ndarray",
      "    The cross-correlation result array with normalized values",
    ].join("\n"),
  },
  {
    category: "python",
    name: "hash-comment-noop",
    column: 80,
    input: "Short comment.",
  },
  {
    category: "python",
    name: "sphinx-refs",
    column: 60,
    input:
      "See :class:`UserManager` and :func:`create_user` for details on how user accounts are created and managed in the system",
  },
  {
    category: "python",
    name: "multiline-string",
    column: 60,
    input: [
      "This is the content of a triple-quoted string.",
      "It spans multiple lines and should be reflowed",
      "to fit within the target column width properly.",
    ].join("\n"),
  },

  // ═══════════════════════════════════════════════════════════════════
  // rust/ — inner content from Rust doc comments
  // ═══════════════════════════════════════════════════════════════════
  {
    category: "rust",
    name: "doc-simple",
    column: 60,
    input:
      "Creates a new instance of the connection pool with the specified maximum number of connections and timeout duration",
  },
  {
    category: "rust",
    name: "doc-code-example",
    column: 60,
    input: [
      "Parses a configuration file from the given path.",
      "",
      "# Examples",
      "",
      "```rust",
      'let config = Config::from_file("app.toml")?;',
      'assert_eq!(config.port, 8080);',
      "```",
      "",
      "Returns an error if the file does not exist or contains invalid TOML syntax.",
    ].join("\n"),
  },
  {
    category: "rust",
    name: "doc-list",
    column: 60,
    input: [
      "Supported output formats:",
      "",
      "- JSON: The default format for API responses",
      "- YAML: Used for configuration file generation",
      "- TOML: An alternative configuration format",
      "- XML: Legacy format for backward compatibility with older systems",
    ].join("\n"),
  },
  {
    category: "rust",
    name: "doc-heading",
    column: 60,
    input: [
      "# Connection Pool",
      "",
      "Manages a pool of database connections.",
      "Connections are lazily initialized and",
      "returned to the pool after use.",
      "",
      "# Panics",
      "",
      "Panics if the pool size is zero.",
    ].join("\n"),
  },
  {
    category: "rust",
    name: "doc-mixed",
    column: 60,
    input: [
      "Validates and processes the input configuration.",
      "",
      "# Arguments",
      "",
      "- `path` - Path to the config file on disk",
      "- `strict` - Whether to reject unknown keys in the config",
      "",
      "# Examples",
      "",
      "```",
      'let result = process("config.toml", true);',
      "```",
    ].join("\n"),
  },
  {
    category: "rust",
    name: "doc-links",
    column: 60,
    input:
      "See [Config](struct.Config.html) and [Builder](struct.Builder.html) for more information about the configuration API and its builder pattern interface",
  },
  {
    category: "rust",
    name: "inner-doc",
    column: 60,
    input: [
      "This crate provides async-aware database connection pooling.",
      "It supports PostgreSQL, MySQL, and SQLite backends",
      "with automatic connection health checking.",
    ].join("\n"),
  },
  {
    category: "rust",
    name: "doc-noop",
    column: 80,
    input: "Returns the current count.",
  },

  // ═══════════════════════════════════════════════════════════════════
  // ruby/ — inner content from Ruby comments (# and =begin/=end)
  // ═══════════════════════════════════════════════════════════════════
  {
    category: "ruby",
    name: "line-comment-simple",
    column: 40,
    input:
      "Memoize the computed digest so repeated calls avoid rehashing the same payload",
  },
  {
    category: "ruby",
    name: "line-comment-multiline",
    column: 40,
    input:
      "This method takes\na collection of records and\nreturns only the ones matching the active scope",
  },
  {
    category: "ruby",
    name: "block-comment-prose",
    column: 60,
    input: [
      "A small helper module for formatting currency values.",
      "It handles locale-aware separators, rounding modes,",
      "and optional symbol placement before or after the amount.",
    ].join("\n"),
  },
  {
    category: "ruby",
    name: "rdoc-list",
    column: 60,
    input: [
      "Supported serialization formats:",
      "",
      "- JSON: the default format used for API responses",
      "- YAML: used for human-editable configuration files",
      "- Marshal: a compact binary format for internal caching only",
    ].join("\n"),
  },
  {
    category: "ruby",
    name: "hash-comment-noop",
    column: 80,
    input: "Returns the frozen configuration hash.",
  },
  {
    category: "ruby",
    name: "block-comment-noop",
    column: 40,
    input: "Parses the manifest file and returns a\nvalidated config object.",
  },

  // ═══════════════════════════════════════════════════════════════════
  // markdown/ — pure Markdown documents
  // ═══════════════════════════════════════════════════════════════════
  {
    category: "markdown",
    name: "paragraph-simple",
    column: 40,
    input:
      "This is a single paragraph of text that should be wrapped at the specified column width boundary",
  },
  {
    category: "markdown",
    name: "paragraph-multiple",
    column: 40,
    input: [
      "First paragraph has some words that need wrapping to the column.",
      "",
      "Second paragraph is separate and also needs to be wrapped independently.",
    ].join("\n"),
  },
  {
    category: "markdown",
    name: "heading-preserve",
    column: 40,
    input: [
      "# This is a heading that is quite long",
      "",
      "## Another heading for a subsection",
      "",
      "Some body text that follows.",
    ].join("\n"),
  },
  {
    category: "markdown",
    name: "list-bullets",
    column: 40,
    input: [
      "- First item in the list with a description that is quite long",
      "- Second item is shorter",
      "- Third item also has a long description that needs wrapping",
    ].join("\n"),
  },
  {
    category: "markdown",
    name: "list-numbered",
    column: 40,
    input: [
      "1. First numbered item with a longer description",
      "2. Second numbered item",
      "3. Third numbered item with details that extend past the column",
    ].join("\n"),
  },
  {
    category: "markdown",
    name: "list-mixed",
    column: 50,
    input: [
      "Shopping list for the project:",
      "",
      "- Apples for the fruit salad and pie",
      "- Bananas for smoothies and banana bread",
      "* Oranges for fresh juice",
      "",
      "1. Preheat the oven to the correct temperature",
      "2. Mix all ingredients together thoroughly",
    ].join("\n"),
  },
  {
    category: "markdown",
    name: "code-fence",
    column: 40,
    input: [
      "Here is an example:",
      "",
      "```javascript",
      "function greet(name) {",
      '  return `Hello, ${name}! Welcome to our application.`;',
      "}",
      "```",
      "",
      "The function returns a greeting string.",
    ].join("\n"),
  },
  {
    category: "markdown",
    name: "code-indented",
    column: 40,
    input: [
      "Example code:",
      "",
      "    function add(a, b) {",
      "      return a + b;",
      "    }",
      "",
      "This adds two numbers.",
    ].join("\n"),
  },
  {
    category: "markdown",
    name: "blockquote",
    column: 40,
    input: [
      "> This is a blockquote with text that should be wrapped within the quote prefix boundaries",
    ].join("\n"),
  },
  {
    category: "markdown",
    name: "blockquote-nested",
    column: 50,
    input: [
      "> Outer quote with some text here.",
      "> More outer text continues.",
      "",
      "> > Inner nested quote with additional text that is longer than the column width",
    ].join("\n"),
  },
  {
    category: "markdown",
    name: "table-preserve",
    column: 40,
    input: [
      "| Name   | Age | City      |",
      "|--------|-----|-----------|",
      "| Alice  | 30  | New York  |",
      "| Bob    | 25  | London    |",
    ].join("\n"),
  },
  {
    category: "markdown",
    name: "mixed-document",
    column: 60,
    input: [
      "# Project README",
      "",
      "This project provides a set of utilities for text processing and formatting.",
      "",
      "## Features",
      "",
      "- Word wrapping at configurable column widths with Unicode support",
      "- Paragraph detection and preservation of blank lines between sections",
      "- Code block preservation for fenced and indented code",
      "",
      "## Usage",
      "",
      "```bash",
      "npm install lumpia",
      "```",
      "",
      "Then import and use:",
      "",
      "```typescript",
      'import { rollText } from "lumpia";',
      "const wrapped = rollText(text, 80);",
      "```",
      "",
      "## Configuration",
      "",
      "| Option  | Default | Description          |",
      "|---------|---------|----------------------|",
      "| column  | 80      | Target column width  |",
      "",
      "> Note: All functions are pure and side-effect free.",
    ].join("\n"),
  },

  // ═══════════════════════════════════════════════════════════════════
  // edge-cases/ — CJK, emoji, tabs, long words, CRLF, etc.
  // ═══════════════════════════════════════════════════════════════════
  {
    category: "edge-cases",
    name: "cjk-text",
    column: 20,
    input: "这是一段中文文本需要在指定的列宽处进行换行",
  },
  {
    category: "edge-cases",
    name: "emoji-text",
    column: 20,
    input: "Hello 🌍 world 🎉 this is a test 🚀 with emoji",
  },
  {
    category: "edge-cases",
    name: "cjk-mixed",
    column: 30,
    input: "Hello世界 this is混合文本 with mixed内容 content here",
  },
  {
    category: "edge-cases",
    name: "long-word",
    column: 10,
    input: "short superlongwordthatcannotbebroken end",
  },
  {
    category: "edge-cases",
    name: "single-char-column",
    column: 1,
    input: "a b c d e",
  },
  {
    category: "edge-cases",
    name: "trailing-spaces",
    column: 40,
    input: "First line with hard break  \nSecond line continues here normally",
  },
  {
    category: "edge-cases",
    name: "tabs-in-content",
    column: 40,
    tabWidth: 4,
    input: "word1\tword2\tword3 and then some more text to wrap",
  },
  {
    category: "edge-cases",
    name: "empty-input",
    column: 80,
    input: "",
  },
  {
    category: "edge-cases",
    name: "whitespace-only",
    column: 80,
    input: "   ",
  },
  {
    category: "edge-cases",
    name: "long-url",
    column: 40,
    input:
      "Visit https://example.com/very/long/path/to/resource/that/exceeds/column for details",
  },
  {
    category: "edge-cases",
    name: "noop-short",
    column: 80,
    input: "Short.",
  },
  {
    category: "edge-cases",
    name: "noop-already-wrapped",
    column: 20,
    input: "hello world foo bar\nbaz qux quux corge\ngrault",
  },
  {
    category: "edge-cases",
    name: "noop-multi-paragraph",
    column: 40,
    input: "First short paragraph.\n\nSecond short paragraph.",
  },
  {
    category: "edge-cases",
    name: "noop-list-wrapped",
    column: 30,
    input: "- Item one fits here.\n- Item two as well.",
  },
  {
    category: "edge-cases",
    name: "noop-heading-and-text",
    column: 40,
    input: "# Title\n\nShort paragraph.",
  },
  {
    category: "edge-cases",
    name: "noop-code-fence",
    column: 30,
    input: "```\nvar x = 1;\n```",
  },
  {
    category: "edge-cases",
    name: "consecutive-blanks",
    column: 40,
    input: "First paragraph here.\n\n\n\nSecond paragraph here.",
  },
];

// ── Generate ─────────────────────────────────────────────────────────

const FIXTURES_DIR = join(__dirname, "fixtures");

let count = 0;
for (const f of fixtures) {
  const dir = join(FIXTURES_DIR, f.category);
  mkdirSync(dir, { recursive: true });

  const col = f.column ?? 80;
  const tw = f.tabWidth ?? 4;

  writeFileSync(join(dir, `${f.name}.input.txt`), f.input);

  const expected = rollText(f.input, col, { tabWidth: tw });
  writeFileSync(join(dir, `${f.name}.expected.txt`), expected);

  // Write meta only when non-default
  if (col !== 80 || tw !== 4) {
    const meta: Record<string, number> = {};
    if (col !== 80) meta.column = col;
    if (tw !== 4) meta.tabWidth = tw;
    writeFileSync(
      join(dir, `${f.name}.meta.json`),
      JSON.stringify(meta, null, 2) + "\n"
    );
  }

  count++;
}

console.log(`Generated ${count} fixture pairs in ${FIXTURES_DIR}`);

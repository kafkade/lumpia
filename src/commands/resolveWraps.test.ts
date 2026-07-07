import { describe, it, expect } from "vitest";
import {
  resolveWraps,
  expandToParagraph,
  type SelectionInfo,
} from "./resolveWraps";
import type { DocumentLike, TextRange } from "../parser/types";
import { UNWRAP_COLUMN } from "../config/resolveColumn";

// ── Helpers ──────────────────────────────────────────────────────────

function makeDoc(text: string, languageId = "typescript"): DocumentLike {
  const lines = text.split("\n");
  return {
    languageId,
    lineCount: lines.length,
    lineAt(line: number) {
      return lines[line];
    },
    getText(range?: TextRange) {
      if (!range) return text;
      return lines.slice(range.startLine, range.endLine + 1).join("\n");
    },
  };
}

function emptyCursor(line: number): SelectionInfo {
  return { startLine: line, endLine: line, isEmpty: true, activeLine: line };
}

function selection(startLine: number, endLine: number): SelectionInfo {
  return {
    startLine,
    endLine,
    isEmpty: false,
    activeLine: endLine,
  };
}

// ── Empty cursor in comment ──────────────────────────────────────────

describe("resolveWraps — empty cursor in comment", () => {
  it("wraps whole line-comment run", () => {
    const doc = makeDoc(
      [
        "function foo() {",
        "  // This is a very long comment that definitely needs to be wrapped at a reasonable column width",
        "  // Another line of the comment here",
        "  return 42;",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(1)], { column: 40 });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(1);
    expect(edits[0].endLine).toBe(2);
    // Output should have the // prefix on every line
    for (const line of edits[0].replacement.split("\n")) {
      expect(line).toMatch(/^\s*\/\/ /);
    }
  });

  it("wraps from block comment opener line", () => {
    const doc = makeDoc(
      [
        "/**",
        " * This is a very long doc comment that should be wrapped at the target column width boundary",
        " */",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 40 });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(1);
    expect(edits[0].endLine).toBe(1);
    for (const line of edits[0].replacement.split("\n")) {
      expect(line).toMatch(/^\s*\*/);
    }
  });

  it("wraps from block comment body line", () => {
    const doc = makeDoc(
      [
        "/**",
        " * First line of a long doc comment that needs wrapping because it exceeds the column width",
        " * Second line continues",
        " */",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(2)], { column: 40 });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(1);
    expect(edits[0].endLine).toBe(2);
  });

  it("wraps from block comment closer line", () => {
    const doc = makeDoc(
      [
        "/**",
        " * Long comment that needs wrapping at the target column width for readability",
        " */",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(2)], { column: 40 });
    expect(edits).toHaveLength(1);
  });

  it("wraps Python hash comments", () => {
    const doc = makeDoc(
      [
        "# This is a very long Python comment that should be wrapped at the target column width",
        "# continuation line",
        "x = 42",
      ].join("\n"),
      "python"
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 40 });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(0);
    expect(edits[0].endLine).toBe(1);
    for (const line of edits[0].replacement.split("\n")) {
      expect(line).toMatch(/^# /);
    }
  });
});

// ── Empty cursor on code ─────────────────────────────────────────────

describe("resolveWraps — empty cursor on code", () => {
  it("produces no edits for cursor on code line", () => {
    const doc = makeDoc(
      [
        "function foo() {",
        "  return 42;",
        "}",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(1)], { column: 40 });
    expect(edits).toHaveLength(0);
  });

  it("produces no edits for cursor on blank line between comments", () => {
    const doc = makeDoc(
      [
        "// first comment",
        "",
        "// second comment",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(1)], { column: 40 });
    expect(edits).toHaveLength(0);
  });

  it("produces no edits for cursor on import statement", () => {
    const doc = makeDoc(
      [
        'import { foo } from "bar";',
        "// a comment",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 40 });
    expect(edits).toHaveLength(0);
  });
});

// ── Selection within single comment ──────────────────────────────────

describe("resolveWraps — selection within comment", () => {
  it("wraps only selected lines of a comment", () => {
    const doc = makeDoc(
      [
        "// line one short",
        "// This is a very long line two that needs wrapping at the target column width",
        "// line three is also a very long comment that goes past the column width boundary",
        "// line four short",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [selection(1, 2)], { column: 40 });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(1);
    expect(edits[0].endLine).toBe(2);
  });

  it("wraps selected lines within block comment body", () => {
    const doc = makeDoc(
      [
        "/**",
        " * Short first line.",
        " * This is a very long second line that exceeds the column width and needs wrapping",
        " * Short third line.",
        " */",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [selection(2, 2)], { column: 40 });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(2);
    expect(edits[0].endLine).toBe(2);
  });
});

// ── Selection spanning multiple comments ─────────────────────────────

describe("resolveWraps — selection spanning multiple comments", () => {
  it("wraps each comment independently", () => {
    const doc = makeDoc(
      [
        "// First comment that is very long and needs wrapping at a narrow column width",
        "function foo() {}",
        "// Second comment that is also very long and should be wrapped independently",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [selection(0, 2)], { column: 40 });
    expect(edits).toHaveLength(2);
    expect(edits[0].startLine).toBe(0);
    expect(edits[1].startLine).toBe(2);
  });
});

// ── Selection spanning code + comments ───────────────────────────────

describe("resolveWraps — selection spanning code + comments", () => {
  it("wraps comments only, leaves code untouched", () => {
    const doc = makeDoc(
      [
        "// A comment that is long enough to need wrapping at a narrow column width",
        "function foo() {",
        "  const x = 1 + 2 + 3 + 4 + 5;",
        "  // Inner comment also long enough to need wrapping at the target width",
        "  return x;",
        "}",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [selection(0, 5)], { column: 40 });
    // Should produce edits for the two comment regions only
    expect(edits).toHaveLength(2);
    // Code lines should not appear in any edit range
    for (const edit of edits) {
      for (let i = edit.startLine; i <= edit.endLine; i++) {
        const origLine = doc.lineAt(i);
        expect(origLine).toMatch(/\/\//);
      }
    }
  });

  it("handles selection starting on code, ending on comment", () => {
    const doc = makeDoc(
      [
        "const x = 42;",
        "// Long comment that needs to be wrapped at the target column width",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [selection(0, 1)], { column: 30 });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(1);
  });
});

// ── Whole document ───────────────────────────────────────────────────

describe("resolveWraps — whole document", () => {
  it("wraps all comments, leaves code untouched", () => {
    const doc = makeDoc(
      [
        "// Module-level comment that is long enough to wrap at a narrow column width setting",
        "",
        "function foo() {",
        "  // Inner comment that is long enough to wrap at the target column width value",
        "  return 42;",
        "}",
        "",
        "// Another top-level comment that is long enough to need wrapping at the narrow width",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [selection(0, 7)], { column: 40 });
    expect(edits.length).toBeGreaterThanOrEqual(2);
    // All edits should be on comment lines
    for (const edit of edits) {
      expect(edit.replacement).toMatch(/\/\//);
    }
  });

  it("never modifies code lines (issue #61)", () => {
    const doc = makeDoc(
      [
        "// Module-level comment that is long enough to wrap at a narrow column width setting",
        "",
        "function foo() {",
        "  // Inner comment that is long enough to wrap at the target column width value",
        "  return 42;",
        "}",
        "",
        "const answer = computeSomethingWithAVeryLongDescriptiveIdentifierName(1, 2, 3);",
      ].join("\n")
    );

    const codeLines = new Set([2, 4, 5, 7]);
    const edits = resolveWraps(doc, [selection(0, 7)], { column: 40 });

    for (const edit of edits) {
      // No edit range may cover a code line
      for (let line = edit.startLine; line <= edit.endLine; line++) {
        expect(codeLines.has(line)).toBe(false);
      }
      // Replacements must not contain code tokens
      expect(edit.replacement).not.toMatch(/function foo/);
      expect(edit.replacement).not.toMatch(/return 42;/);
      expect(edit.replacement).not.toMatch(/computeSomethingWith/);
    }
  });

  it("wraps all paragraphs in markdown, preserving blank separators", () => {
    const doc = makeDoc(
      [
        "This is the first paragraph that is quite long and should wrap nicely at forty.",
        "More of paragraph one continues here on a second physical line of text.",
        "",
        "Second paragraph is also long enough to be wrapped at the target column width here.",
        "",
        "Third and final paragraph, likewise long enough to be rolled at the narrow width.",
      ].join("\n"),
      "markdown"
    );

    const edits = resolveWraps(doc, [selection(0, 5)], { column: 40 });
    expect(edits).toHaveLength(1);

    const out = edits[0].replacement;
    // Every output line must respect the column width
    for (const line of out.split("\n")) {
      expect(line.length).toBeLessThanOrEqual(40);
    }
    // Blank-line separators between the three paragraphs are preserved
    expect(out.split("\n\n")).toHaveLength(3);
  });

  it("completes a 10,000-line file well under 500ms (issue #61)", () => {
    const chunk = [
      "// This is a fairly long line comment that certainly exceeds the eighty column target width easily",
      "function foo() {",
      "  const x = 1; // trailing note kept short",
      "  return x;",
      "}",
      "",
    ];
    const lines: string[] = [];
    while (lines.length < 10000) lines.push(...chunk);
    const doc = makeDoc(lines.slice(0, 10000).join("\n"), "typescript");

    const selectAll = selection(0, doc.lineCount - 1);
    const start = performance.now();
    const edits = resolveWraps(doc, [selectAll], { column: 80 });
    const elapsed = performance.now() - start;

    expect(edits.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(500);
    // Code lines remain untouched
    for (const edit of edits) {
      expect(edit.replacement).not.toMatch(/function foo/);
      expect(edit.replacement).not.toMatch(/return x;/);
    }
  });
});

// ── Multiple cursors ─────────────────────────────────────────────────

describe("resolveWraps — multiple cursors", () => {
  it("processes each cursor independently", () => {
    const doc = makeDoc(
      [
        "// First very long comment that needs wrapping at the target column width value",
        "function foo() {}",
        "// Second very long comment that needs wrapping at the target column width value",
      ].join("\n")
    );

    const edits = resolveWraps(
      doc,
      [emptyCursor(0), emptyCursor(2)],
      { column: 40 }
    );
    expect(edits).toHaveLength(2);
    expect(edits[0].startLine).toBe(0);
    expect(edits[1].startLine).toBe(2);
  });

  it("deduplicates when cursors hit the same region", () => {
    const doc = makeDoc(
      [
        "// First line of a long comment",
        "// Second line of the same long comment",
      ].join("\n")
    );

    const edits = resolveWraps(
      doc,
      [emptyCursor(0), emptyCursor(1)],
      { column: 80 }
    );
    // Both cursors are in the same region — should produce at most one edit
    expect(edits.length).toBeLessThanOrEqual(1);
  });
});

// ── Markdown / plaintext ─────────────────────────────────────────────

describe("resolveWraps — markdown", () => {
  it("wraps paragraph at empty cursor", () => {
    const doc = makeDoc(
      [
        "This is a long paragraph that needs wrapping at the target column width boundary.",
        "It continues on the next line with more text.",
        "",
        "Second paragraph.",
      ].join("\n"),
      "markdown"
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 30 });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(0);
    expect(edits[0].endLine).toBe(1);
  });

  it("does not wrap from blank line", () => {
    const doc = makeDoc(
      [
        "First paragraph.",
        "",
        "Second paragraph.",
      ].join("\n"),
      "markdown"
    );

    const edits = resolveWraps(doc, [emptyCursor(1)], { column: 30 });
    expect(edits).toHaveLength(0);
  });

  it("wraps selection range directly", () => {
    const doc = makeDoc(
      [
        "First paragraph.",
        "",
        "Second paragraph that is very long and needs to be wrapped at a narrow width.",
      ].join("\n"),
      "markdown"
    );

    const edits = resolveWraps(doc, [selection(2, 2)], { column: 30 });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(2);
    expect(edits[0].endLine).toBe(2);
  });
});

describe("resolveWraps — plaintext", () => {
  it("wraps paragraph at empty cursor", () => {
    const doc = makeDoc(
      "This is a plain text paragraph that is long enough to need wrapping at a narrow column.",
      "plaintext"
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 30 });
    expect(edits).toHaveLength(1);
  });
});

// ── Edge cases ───────────────────────────────────────────────────────

describe("resolveWraps — edge cases", () => {
  it("no-op when comment is already within column width", () => {
    const doc = makeDoc("// Short comment.", "typescript");

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 80 });
    expect(edits).toHaveLength(0);
  });

  it("handles empty document", () => {
    const doc = makeDoc("", "typescript");

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 80 });
    expect(edits).toHaveLength(0);
  });

  it("passes reformat option through to wrapRegion", () => {
    const doc = makeDoc(
      "//   extra spaced comment that is long enough to need wrapping at this width",
      "typescript"
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], {
      column: 40,
      reformat: true,
    });
    expect(edits).toHaveLength(1);
    // Reformatted output should use single space after //
    for (const line of edits[0].replacement.split("\n")) {
      expect(line).toMatch(/^\/\/ \S/);
    }
  });

  it("handles selection on block comment opener only — no content to wrap", () => {
    const doc = makeDoc(
      [
        "/**",
        " * body",
        " */",
      ].join("\n")
    );

    // Selection covers only the opener line
    const edits = resolveWraps(doc, [selection(0, 0)], { column: 40 });
    // contentRange is 1-1, clipped to selection 0-0 → clippedStart(1) > clippedEnd(0) → skip
    expect(edits).toHaveLength(0);
  });

  it("handles Rust doc comments (///)", () => {
    const doc = makeDoc(
      [
        "/// This is a very long Rust doc comment that should be wrapped at the target column width",
        "/// continuation of the doc comment",
        "fn main() {}",
      ].join("\n"),
      "rust"
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 40 });
    expect(edits).toHaveLength(1);
    for (const line of edits[0].replacement.split("\n")) {
      expect(line).toMatch(/^\/\/\/ /);
    }
  });

  it("preserves final newline (no extra newline added)", () => {
    const doc = makeDoc(
      [
        "// A comment that needs wrapping at a narrow column width value",
        "const x = 1;",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 30 });
    expect(edits).toHaveLength(1);
    expect(edits[0].replacement).not.toMatch(/\n$/);
  });
});

// ── No-op preservation (issue #55) ───────────────────────────────────

describe("resolveWraps — no-op preservation", () => {
  it("produces no edit for already-wrapped line comment", () => {
    const doc = makeDoc(
      [
        "// This comment is",
        "// already wrapped.",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 25 });
    expect(edits).toHaveLength(0);
  });

  it("produces no edit for already-wrapped paragraph", () => {
    const doc = makeDoc(
      [
        "This paragraph is",
        "already wrapped at",
        "the target column.",
      ].join("\n"),
      "markdown"
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 20 });
    expect(edits).toHaveLength(0);
  });

  it("produces no edit for already-wrapped block comment", () => {
    const doc = makeDoc(
      [
        "/**",
        " * Short doc line.",
        " */",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(1)], { column: 80 });
    expect(edits).toHaveLength(0);
  });

  it("produces no edit for selection on already-wrapped comment", () => {
    const doc = makeDoc("// Short comment.");
    const edits = resolveWraps(doc, [selection(0, 0)], { column: 80 });
    expect(edits).toHaveLength(0);
  });
});

// ── expandToParagraph ────────────────────────────────────────────────

describe("expandToParagraph", () => {
  it("expands to surrounding non-blank lines", () => {
    const doc = makeDoc(
      ["first", "second", "third", "", "other"].join("\n"),
      "plaintext"
    );
    expect(expandToParagraph(doc, 1)).toEqual({
      startLine: 0,
      endLine: 2,
    });
  });

  it("handles single-line paragraph", () => {
    const doc = makeDoc(
      ["", "alone", ""].join("\n"),
      "plaintext"
    );
    expect(expandToParagraph(doc, 1)).toEqual({
      startLine: 1,
      endLine: 1,
    });
  });

  it("expands to document boundaries", () => {
    const doc = makeDoc("one\ntwo\nthree", "plaintext");
    expect(expandToParagraph(doc, 0)).toEqual({
      startLine: 0,
      endLine: 2,
    });
  });
});

// ── wholeComment setting (issue #57) ─────────────────────────────────

describe("resolveWraps — wholeComment: false", () => {
  it("wraps only the paragraph within a multi-paragraph line comment", () => {
    const doc = makeDoc(
      [
        "// First paragraph of the comment that is long enough to need wrapping at this column width",
        "//",
        "// Second paragraph of the comment that is also long enough to need wrapping here",
        "const x = 1;",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], {
      column: 40,
      wholeComment: false,
    });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(0);
    expect(edits[0].endLine).toBe(0);
  });

  it("wraps second paragraph when cursor is there", () => {
    const doc = makeDoc(
      [
        "// First paragraph short.",
        "//",
        "// Second paragraph of the comment that is long enough to need wrapping at this column width",
        "const x = 1;",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(2)], {
      column: 40,
      wholeComment: false,
    });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(2);
    expect(edits[0].endLine).toBe(2);
  });

  it("no-op when cursor is on blank comment line", () => {
    const doc = makeDoc(
      [
        "// First paragraph.",
        "//",
        "// Second paragraph.",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(1)], {
      column: 40,
      wholeComment: false,
    });
    expect(edits).toHaveLength(0);
  });

  it("wraps paragraph within a block comment", () => {
    const doc = makeDoc(
      [
        "/**",
        " * First paragraph of the block comment that is long enough to need wrapping at this width",
        " *",
        " * Second paragraph of the block comment that is also long enough to need wrapping here",
        " */",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(3)], {
      column: 40,
      wholeComment: false,
    });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(3);
    expect(edits[0].endLine).toBe(3);
    expect(edits[0].replacement).toMatch(/^ \* /);
  });

  it("selection ignores wholeComment setting", () => {
    const doc = makeDoc(
      [
        "// First paragraph of the comment that is long enough to need wrapping at this column width",
        "//",
        "// Second paragraph also long enough to need wrapping at this column width value",
        "const x = 1;",
      ].join("\n")
    );

    // Selection spans both paragraphs — should wrap all selected lines
    const edits = resolveWraps(doc, [selection(0, 2)], {
      column: 40,
      wholeComment: false,
    });
    expect(edits).toHaveLength(1);
    // The edit should cover lines 0-2 (the entire comment content range)
    expect(edits[0].startLine).toBe(0);
    expect(edits[0].endLine).toBe(2);
  });

  it("wholeComment: true (default) wraps entire comment", () => {
    const doc = makeDoc(
      [
        "// First paragraph of the comment that is long enough to need wrapping at this column width",
        "//",
        "// Second paragraph also long enough to need wrapping at this column width value",
        "const x = 1;",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], {
      column: 40,
      wholeComment: true,
    });
    expect(edits).toHaveLength(1);
    // Should wrap the full comment region (lines 0-2)
    expect(edits[0].startLine).toBe(0);
    expect(edits[0].endLine).toBe(2);
  });

  it("defaults to wholeComment: true when not specified", () => {
    const doc = makeDoc(
      [
        "// First paragraph of the comment that is long enough to need wrapping at this column width",
        "//",
        "// Second paragraph also long enough to need wrapping at this column width value",
        "const x = 1;",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 40 });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(0);
    expect(edits[0].endLine).toBe(2);
  });
});

// ── Unwrap (UNWRAP_COLUMN) ───────────────────────────────────────────

describe("resolveWraps — unwrap via UNWRAP_COLUMN", () => {
  it("joins a wrapped line comment into a single line", () => {
    const doc = makeDoc(
      [
        "// This is a comment that has",
        "// been hard wrapped across",
        "// several short lines",
        "const x = 1;",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], {
      column: UNWRAP_COLUMN,
    });
    expect(edits).toHaveLength(1);
    expect(edits[0].startLine).toBe(0);
    expect(edits[0].endLine).toBe(2);
    expect(edits[0].replacement).toBe(
      "// This is a comment that has been hard wrapped across several short lines"
    );
  });

  it("preserves paragraph boundaries when unwrapping", () => {
    const doc = makeDoc(
      [
        "// First paragraph spread",
        "// over two lines",
        "// ",
        "// Second paragraph also",
        "// spread over two lines",
        "const x = 1;",
      ].join("\n")
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], {
      column: UNWRAP_COLUMN,
    });
    expect(edits).toHaveLength(1);
    expect(edits[0].replacement).toBe(
      [
        "// First paragraph spread over two lines",
        "//",
        "// Second paragraph also spread over two lines",
      ].join("\n")
    );
  });

  it("unwraps plaintext paragraphs while keeping blank-line boundaries", () => {
    const doc = makeDoc(
      [
        "This is a plaintext",
        "paragraph wrapped short.",
        "",
        "Another paragraph that",
        "is also wrapped short.",
      ].join("\n"),
      "plaintext"
    );

    const edits = resolveWraps(doc, [selection(0, 4)], {
      column: UNWRAP_COLUMN,
    });
    expect(edits).toHaveLength(1);
    expect(edits[0].replacement).toBe(
      [
        "This is a plaintext paragraph wrapped short.",
        "",
        "Another paragraph that is also wrapped short.",
      ].join("\n")
    );
  });

  it("re-applies the comment prefix after unwrapping", () => {
    const doc = makeDoc(
      [
        "  # a python comment",
        "  # split over lines",
        "x = 1",
      ].join("\n"),
      "python"
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], {
      column: UNWRAP_COLUMN,
    });
    expect(edits).toHaveLength(1);
    expect(edits[0].replacement).toBe("  # a python comment split over lines");
  });
});

// ── LaTeX document routing ───────────────────────────────────────────

describe("resolveWraps — LaTeX documents", () => {
  it("wraps prose paragraphs in a selection while preserving commands", () => {
    const doc = makeDoc(
      [
        "\\section{Intro}",
        "This is a long paragraph of prose that should be wrapped at forty columns wide.",
        "\\label{sec:intro}",
      ].join("\n"),
      "latex"
    );

    const edits = resolveWraps(doc, [selection(0, 2)], { column: 40 });
    expect(edits).toHaveLength(1);
    const lines = edits[0].replacement.split("\n");
    expect(lines[0]).toBe("\\section{Intro}");
    expect(lines.at(-1)).toBe("\\label{sec:intro}");
    // The prose line grew into more than one wrapped line.
    expect(lines.length).toBeGreaterThan(3);
  });

  it("preserves a verbatim environment untouched", () => {
    const doc = makeDoc(
      [
        "\\begin{verbatim}",
        "x = 1    # keep % spacing \\ and $ verbatim",
        "\\end{verbatim}",
      ].join("\n"),
      "latex"
    );

    const edits = resolveWraps(doc, [selection(0, 2)], { column: 20 });
    expect(edits).toHaveLength(0);
  });

  it("also routes the 'tex' language id through LaTeX mode", () => {
    const doc = makeDoc(
      "% a long tex comment that should wrap at forty columns wide today here",
      "tex"
    );

    const edits = resolveWraps(doc, [emptyCursor(0)], { column: 40 });
    expect(edits).toHaveLength(1);
    for (const line of edits[0].replacement.split("\n")) {
      expect(line).toMatch(/^% /);
    }
  });
});

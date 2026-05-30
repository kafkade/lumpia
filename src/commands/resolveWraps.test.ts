import { describe, it, expect } from "vitest";
import {
  resolveWraps,
  expandToParagraph,
  type SelectionInfo,
} from "./resolveWraps";
import type { DocumentLike, TextRange } from "../parser/types";

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

import { describe, it, expect } from "vitest";
import { wrapRegion } from "./wrapper";
import type { DocumentLike, WrappableRegion, TextRange, CommentPrefix } from "../parser/types";

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

function mkPrefix(indent: string, marker: string, spacing: string): CommentPrefix {
  return { indent, marker, spacing };
}

describe("wrapRegion", () => {
  it("wraps a line-comment region and re-applies prefix", () => {
    const text = "// This is a long comment that should be wrapped at a reasonable column width";
    const doc = makeDoc(text);
    const region: WrappableRegion = {
      range: { startLine: 0, startCol: 0, endLine: 0, endCol: 0 },
      languageId: "typescript",
      kind: "line-comment",
      prefix: mkPrefix("", "//", " "),
      innerIndent: 0,
      contentRange: { startLine: 0, endLine: 0 },
    };

    const result = wrapRegion(region, doc, 40);
    const lines = result.split("\n");
    expect(lines.every((l) => l.startsWith("// "))).toBe(true);
    expect(lines.length).toBeGreaterThan(1);
  });

  it("wraps an indented comment region", () => {
    const text = "  // short words here and there and more words to fill it up";
    const doc = makeDoc(text);
    const region: WrappableRegion = {
      range: { startLine: 0, startCol: 0, endLine: 0, endCol: 0 },
      languageId: "typescript",
      kind: "line-comment",
      prefix: mkPrefix("  ", "//", " "),
      innerIndent: 2,
      contentRange: { startLine: 0, endLine: 0 },
    };

    const result = wrapRegion(region, doc, 30);
    const lines = result.split("\n");
    expect(lines.every((l) => l.startsWith("  // "))).toBe(true);
  });

  it("handles multi-line comment region", () => {
    const text = "# first line of comment\n# second line of comment";
    const doc = makeDoc(text, "python");
    const region: WrappableRegion = {
      range: { startLine: 0, startCol: 0, endLine: 1, endCol: 0 },
      languageId: "python",
      kind: "line-comment",
      prefix: mkPrefix("", "#", " "),
      innerIndent: 0,
      contentRange: { startLine: 0, endLine: 1 },
    };

    const result = wrapRegion(region, doc, 80);
    expect(result).toBe("# first line of comment second line of comment");
  });

  it("handles plaintext region with no prefix", () => {
    const text = "just some plain text that is very long and needs wrapping at column width";
    const doc = makeDoc(text, "plaintext");
    const region: WrappableRegion = {
      range: { startLine: 0, startCol: 0, endLine: 0, endCol: 0 },
      languageId: "plaintext",
      kind: "plaintext",
      prefix: mkPrefix("", "", ""),
      innerIndent: 0,
      contentRange: { startLine: 0, endLine: 0 },
    };

    const result = wrapRegion(region, doc, 30);
    const lines = result.split("\n");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((l) => l.length <= 30)).toBe(true);
  });

  it("normalizes prefix spacing when reformat is true", () => {
    const text = "//   extra spaced comment here";
    const doc = makeDoc(text);
    const region: WrappableRegion = {
      range: { startLine: 0, startCol: 0, endLine: 0, endCol: 0 },
      languageId: "typescript",
      kind: "line-comment",
      prefix: mkPrefix("", "//", "   "),
      innerIndent: 0,
      contentRange: { startLine: 0, endLine: 0 },
    };

    const result = wrapRegion(region, doc, 80, true);
    expect(result).toBe("// extra spaced comment here");
  });

  it("preserves original prefix when reformat is false", () => {
    const text = "//   extra spaced";
    const doc = makeDoc(text);
    const region: WrappableRegion = {
      range: { startLine: 0, startCol: 0, endLine: 0, endCol: 0 },
      languageId: "typescript",
      kind: "line-comment",
      prefix: mkPrefix("", "//", "   "),
      innerIndent: 0,
      contentRange: { startLine: 0, endLine: 0 },
    };

    const result = wrapRegion(region, doc, 80, false);
    expect(result).toBe("//   extra spaced");
  });

  it("does not add spacing for markerless prefix on reformat", () => {
    const text = "plain text here";
    const doc = makeDoc(text, "plaintext");
    const region: WrappableRegion = {
      range: { startLine: 0, startCol: 0, endLine: 0, endCol: 0 },
      languageId: "plaintext",
      kind: "plaintext",
      prefix: mkPrefix("", "", ""),
      innerIndent: 0,
      contentRange: { startLine: 0, endLine: 0 },
    };

    const result = wrapRegion(region, doc, 80, true);
    expect(result).toBe("plain text here");
  });
});

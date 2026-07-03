import { describe, it, expect } from "vitest";
import { rollText } from "./engine/wrapper";

describe("rollText", () => {
  it("wraps a long line at the specified column", () => {
    const input = "one two three four five six seven eight nine ten";
    const result = rollText(input, 20);
    expect(result).toBe("one two three four\nfive six seven eight\nnine ten");
  });

  it("does not wrap text shorter than the column", () => {
    const input = "short line";
    expect(rollText(input, 80)).toBe("short line");
  });

  it("handles empty string", () => {
    expect(rollText("", 80)).toBe("");
  });

  it("handles a single word longer than the column", () => {
    const input = "superlongword";
    expect(rollText(input, 5)).toBe("superlongword");
  });

  it("preserves paragraph breaks (double newlines)", () => {
    const input = "first paragraph words here\n\nsecond paragraph words here";
    const result = rollText(input, 20);
    expect(result).toBe(
      "first paragraph\nwords here\n\nsecond paragraph\nwords here"
    );
  });

  it("collapses multiple spaces within a paragraph", () => {
    const input = "one   two   three";
    expect(rollText(input, 80)).toBe("one two three");
  });

  it("handles column of 1", () => {
    const input = "a b c";
    expect(rollText(input, 1)).toBe("a\nb\nc");
  });

  it("handles text exactly at column width", () => {
    const input = "exactly ten";
    expect(rollText(input, 11)).toBe("exactly ten");
  });

  it("handles multiple paragraphs with varying lengths", () => {
    const input = "short\n\nthis is a longer paragraph that should wrap around";
    const result = rollText(input, 20);
    expect(result).toBe(
      "short\n\nthis is a longer\nparagraph that\nshould wrap around"
    );
  });

  // ── No-op preservation (issue #55) ─────────────────────────────────

  describe("no-op preservation", () => {
    it("returns identical string for already-wrapped paragraph", () => {
      const input = "hello world foo bar\nbaz qux quux corge\ngrault";
      expect(rollText(input, 20)).toBe(input);
    });

    it("returns identical string for short line under column width", () => {
      const input = "short line";
      expect(rollText(input, 80)).toBe(input);
    });

    it("returns identical string for multi-paragraph already-wrapped text", () => {
      const input = "first para\nshort line\n\nsecond para\nalso short";
      expect(rollText(input, 15)).toBe(input);
    });

    it("is idempotent: rollText(rollText(x)) === rollText(x)", () => {
      const inputs = [
        "one two three four five six seven eight nine ten",
        "short\n\nthis is a longer paragraph that should wrap around",
        "- list item with enough words to wrap around the column boundary",
        "# Heading\n\nParagraph text that is long enough.",
        "> quoted text that is long enough to need wrapping at width",
        "```\ncode\n```\n\nParagraph after fence.",
      ];
      for (const input of inputs) {
        const once = rollText(input, 25);
        const twice = rollText(once, 25);
        expect(twice).toBe(once);
      }
    });

    it("preserves trailing newline", () => {
      const withNewline = "hello\n";
      expect(rollText(withNewline, 80)).toBe("hello\n");
    });

    it("does not add trailing newline", () => {
      const noNewline = "hello";
      expect(rollText(noNewline, 80)).toBe("hello");
    });

    it("preserves blank line between paragraphs on re-wrap", () => {
      const input = "alpha\n\nbeta";
      expect(rollText(input, 80)).toBe("alpha\n\nbeta");
    });
  });

  // ── CRLF preservation (issue #55) ──────────────────────────────────

  describe("CRLF preservation", () => {
    it("preserves CRLF line endings after wrapping", () => {
      const input = "one two three four five six\r\nseven eight nine ten";
      const result = rollText(input, 20);
      // No bare LF — all newlines should be CRLF
      expect(result.replace(/\r\n/g, "")).not.toContain("\n");
      expect(result).toContain("\r\n");
      for (const line of result.split("\r\n")) {
        expect(line.length).toBeLessThanOrEqual(20);
      }
    });

    it("returns identical CRLF string for already-wrapped input", () => {
      const input = "short line\r\n\r\nsecond para";
      expect(rollText(input, 80)).toBe(input);
    });

    it("preserves LF when no CRLF present", () => {
      const input = "first\nsecond\nthird";
      const result = rollText(input, 80);
      expect(result).toBe("first second third");
      expect(result).not.toContain("\r");
    });

    it("preserves CRLF trailing newline", () => {
      const input = "hello\r\n";
      expect(rollText(input, 80)).toBe("hello\r\n");
    });

    it("does not add a trailing newline to CRLF input without one", () => {
      const input = "one two three four five six\r\nseven eight nine";
      const result = rollText(input, 20);
      expect(result.endsWith("\n")).toBe(false);
      expect(result.endsWith("\r")).toBe(false);
    });

    it("normalizes mixed endings to CRLF when CRLF dominates", () => {
      // 2 CRLF, 1 LF → dominant is CRLF
      const input = "aaaa\r\nbbbb\r\ncccc\ndddd";
      const result = rollText(input, 4);
      expect(result).toBe("aaaa\r\nbbbb\r\ncccc\r\ndddd");
      expect(result.replace(/\r\n/g, "")).not.toContain("\n");
    });

    it("normalizes mixed endings to LF when LF dominates", () => {
      // 1 CRLF, 2 LF → dominant is LF
      const input = "aaaa\nbbbb\ncccc\r\ndddd";
      const result = rollText(input, 4);
      expect(result).toBe("aaaa\nbbbb\ncccc\ndddd");
      expect(result).not.toContain("\r");
    });

    it("falls back to LF when CRLF and LF counts tie", () => {
      // 1 CRLF, 1 LF → tie resolves to LF
      const input = "aaaa\r\nbbbb\ncccc";
      const result = rollText(input, 4);
      expect(result).toBe("aaaa\nbbbb\ncccc");
      expect(result).not.toContain("\r");
    });
  });
});

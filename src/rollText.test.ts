import { describe, it, expect, vi } from "vitest";

vi.mock("vscode", () => ({
  workspace: { getConfiguration: () => ({ get: () => undefined }) },
  window: { activeTextEditor: undefined },
  commands: { registerCommand: () => ({ dispose: () => {} }) },
}));

import { rollText } from "./extension";

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
});

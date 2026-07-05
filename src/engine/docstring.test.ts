import { describe, it, expect } from "vitest";
import { rollText } from "./wrapper";

/** Wrap docstring-mode text at the given column. */
function roll(input: string, column = 60): string {
  return rollText(input, column, { docstring: true });
}

/** Wrap the same text WITHOUT docstring mode (generic engine). */
function rollPlain(input: string, column = 60): string {
  return rollText(input, column, { docstring: false });
}

describe("docstring — reST / Sphinx field lists", () => {
  it("wraps :param: with a hanging indent (base + 4)", () => {
    const input = [
      ":param records: The list of record objects to process in this batch iteration",
    ].join("\n");
    expect(roll(input)).toBe(
      [
        ":param records: The list of record objects to process in",
        "    this batch iteration",
      ].join("\n")
    );
  });

  it("keeps distinct fields as separate blocks", () => {
    const input = [
      ":param a: first argument that is quite long and needs to wrap here",
      ":returns: a short result",
    ].join("\n");
    expect(roll(input)).toBe(
      [
        ":param a: first argument that is quite long and needs to",
        "    wrap here",
        ":returns: a short result",
      ].join("\n")
    );
  });

  it("handles :raises Exception: fields", () => {
    const input =
      ":raises ValueError: If the timeout is negative or is not a valid integer value";
    expect(roll(input)).toBe(
      [
        ":raises ValueError: If the timeout is negative or is not a",
        "    valid integer value",
      ].join("\n")
    );
  });

  it("joins a manually pre-wrapped field before reflowing", () => {
    const input = [
      ":param name: A description that was manually split",
      "    across two source lines by the author here",
    ].join("\n");
    expect(roll(input)).toBe(
      [
        ":param name: A description that was manually split across",
        "    two source lines by the author here",
      ].join("\n")
    );
  });

  it("does not treat inline roles as field lists", () => {
    const input =
      "See :class:`UserManager` for details on how accounts are created here";
    expect(roll(input)).toBe(
      [
        "See :class:`UserManager` for details on how accounts are",
        "created here",
      ].join("\n")
    );
  });
});

describe("docstring — Google style sections", () => {
  it("preserves the header and wraps args with continuation at arg + 4", () => {
    const input = [
      "Args:",
      "    query: The SQL query string to execute against the configured database",
    ].join("\n");
    expect(roll(input)).toBe(
      [
        "Args:",
        "    query: The SQL query string to execute against the",
        "        configured database",
      ].join("\n")
    );
  });

  it("handles typed args like name (type): desc", () => {
    const input = [
      "Args:",
      "    limit (int): Maximum number of rows to return from the result set here",
    ].join("\n");
    expect(roll(input)).toBe(
      [
        "Args:",
        "    limit (int): Maximum number of rows to return from the",
        "        result set here",
      ].join("\n")
    );
  });

  it("reflows prose sections (Returns) preserving the body indent", () => {
    const input = [
      "Returns:",
      "    A list of row objects that matched the given query within the limit",
    ].join("\n");
    expect(roll(input)).toBe(
      [
        "Returns:",
        "    A list of row objects that matched the given query",
        "    within the limit",
      ].join("\n")
    );
  });

  it("parses a section that immediately follows a summary line", () => {
    const input = [
      "Do a thing with the given arguments provided by the caller here.",
      "Args:",
      "    x: The x coordinate value used to place the object on the canvas",
    ].join("\n");
    expect(roll(input)).toBe(
      [
        "Do a thing with the given arguments provided by the caller",
        "here.",
        "Args:",
        "    x: The x coordinate value used to place the object on",
        "        the canvas",
      ].join("\n")
    );
  });
});

describe("docstring — NumPy style sections", () => {
  it("preserves the header, dash underline, and name : type entries", () => {
    const input = [
      "Parameters",
      "----------",
      "signal_a : array_like",
      "    The first input signal for cross-correlation analysis here today",
    ].join("\n");
    expect(roll(input)).toBe(
      [
        "Parameters",
        "----------",
        "signal_a : array_like",
        "    The first input signal for cross-correlation analysis",
        "    here today",
      ].join("\n")
    );
  });

  it("treats Returns as an entry section (name : type + description)", () => {
    const input = [
      "Returns",
      "-------",
      "result : ndarray",
      "    The cross-correlation result array with normalized values here",
    ].join("\n");
    expect(roll(input)).toBe(
      [
        "Returns",
        "-------",
        "result : ndarray",
        "    The cross-correlation result array with normalized",
        "    values here",
      ].join("\n")
    );
  });
});

describe("docstring — plain prose and code", () => {
  it("reflows plain prose paragraphs", () => {
    const input = [
      "This is the content of a triple-quoted string.",
      "It spans multiple lines and should be reflowed.",
    ].join("\n");
    expect(roll(input)).toBe(
      [
        "This is the content of a triple-quoted string. It spans",
        "multiple lines and should be reflowed.",
      ].join("\n")
    );
  });

  it("preserves fenced code examples verbatim", () => {
    const input = [
      "Example:",
      "",
      "```python",
      "dt = parse_date('2024-01-15')  # this comment is intentionally very long here",
      "```",
    ].join("\n");
    expect(roll(input)).toBe(input);
  });
});

describe("docstring — mode gating", () => {
  it("does not apply section handling when docstring mode is off", () => {
    const input = [
      "Parameters",
      "----------",
      "signal_a : array_like",
    ].join("\n");
    // Without docstring mode these lines collapse into a paragraph.
    expect(rollPlain(input)).toBe(
      "Parameters ---------- signal_a : array_like"
    );
    // With docstring mode the structure is preserved.
    expect(roll(input)).toBe(input);
  });
});

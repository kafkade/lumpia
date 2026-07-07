import { describe, it, expect } from "vitest";
import { rollText } from "./wrapper";

// ── Helpers ──────────────────────────────────────────────────────────

const latex = (text: string, column = 40) =>
  rollText(text, column, { latex: true });

// ── Prose paragraphs ─────────────────────────────────────────────────

describe("rollText — LaTeX prose", () => {
  it("wraps a prose paragraph to the target column", () => {
    const input =
      "This is a long paragraph of prose that should be wrapped at forty columns.";
    const out = latex(input, 40);
    expect(out).toBe(
      [
        "This is a long paragraph of prose that",
        "should be wrapped at forty columns.",
      ].join("\n")
    );
  });

  it("preserves standalone command lines and wraps prose between them", () => {
    const input = [
      "\\section{Intro}",
      "Some prose that is long enough to be wrapped across lines here.",
      "\\label{sec:intro}",
    ].join("\n");
    const out = latex(input, 40);
    expect(out).toBe(
      [
        "\\section{Intro}",
        "Some prose that is long enough to be",
        "wrapped across lines here.",
        "\\label{sec:intro}",
      ].join("\n")
    );
  });

  it("does not merge a command line into an adjacent paragraph", () => {
    const input = [
      "First prose line that is reasonably long here.",
      "\\newpage",
      "Second prose line that is reasonably long here.",
    ].join("\n");
    const out = latex(input, 80);
    expect(out.split("\n")).toEqual([
      "First prose line that is reasonably long here.",
      "\\newpage",
      "Second prose line that is reasonably long here.",
    ]);
  });
});

// ── Environments ─────────────────────────────────────────────────────

describe("rollText — LaTeX environments", () => {
  it("preserves math environments verbatim", () => {
    const input = [
      "\\begin{equation}",
      "    E = mc^2 \\qquad \\text{a very long trailing note that must not be rewrapped at all}",
      "\\end{equation}",
    ].join("\n");
    expect(latex(input, 40)).toBe(input);
  });

  it("preserves verbatim environments verbatim, including % and spacing", () => {
    const input = [
      "\\begin{verbatim}",
      "x = 1    # comment with % and spaces    kept",
      "\\end{verbatim}",
    ].join("\n");
    expect(latex(input, 40)).toBe(input);
  });

  it("preserves lstlisting with options", () => {
    const input = [
      "\\begin{lstlisting}[language=Python]",
      "def foo():    return    bar",
      "\\end{lstlisting}",
    ].join("\n");
    expect(latex(input, 20)).toBe(input);
  });

  it("wraps prose inside non-verbatim environments but keeps begin/end lines", () => {
    const input = [
      "\\begin{abstract}",
      "This abstract text is long enough that it should be wrapped across two lines here.",
      "\\end{abstract}",
    ].join("\n");
    const out = latex(input, 40);
    expect(out.split("\n")[0]).toBe("\\begin{abstract}");
    expect(out.split("\n").at(-1)).toBe("\\end{abstract}");
    // The prose in between wrapped to multiple lines.
    expect(out.split("\n").length).toBeGreaterThan(3);
  });

  it("handles nested environments of the same name", () => {
    const input = [
      "\\begin{comment}",
      "outer",
      "\\begin{comment}",
      "inner",
      "\\end{comment}",
      "outer again with a long line that would otherwise wrap but must not",
      "\\end{comment}",
    ].join("\n");
    expect(latex(input, 20)).toBe(input);
  });
});

// ── Math spans ───────────────────────────────────────────────────────

describe("rollText — LaTeX math spans", () => {
  it("preserves display math \\[ \\]", () => {
    const input = [
      "\\[",
      "    a^2 + b^2 = c^2 \\text{ a long trailing note that stays put}",
      "\\]",
    ].join("\n");
    expect(latex(input, 30)).toBe(input);
  });

  it("preserves single-line $$ display math", () => {
    const input = "$$ a + b = c \\text{ long note that stays put here} $$";
    expect(latex(input, 20)).toBe(input);
  });

  it("preserves multi-line $$ display math", () => {
    const input = ["$$", "a + b = c", "$$"].join("\n");
    expect(latex(input, 20)).toBe(input);
  });
});

// ── Comments ─────────────────────────────────────────────────────────

describe("rollText — LaTeX comments", () => {
  it("wraps a % comment run, preserving the marker", () => {
    const input =
      "% This is a long LaTeX comment that should wrap at forty columns wide.";
    const out = latex(input, 40);
    for (const line of out.split("\n")) {
      expect(line).toMatch(/^% /);
    }
    expect(out.split("\n").length).toBeGreaterThan(1);
  });

  it("merges consecutive comment lines into one reflowed block", () => {
    const input = [
      "% first comment line here",
      "% second comment line here",
    ].join("\n");
    const out = latex(input, 80);
    expect(out).toBe("% first comment line here second comment line here");
  });

  it("preserves a double-percent marker", () => {
    const input =
      "%% A long doc-style comment that should wrap while keeping its %% marker.";
    const out = latex(input, 40);
    for (const line of out.split("\n")) {
      expect(line).toMatch(/^%% /);
    }
  });

  it("keeps a prose line with a trailing inline comment intact", () => {
    const input = "Short prose here. % TODO fix this later on and on and on";
    expect(latex(input, 20)).toBe(input);
  });

  it("does not treat an escaped \\% as a comment", () => {
    const input =
      "A price of 50\\% is written with an escaped percent and wraps as prose.";
    const out = latex(input, 40);
    // Wrapped as prose (multiple lines), not preserved as a single line.
    expect(out.split("\n").length).toBeGreaterThan(1);
    expect(out).toContain("50\\%");
  });
});

// ── Idempotency ──────────────────────────────────────────────────────

describe("rollText — LaTeX idempotency", () => {
  it("is a no-op on already-wrapped LaTeX", () => {
    const input = [
      "\\section{Intro}",
      "",
      "Some prose that is long enough to be",
      "wrapped across lines here.",
      "",
      "\\begin{equation}",
      "    E = mc^2",
      "\\end{equation}",
    ].join("\n");
    expect(latex(input, 40)).toBe(input);
  });
});

import { describe, it, expect } from "vitest";
import {
  parseContentBlocks,
  greedyFill,
  wrapBlock,
  isSentenceEnd,
  type ContentBlock,
} from "./contentBlocks";

// ── parseContentBlocks ───────────────────────────────────────────────

describe("parseContentBlocks", () => {
  it("parses plain text as a single paragraph", () => {
    const blocks = parseContentBlocks("hello world");
    expect(blocks).toEqual([{ type: "paragraph", lines: ["hello world"] }]);
  });

  it("parses multi-line text as a single paragraph", () => {
    const blocks = parseContentBlocks("line one\nline two\nline three");
    expect(blocks).toEqual([
      { type: "paragraph", lines: ["line one", "line two", "line three"] },
    ]);
  });

  it("splits paragraphs on blank lines", () => {
    const blocks = parseContentBlocks("para one\n\npara two");
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ type: "paragraph", lines: ["para one"] });
    expect(blocks[1]).toEqual({ type: "blank-line" });
    expect(blocks[2]).toEqual({ type: "paragraph", lines: ["para two"] });
  });

  it("collapses consecutive blank lines", () => {
    const blocks = parseContentBlocks("text\n\n\n\nmore text");
    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[1].type).toBe("blank-line");
    expect(blocks[2].type).toBe("paragraph");
  });

  it("parses code fences (backticks)", () => {
    const text = "before\n\n```js\nconst x = 1;\n```\n\nafter";
    const blocks = parseContentBlocks(text);
    const codeFence = blocks.find((b) => b.type === "code-fence");
    expect(codeFence).toBeDefined();
    expect(codeFence!.type === "code-fence" && codeFence!.lines).toEqual([
      "```js",
      "const x = 1;",
      "```",
    ]);
  });

  it("parses code fences (tildes)", () => {
    const text = "~~~\ncode here\n~~~";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("code-fence");
  });

  it("preserves unclosed code fences", () => {
    const text = "```\ncode without closing";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("code-fence");
    if (blocks[0].type === "code-fence") {
      expect(blocks[0].lines).toEqual(["```", "code without closing"]);
    }
  });

  it("parses headings", () => {
    const blocks = parseContentBlocks("# Title");
    expect(blocks).toEqual([{ type: "heading", line: "# Title" }]);
  });

  it("parses h2-h6 headings", () => {
    const text = "## H2\n### H3\n#### H4";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(3);
    expect(blocks.every((b) => b.type === "heading")).toBe(true);
  });

  it("does not parse # without space as heading", () => {
    const blocks = parseContentBlocks("#nosuchheading");
    expect(blocks[0].type).toBe("paragraph");
  });

  it("parses tables", () => {
    const text = "| Col1 | Col2 |\n| --- | --- |\n| a | b |";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("table");
    if (blocks[0].type === "table") {
      expect(blocks[0].lines).toHaveLength(3);
    }
  });

  it("parses blockquotes", () => {
    const text = "> quoted text\n> more quoted";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("blockquote");
    if (blocks[0].type === "blockquote") {
      expect(blocks[0].prefix).toBe("> ");
      expect(blocks[0].blocks).toHaveLength(1);
      expect(blocks[0].blocks[0].type).toBe("paragraph");
    }
  });

  it("parses nested blockquotes", () => {
    const text = "> > nested";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(1);
    if (blocks[0].type === "blockquote") {
      expect(blocks[0].blocks[0].type).toBe("blockquote");
    }
  });

  it("parses unordered list items (dash)", () => {
    const text = "- item one\n- item two";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("list-item");
    expect(blocks[1].type).toBe("list-item");
    if (blocks[0].type === "list-item") {
      expect(blocks[0].marker).toBe("- ");
      expect(blocks[0].indent).toBe(0);
    }
  });

  it("parses unordered list items (asterisk)", () => {
    const blocks = parseContentBlocks("* item");
    expect(blocks[0].type).toBe("list-item");
    if (blocks[0].type === "list-item") {
      expect(blocks[0].marker).toBe("* ");
    }
  });

  it("parses ordered list items", () => {
    const blocks = parseContentBlocks("1. first\n2. second");
    expect(blocks).toHaveLength(2);
    if (blocks[0].type === "list-item") {
      expect(blocks[0].marker).toBe("1. ");
    }
    if (blocks[1].type === "list-item") {
      expect(blocks[1].marker).toBe("2. ");
    }
  });

  it("parses list items with continuation lines", () => {
    const text = "- item one that\n  continues here";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(1);
    if (blocks[0].type === "list-item") {
      expect(blocks[0].lines).toHaveLength(2);
    }
  });

  it("parses doc tags", () => {
    const blocks = parseContentBlocks("@param name description text");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("doc-tag");
    if (blocks[0].type === "doc-tag") {
      expect(blocks[0].tag).toBe("@param");
    }
  });

  it("parses doc tag with continuation", () => {
    const text = "@param name description\n  that continues";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(1);
    if (blocks[0].type === "doc-tag") {
      expect(blocks[0].lines).toHaveLength(2);
    }
  });

  it("separates consecutive doc tags", () => {
    const text = "@param x first\n@param y second";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("doc-tag");
    expect(blocks[1].type).toBe("doc-tag");
  });

  it("detects preserved breaks (trailing double space)", () => {
    const text = "line with break  ";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("preserved-break");
  });

  it("splits paragraph at preserved break", () => {
    const text = "first line\nsecond line  \nthird line";
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[1].type).toBe("preserved-break");
    expect(blocks[2].type).toBe("paragraph");
  });

  it("detects indented code after blank line", () => {
    const text = "paragraph\n\n    code line 1\n    code line 2";
    const blocks = parseContentBlocks(text);
    const codeBlock = blocks.find((b) => b.type === "indented-code");
    expect(codeBlock).toBeDefined();
    if (codeBlock?.type === "indented-code") {
      expect(codeBlock.lines).toEqual(["    code line 1", "    code line 2"]);
    }
  });

  it("does not detect indented code without preceding blank line", () => {
    const text = "paragraph\n    indented continuation";
    const blocks = parseContentBlocks(text);
    // Should be treated as a single paragraph
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
  });

  it("handles empty string", () => {
    const blocks = parseContentBlocks("");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("blank-line");
  });

  it("handles mixed content", () => {
    const text = [
      "# Overview",
      "",
      "This is a paragraph.",
      "",
      "- list item",
      "",
      "```",
      "code",
      "```",
      "",
      "@param x description",
    ].join("\n");
    const blocks = parseContentBlocks(text);
    const types = blocks.map((b) => b.type);
    expect(types).toContain("heading");
    expect(types).toContain("paragraph");
    expect(types).toContain("list-item");
    expect(types).toContain("code-fence");
    expect(types).toContain("doc-tag");
  });
});

// ── greedyFill ───────────────────────────────────────────────────────

describe("greedyFill", () => {
  it("fills a single line when text fits", () => {
    expect(greedyFill("hello world", 80, 4)).toEqual(["hello world"]);
  });

  it("wraps text at column boundary", () => {
    const result = greedyFill(
      "one two three four five six seven eight nine ten",
      20,
      4
    );
    expect(result).toEqual([
      "one two three four",
      "five six seven eight",
      "nine ten",
    ]);
  });

  it("handles single word longer than column", () => {
    expect(greedyFill("superlongword", 5, 4)).toEqual(["superlongword"]);
  });

  it("returns empty array for empty text", () => {
    expect(greedyFill("", 80, 4)).toEqual([]);
    expect(greedyFill("   ", 80, 4)).toEqual([]);
  });

  it("collapses multiple spaces", () => {
    expect(greedyFill("one   two   three", 80, 4)).toEqual([
      "one two three",
    ]);
  });

  it("handles column of 1", () => {
    expect(greedyFill("a b c", 1, 4)).toEqual(["a", "b", "c"]);
  });

  it("handles text exactly at column width", () => {
    expect(greedyFill("exactly ten", 11, 4)).toEqual(["exactly ten"]);
  });
});

describe("isSentenceEnd", () => {
  it("detects sentence-ending punctuation", () => {
    expect(isSentenceEnd("done.")).toBe(true);
    expect(isSentenceEnd("really?")).toBe(true);
    expect(isSentenceEnd("wow!")).toBe(true);
  });

  it("ignores non-sentence-ending words", () => {
    expect(isSentenceEnd("hello")).toBe(false);
    expect(isSentenceEnd("mid,")).toBe(false);
    expect(isSentenceEnd("v1.2")).toBe(false);
  });

  it("looks past trailing closing quotes and brackets", () => {
    expect(isSentenceEnd('end."')).toBe(true);
    expect(isSentenceEnd("end.'")).toBe(true);
    expect(isSentenceEnd("(done!)")).toBe(true);
    expect(isSentenceEnd("item.]")).toBe(true);
    expect(isSentenceEnd('really?")')).toBe(true);
  });
});

describe("greedyFill double sentence spacing", () => {
  it("inserts two spaces after sentence-ending punctuation", () => {
    expect(greedyFill("One. Two.", 80, 4, true)).toEqual(["One.  Two."]);
  });

  it("uses single spacing when disabled (default)", () => {
    expect(greedyFill("One. Two.", 80, 4)).toEqual(["One. Two."]);
    expect(greedyFill("One. Two.", 80, 4, false)).toEqual(["One. Two."]);
  });

  it("only double-spaces at sentence boundaries", () => {
    expect(greedyFill("Hello there. How are you?", 80, 4, true)).toEqual([
      "Hello there.  How are you?",
    ]);
  });

  it("handles closing quotes and brackets before the space", () => {
    expect(greedyFill('He said "hi." Then left.', 80, 4, true)).toEqual([
      'He said "hi."  Then left.',
    ]);
  });

  it("accounts for the extra space in the width budget", () => {
    // "abc." (4) + two spaces (2) + "de" (2) = 8, fits in 8
    expect(greedyFill("abc. de", 8, 4, true)).toEqual(["abc.  de"]);
    // With column 7 the two-space join would exceed, so it wraps
    expect(greedyFill("abc. de", 7, 4, true)).toEqual(["abc.", "de"]);
  });
});

// ── wrapBlock ────────────────────────────────────────────────────────

describe("wrapBlock", () => {
  it("wraps a paragraph", () => {
    const block: ContentBlock = {
      type: "paragraph",
      lines: ["one two three four five six seven eight nine ten"],
    };
    const result = wrapBlock(block, 20, 4);
    expect(result).toBe(
      "one two three four\nfive six seven eight\nnine ten"
    );
  });

  it("joins multi-line paragraph before wrapping", () => {
    const block: ContentBlock = {
      type: "paragraph",
      lines: ["first line", "second line"],
    };
    const result = wrapBlock(block, 80, 4);
    expect(result).toBe("first line second line");
  });

  it("preserves code fence verbatim", () => {
    const block: ContentBlock = {
      type: "code-fence",
      lines: ["```js", "const x = 1;", "```"],
    };
    expect(wrapBlock(block, 10, 4)).toBe("```js\nconst x = 1;\n```");
  });

  it("preserves heading verbatim", () => {
    const block: ContentBlock = { type: "heading", line: "# Long heading that exceeds column" };
    expect(wrapBlock(block, 10, 4)).toBe("# Long heading that exceeds column");
  });

  it("preserves table verbatim", () => {
    const block: ContentBlock = {
      type: "table",
      lines: ["| a | b |", "| 1 | 2 |"],
    };
    expect(wrapBlock(block, 5, 4)).toBe("| a | b |\n| 1 | 2 |");
  });

  it("returns empty string for blank line", () => {
    expect(wrapBlock({ type: "blank-line" }, 80, 4)).toBe("");
  });

  it("preserves preserved-break line", () => {
    const block: ContentBlock = {
      type: "preserved-break",
      line: "text with break  ",
    };
    expect(wrapBlock(block, 80, 4)).toBe("text with break  ");
  });

  it("wraps list item with hanging indent", () => {
    const block: ContentBlock = {
      type: "list-item",
      marker: "- ",
      indent: 0,
      lines: ["- this is a list item that should wrap around at the column boundary"],
    };
    const result = wrapBlock(block, 30, 4);
    const lines = result.split("\n");
    expect(lines[0].startsWith("- ")).toBe(true);
    // Continuation lines should be indented to align with content
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i].startsWith("  ")).toBe(true);
      expect(lines[i][2]).not.toBe(" "); // content starts right after indent
    }
  });

  it("wraps doc tag with hanging indent", () => {
    const block: ContentBlock = {
      type: "doc-tag",
      tag: "@param",
      lines: ["@param name a very long description that should wrap with hanging indent"],
    };
    const result = wrapBlock(block, 40, 4);
    const lines = result.split("\n");
    expect(lines[0].startsWith("@param name ")).toBe(true);
    // Continuation should be indented past "@param name "
    if (lines.length > 1) {
      const indent = lines[1].length - lines[1].trimStart().length;
      expect(indent).toBe("@param name ".length);
    }
  });

  it("wraps blockquote with prefix", () => {
    const block: ContentBlock = {
      type: "blockquote",
      prefix: "> ",
      blocks: [
        {
          type: "paragraph",
          lines: ["this is a long quoted paragraph that should wrap"],
        },
      ],
    };
    const result = wrapBlock(block, 30, 4);
    const lines = result.split("\n");
    expect(lines.every((l) => l.startsWith("> "))).toBe(true);
  });

  it("wraps indented list items correctly", () => {
    const block: ContentBlock = {
      type: "list-item",
      marker: "- ",
      indent: 4,
      lines: ["    - nested item with long text that wraps around"],
    };
    const result = wrapBlock(block, 30, 4);
    const lines = result.split("\n");
    expect(lines[0].startsWith("    - ")).toBe(true);
    if (lines.length > 1) {
      expect(lines[1].startsWith("      ")).toBe(true);
    }
  });

  it("preserves indented code verbatim", () => {
    const block: ContentBlock = {
      type: "indented-code",
      lines: ["    for i in range(10):", "        print(i)"],
    };
    expect(wrapBlock(block, 20, 4)).toBe(
      "    for i in range(10):\n        print(i)"
    );
  });
});

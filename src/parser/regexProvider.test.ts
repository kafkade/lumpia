import { describe, it, expect } from "vitest";
import { RegexRegionProvider } from "./regexProvider";
import type { DocumentLike, TextRange, WrappableRegion } from "./types";
import { prefixToString } from "./prefix";

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

function fullRange(doc: DocumentLike): TextRange {
  return { startLine: 0, startCol: 0, endLine: doc.lineCount - 1, endCol: 0 };
}

const provider = new RegexRegionProvider();

function getRegions(text: string, lang: string): WrappableRegion[] {
  const doc = makeDoc(text, lang);
  return provider.getRegions(doc, fullRange(doc));
}

// ─── Plaintext / Markdown ────────────────────────────────────────────

describe("plaintext and markdown", () => {
  it("returns a single plaintext region", () => {
    const r = getRegions("hello world\nfoo bar", "plaintext");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("plaintext");
  });

  it("returns a single markdown region", () => {
    const r = getRegions("# Title\nsome text", "markdown");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("markdown");
  });

  it("treats unknown languages as plaintext", () => {
    const r = getRegions("hello", "unknown-lang");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("plaintext");
  });
});

// ─── TypeScript / JavaScript ─────────────────────────────────────────

describe("TypeScript", () => {
  it("detects a single // comment", () => {
    const r = getRegions("// hello world", "typescript");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("line-comment");
    expect(prefixToString(r[0].prefix)).toBe("// ");
  });

  it("detects a run of // comments", () => {
    const r = getRegions("// line one\n// line two\n// line three", "typescript");
    expect(r).toHaveLength(1);
    expect(r[0].contentRange).toEqual({ startLine: 0, endLine: 2 });
  });

  it("detects /* */ block comment", () => {
    const r = getRegions("/*\n * body\n */", "typescript");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("block-comment");
  });

  it("detects /** */ doc comment", () => {
    const r = getRegions("/**\n * doc body\n */", "typescript");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
  });

  it("does not detect code as comment", () => {
    const r = getRegions("const x = 42;\nlet y = 'hello';", "typescript");
    expect(r).toHaveLength(0);
  });

  it("works with typescriptreact alias", () => {
    const r = getRegions("// tsx comment", "typescriptreact");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("line-comment");
  });
});

describe("JavaScript", () => {
  it("detects // comment", () => {
    const r = getRegions("// js comment", "javascript");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("line-comment");
  });

  it("detects /** */ JSDoc", () => {
    const r = getRegions("/**\n * @param x\n */", "javascript");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
  });

  it("detects single-line block comment", () => {
    const r = getRegions("/* inline comment */", "javascript");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("block-comment");
  });

  it("separates code from comments", () => {
    const r = getRegions("let x = 1;\n// comment\nlet y = 2;", "javascript");
    expect(r).toHaveLength(1);
    expect(r[0].contentRange).toEqual({ startLine: 1, endLine: 1 });
  });

  it("works with javascriptreact alias", () => {
    const r = getRegions("// jsx comment", "javascriptreact");
    expect(r).toHaveLength(1);
  });
});

// ─── Python ──────────────────────────────────────────────────────────

describe("Python", () => {
  it("detects # comment", () => {
    const r = getRegions("# python comment", "python");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("line-comment");
    expect(prefixToString(r[0].prefix)).toBe("# ");
  });

  it("detects multi-line # comment run", () => {
    const r = getRegions("# line one\n# line two", "python");
    expect(r).toHaveLength(1);
    expect(r[0].contentRange).toEqual({ startLine: 0, endLine: 1 });
  });

  it('detects """ docstring', () => {
    const r = getRegions('"""\nDocstring body\n"""', "python");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("docstring");
  });

  it("detects single-line docstring", () => {
    const r = getRegions('"""Single line docstring."""', "python");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("docstring");
  });

  it("does not detect code as comment", () => {
    const r = getRegions("x = 42\ndef foo():\n    pass", "python");
    expect(r).toHaveLength(0);
  });
});

// ─── Go ──────────────────────────────────────────────────────────────

describe("Go", () => {
  it("detects // comment", () => {
    const r = getRegions("// go comment", "go");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("line-comment");
  });

  it("detects multi-line // run", () => {
    const r = getRegions("// line 1\n// line 2\n// line 3", "go");
    expect(r).toHaveLength(1);
  });

  it("detects /* */ block", () => {
    const r = getRegions("/*\nblock body\n*/", "go");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("block-comment");
  });

  it("separates two comment runs", () => {
    const r = getRegions("// first\ncode\n// second", "go");
    expect(r).toHaveLength(2);
  });

  it("does not detect code as comment", () => {
    const r = getRegions("func main() {\n\tfmt.Println()\n}", "go");
    expect(r).toHaveLength(0);
  });
});

// ─── Rust ────────────────────────────────────────────────────────────

describe("Rust", () => {
  it("detects // line comment", () => {
    const r = getRegions("// rust comment", "rust");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("line-comment");
  });

  it("detects /// doc comment", () => {
    const r = getRegions("/// Doc comment\n/// more docs", "rust");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
    expect(prefixToString(r[0].prefix)).toBe("/// ");
  });

  it("detects //! inner doc comment", () => {
    const r = getRegions("//! Crate-level docs\n//! more docs", "rust");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
    expect(prefixToString(r[0].prefix)).toBe("//! ");
  });

  it("detects /* */ block comment", () => {
    const r = getRegions("/* block\ncomment */", "rust");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("block-comment");
  });

  it("does not detect code as comment", () => {
    const r = getRegions("fn main() {\n    println!(\"hi\");\n}", "rust");
    expect(r).toHaveLength(0);
  });

  it("distinguishes /// from // correctly", () => {
    const r = getRegions("/// doc\n// regular", "rust");
    expect(r).toHaveLength(2);
    expect(r[0].kind).toBe("doc-comment");
    expect(r[1].kind).toBe("line-comment");
  });
});

// ─── Dart ────────────────────────────────────────────────────────────

describe("Dart", () => {
  it("detects // line comment", () => {
    const r = getRegions("// dart comment", "dart");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("line-comment");
  });

  it("detects /// doc comment run", () => {
    const r = getRegions("/// Doc comment\n/// more docs", "dart");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
    expect(prefixToString(r[0].prefix)).toBe("/// ");
  });

  it("detects /** */ block doc comment", () => {
    const r = getRegions("/**\n * block doc\n */", "dart");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
  });

  it("distinguishes /// from // correctly", () => {
    const r = getRegions("/// doc\n// regular", "dart");
    expect(r).toHaveLength(2);
    expect(r[0].kind).toBe("doc-comment");
    expect(r[1].kind).toBe("line-comment");
  });
});

// ─── C / C++ ─────────────────────────────────────────────────────────

describe("C", () => {
  it("detects // comment", () => {
    const r = getRegions("// c comment", "c");
    expect(r).toHaveLength(1);
  });

  it("detects /* */ block", () => {
    const r = getRegions("/* block\n * body\n */", "c");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("block-comment");
  });

  it("detects /** */ doc comment", () => {
    const r = getRegions("/**\n * doxygen doc\n */", "c");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
  });

  it("detects /// doc comment", () => {
    const r = getRegions("/// doxygen line doc", "c");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
  });

  it("does not detect code as comment", () => {
    const r = getRegions("#include <stdio.h>\nint main() { return 0; }", "c");
    expect(r).toHaveLength(0);
  });
});

describe("C++", () => {
  it("detects // comment", () => {
    const r = getRegions("// cpp comment", "cpp");
    expect(r).toHaveLength(1);
  });

  it("detects /* */ block", () => {
    const r = getRegions("/* block */", "cpp");
    expect(r).toHaveLength(1);
  });

  it("detects /// doc comment", () => {
    const r = getRegions("/// doxygen\n/// more", "cpp");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
  });

  it("detects /** */ doc block", () => {
    const r = getRegions("/**\n * doc\n */", "cpp");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
  });

  it("does not detect code as comment", () => {
    const r = getRegions("std::cout << x;", "cpp");
    expect(r).toHaveLength(0);
  });
});

// ─── Java ────────────────────────────────────────────────────────────

describe("Java", () => {
  it("detects // comment", () => {
    const r = getRegions("// java comment", "java");
    expect(r).toHaveLength(1);
  });

  it("detects /* */ block", () => {
    const r = getRegions("/* block */", "java");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("block-comment");
  });

  it("detects /** */ Javadoc", () => {
    const r = getRegions("/**\n * Javadoc\n * @param x\n */", "java");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
  });

  it("detects indented // comments", () => {
    const r = getRegions("    // indented\n    // comment", "java");
    expect(r).toHaveLength(1);
    expect(prefixToString(r[0].prefix)).toBe("    // ");
    expect(r[0].innerIndent).toBe(4);
  });

  it("does not detect code as comment", () => {
    const r = getRegions("System.out.println();", "java");
    expect(r).toHaveLength(0);
  });
});

// ─── C# ──────────────────────────────────────────────────────────────

describe("C#", () => {
  it("detects // comment", () => {
    const r = getRegions("// csharp comment", "csharp");
    expect(r).toHaveLength(1);
  });

  it("detects /// XML doc comment", () => {
    const r = getRegions("/// <summary>\n/// Description\n/// </summary>", "csharp");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("doc-comment");
    expect(prefixToString(r[0].prefix)).toBe("/// ");
  });

  it("detects /* */ block", () => {
    const r = getRegions("/* block */", "csharp");
    expect(r).toHaveLength(1);
  });

  it("separates /// from //", () => {
    const r = getRegions("/// doc\n// regular", "csharp");
    expect(r).toHaveLength(2);
    expect(r[0].kind).toBe("doc-comment");
    expect(r[1].kind).toBe("line-comment");
  });

  it("does not detect code as comment", () => {
    const r = getRegions("Console.WriteLine();", "csharp");
    expect(r).toHaveLength(0);
  });
});

// ─── Ruby ────────────────────────────────────────────────────────────

describe("Ruby", () => {
  it("detects # comment", () => {
    const r = getRegions("# ruby comment", "ruby");
    expect(r).toHaveLength(1);
    expect(prefixToString(r[0].prefix)).toBe("# ");
  });

  it("detects multi-line # run", () => {
    const r = getRegions("# line 1\n# line 2\n# line 3", "ruby");
    expect(r).toHaveLength(1);
  });

  it("detects =begin / =end block", () => {
    const r = getRegions("=begin\nblock comment\n=end", "ruby");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("block-comment");
  });

  it("separates comment from code", () => {
    const r = getRegions("x = 1\n# comment\ny = 2", "ruby");
    expect(r).toHaveLength(1);
    expect(r[0].contentRange).toEqual({ startLine: 1, endLine: 1 });
  });

  it("does not detect code as comment", () => {
    const r = getRegions("puts 'hello'", "ruby");
    expect(r).toHaveLength(0);
  });
});

// ─── Shell / Bash ────────────────────────────────────────────────────

describe("Shell", () => {
  it("detects # comment", () => {
    const r = getRegions("# shell comment", "shellscript");
    expect(r).toHaveLength(1);
    expect(prefixToString(r[0].prefix)).toBe("# ");
  });

  it("detects multi-line # run", () => {
    const r = getRegions("# line 1\n# line 2", "shellscript");
    expect(r).toHaveLength(1);
  });

  it("skips shebang on line 0", () => {
    const r = getRegions("#!/usr/bin/env bash\n# real comment", "shellscript");
    expect(r).toHaveLength(1);
    expect(r[0].contentRange).toEqual({ startLine: 1, endLine: 1 });
  });

  it("works with bash alias", () => {
    const r = getRegions("# comment", "bash");
    expect(r).toHaveLength(1);
  });

  it("does not detect code as comment", () => {
    const r = getRegions("echo hello\nls -la", "shellscript");
    expect(r).toHaveLength(0);
  });
});

// ─── CSS ─────────────────────────────────────────────────────────────

describe("CSS", () => {
  it("detects /* */ block comment", () => {
    const r = getRegions("/* css comment */", "css");
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("block-comment");
  });

  it("detects multi-line /* */ block", () => {
    const r = getRegions("/*\n * body\n */", "css");
    expect(r).toHaveLength(1);
  });

  it("detects body prefix in multi-line block", () => {
    const r = getRegions("/*\n * first line\n * second line\n */", "css");
    expect(r).toHaveLength(1);
    expect(r[0].prefix.marker).toBe("*");
  });

  it("works with scss alias", () => {
    const r = getRegions("/* scss comment */", "scss");
    expect(r).toHaveLength(1);
  });

  it("does not detect code as comment", () => {
    const r = getRegions("body { color: red; }", "css");
    expect(r).toHaveLength(0);
  });
});

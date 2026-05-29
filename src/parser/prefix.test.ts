import { describe, it, expect } from "vitest";
import {
  emptyPrefix,
  prefixToString,
  prefixLength,
  normalizePrefix,
  parseLinePrefix,
  parseBlockBodyPrefix,
  prefixFromFirstContentLine,
} from "./prefix";

describe("emptyPrefix", () => {
  it("returns marker-less prefix with no indent", () => {
    const p = emptyPrefix();
    expect(p).toEqual({ indent: "", marker: "", spacing: "" });
  });

  it("returns marker-less prefix with custom indent", () => {
    const p = emptyPrefix("    ");
    expect(p).toEqual({ indent: "    ", marker: "", spacing: "" });
  });
});

describe("prefixToString", () => {
  it("concatenates indent + marker + spacing", () => {
    expect(prefixToString({ indent: "  ", marker: "//", spacing: " " })).toBe("  // ");
  });

  it("handles empty prefix", () => {
    expect(prefixToString(emptyPrefix())).toBe("");
  });

  it("handles marker with no spacing", () => {
    expect(prefixToString({ indent: "", marker: "//", spacing: "" })).toBe("//");
  });

  it("handles multi-space spacing", () => {
    expect(prefixToString({ indent: "", marker: "#", spacing: "  " })).toBe("#  ");
  });
});

describe("prefixLength", () => {
  it("returns total character count", () => {
    expect(prefixLength({ indent: "  ", marker: "//", spacing: " " })).toBe(5);
  });

  it("returns 0 for empty prefix", () => {
    expect(prefixLength(emptyPrefix())).toBe(0);
  });
});

describe("normalizePrefix", () => {
  it("normalizes spacing to single space", () => {
    const p = normalizePrefix({ indent: "", marker: "//", spacing: "   " });
    expect(p).toEqual({ indent: "", marker: "//", spacing: " " });
  });

  it("adds spacing when none exists", () => {
    const p = normalizePrefix({ indent: "", marker: "//", spacing: "" });
    expect(p).toEqual({ indent: "", marker: "//", spacing: " " });
  });

  it("preserves indent", () => {
    const p = normalizePrefix({ indent: "    ", marker: "#", spacing: "\t" });
    expect(p).toEqual({ indent: "    ", marker: "#", spacing: " " });
  });

  it("does nothing for markerless prefix", () => {
    const p = normalizePrefix(emptyPrefix("  "));
    expect(p).toEqual({ indent: "  ", marker: "", spacing: "" });
  });

  it("does nothing for empty prefix", () => {
    const p = normalizePrefix(emptyPrefix());
    expect(p).toEqual(emptyPrefix());
  });
});

describe("parseLinePrefix", () => {
  it("parses // with single space", () => {
    const p = parseLinePrefix("// hello", ["//"]);
    expect(p).toEqual({ indent: "", marker: "//", spacing: " " });
  });

  it("parses // with no space", () => {
    const p = parseLinePrefix("//hello", ["//"]);
    expect(p).toEqual({ indent: "", marker: "//", spacing: "" });
  });

  it("parses // with extra spaces", () => {
    const p = parseLinePrefix("//   hello", ["//"]);
    expect(p).toEqual({ indent: "", marker: "//", spacing: "   " });
  });

  it("parses indented //", () => {
    const p = parseLinePrefix("    // hello", ["//"]);
    expect(p).toEqual({ indent: "    ", marker: "//", spacing: " " });
  });

  it("parses # comment", () => {
    const p = parseLinePrefix("# hello", ["#"]);
    expect(p).toEqual({ indent: "", marker: "#", spacing: " " });
  });

  it("parses #  extra spacing", () => {
    const p = parseLinePrefix("#  extra", ["#"]);
    expect(p).toEqual({ indent: "", marker: "#", spacing: "  " });
  });

  it("prefers longer marker: /// over //", () => {
    const p = parseLinePrefix("/// doc comment", ["//", "///"]);
    expect(p).toEqual({ indent: "", marker: "///", spacing: " " });
  });

  it("prefers longer marker: //! over //", () => {
    const p = parseLinePrefix("//! inner doc", ["//", "///", "//!"]);
    expect(p).toEqual({ indent: "", marker: "//!", spacing: " " });
  });

  it("returns null for non-comment line", () => {
    const p = parseLinePrefix("const x = 1;", ["//"]);
    expect(p).toBeNull();
  });

  it("parses tab-indented comment", () => {
    const p = parseLinePrefix("\t// hello", ["//"]);
    expect(p).toEqual({ indent: "\t", marker: "//", spacing: " " });
  });

  it("parses tab spacing after marker", () => {
    const p = parseLinePrefix("#\thello", ["#"]);
    expect(p).toEqual({ indent: "", marker: "#", spacing: "\t" });
  });
});

describe("parseBlockBodyPrefix", () => {
  it("parses ` * text` body line", () => {
    const p = parseBlockBodyPrefix(" * text", 0);
    expect(p).toEqual({ indent: " ", marker: "*", spacing: " " });
  });

  it("parses `  * text` with outer indent", () => {
    const p = parseBlockBodyPrefix("  * text", 1);
    expect(p).toEqual({ indent: "  ", marker: "*", spacing: " " });
  });

  it("parses `*text` with no spacing", () => {
    const p = parseBlockBodyPrefix("*text", 0);
    expect(p).toEqual({ indent: "", marker: "*", spacing: "" });
  });

  it("falls back to indent-only for non-asterisk lines", () => {
    const p = parseBlockBodyPrefix("  just text", 1);
    expect(p).toEqual({ indent: "  ", marker: "", spacing: "" });
  });
});

describe("prefixFromFirstContentLine", () => {
  it("uses first line with content", () => {
    const lines = ["//", "// actual content", "// more"];
    const p = prefixFromFirstContentLine(lines, ["//"]);
    expect(p).toEqual({ indent: "", marker: "//", spacing: " " });
  });

  it("uses first non-blank content line spacing", () => {
    const lines = ["//", "//   indented content"];
    const p = prefixFromFirstContentLine(lines, ["//"]);
    expect(p).toEqual({ indent: "", marker: "//", spacing: "   " });
  });

  it("falls back to first line if all blank after marker", () => {
    const lines = ["//", "//"];
    const p = prefixFromFirstContentLine(lines, ["//"]);
    expect(p).not.toBeNull();
    expect(p!.marker).toBe("//");
  });

  it("returns null if no lines match", () => {
    const p = prefixFromFirstContentLine(["code here"], ["//"]);
    expect(p).toBeNull();
  });
});

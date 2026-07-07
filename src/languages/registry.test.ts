import { describe, it, expect } from "vitest";
import { getLanguage, getLanguageByExtension, registeredIds } from "./registry";

describe("language registry", () => {
  it("looks up by primary ID", () => {
    const lang = getLanguage("typescript");
    expect(lang).toBeDefined();
    expect(lang!.id).toBe("typescript");
  });

  it("looks up by alias", () => {
    const lang = getLanguage("typescriptreact");
    expect(lang).toBeDefined();
    expect(lang!.id).toBe("typescript");
  });

  it("looks up by extension", () => {
    const lang = getLanguageByExtension(".ts");
    expect(lang).toBeDefined();
    expect(lang!.id).toBe("typescript");
  });

  it("returns undefined for unknown ID", () => {
    expect(getLanguage("unknown-lang")).toBeUndefined();
  });

  it("returns undefined for unknown extension", () => {
    expect(getLanguageByExtension(".xyz")).toBeUndefined();
  });

  it("registers all Tier 1 languages", () => {
    const ids = registeredIds();
    const tier1 = [
      "typescript", "javascript", "python", "go", "rust",
      "c", "cpp", "java", "csharp", "ruby", "shellscript", "css",
    ];
    for (const id of tier1) {
      expect(ids).toContain(id);
    }
  });

  it("looks up shell aliases", () => {
    expect(getLanguage("bash")).toBeDefined();
    expect(getLanguage("bash")!.id).toBe("shellscript");
  });

  it("looks up CSS aliases", () => {
    expect(getLanguage("scss")).toBeDefined();
    expect(getLanguage("scss")!.id).toBe("css");
    expect(getLanguage("less")).toBeDefined();
  });

  it("registers F# and looks it up by ID and extension", () => {
    expect(getLanguage("fsharp")).toBeDefined();
    expect(getLanguage("fsharp")!.id).toBe("fsharp");
    for (const ext of [".fs", ".fsi", ".fsx"]) {
      expect(getLanguageByExtension(ext)?.id).toBe("fsharp");
    }
    expect(getLanguage("fsharp")!.docComments?.line).toContain("///");
  });

  it("registers VB and looks it up by ID and extension", () => {
    expect(getLanguage("vb")).toBeDefined();
    expect(getLanguage("vb")!.id).toBe("vb");
    expect(getLanguageByExtension(".vb")?.id).toBe("vb");
    expect(getLanguage("vb")!.lineComments).toContain("'");
    expect(getLanguage("vb")!.docComments?.line).toContain("'''");
  });

  it("registers Dart and looks it up by ID and extension", () => {
    expect(getLanguage("dart")).toBeDefined();
    expect(getLanguage("dart")!.id).toBe("dart");
    expect(getLanguageByExtension(".dart")?.id).toBe("dart");
    expect(getLanguage("dart")!.lineComments).toContain("//");
    expect(getLanguage("dart")!.docComments?.line).toContain("///");
  });

  it("recognizes Rustdoc /// and //! doc-comment markers", () => {
    const rust = getLanguage("rust");
    expect(rust).toBeDefined();
    expect(rust!.docComments?.line).toContain("///");
    expect(rust!.docComments?.line).toContain("//!");
  });
});

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
});

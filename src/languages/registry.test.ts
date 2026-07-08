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

  it("registers all Tier 2 languages by ID", () => {
    const ids = registeredIds();
    const tier2 = [
      "php", "swift", "kotlin", "scala", "groovy", "objective-c",
      "perl", "r", "julia", "elixir", "erlang", "clojure",
      "yaml", "toml", "ini", "dockerfile", "makefile", "powershell",
      "coffeescript", "lua", "sql", "haskell", "elm", "pascal",
    ];
    for (const id of tier2) {
      expect(ids).toContain(id);
    }
  });

  it("looks up Tier 2 languages by extension", () => {
    const cases: [string, string][] = [
      [".php", "php"],
      [".swift", "swift"],
      [".kt", "kotlin"],
      [".scala", "scala"],
      [".gradle", "groovy"],
      [".mm", "objective-c"],
      [".pl", "perl"],
      [".R", "r"],
      [".jl", "julia"],
      [".exs", "elixir"],
      [".erl", "erlang"],
      [".cljc", "clojure"],
      [".yml", "yaml"],
      [".toml", "toml"],
      [".ini", "ini"],
      [".dockerfile", "dockerfile"],
      [".mk", "makefile"],
      [".ps1", "powershell"],
      [".coffee", "coffeescript"],
      [".lua", "lua"],
      [".sql", "sql"],
      [".hs", "haskell"],
      [".elm", "elm"],
      [".pas", "pascal"],
    ];
    for (const [ext, id] of cases) {
      expect(getLanguageByExtension(ext)?.id).toBe(id);
    }
  });

  it("resolves Tier 2 aliases", () => {
    expect(getLanguage("objective-cpp")?.id).toBe("objective-c");
    expect(getLanguage("objectpascal")?.id).toBe("pascal");
  });

  it("defines expected comment markers for representative Tier 2 languages", () => {
    expect(getLanguage("swift")!.docComments?.line).toContain("///");
    expect(getLanguage("php")!.lineComments).toEqual(["//", "#"]);
    expect(getLanguage("lua")!.blockComments).toContainEqual(["--[[", "]]"]);
    expect(getLanguage("julia")!.blockComments).toContainEqual(["#=", "=#"]);
    expect(getLanguage("powershell")!.blockComments).toContainEqual(["<#", "#>"]);
    expect(getLanguage("haskell")!.blockComments).toContainEqual(["{-", "-}"]);
    expect(getLanguage("elm")!.docComments?.block).toEqual(["{-|", "-}"]);
    expect(getLanguage("erlang")!.lineComments).toEqual(["%"]);
    expect(getLanguage("clojure")!.lineComments).toEqual([";"]);
    expect(getLanguage("ini")!.lineComments).toEqual([";", "#"]);
    expect(getLanguage("r")!.docComments?.line).toContain("#'");
    expect(getLanguage("pascal")!.blockComments).toContainEqual(["(*", "*)"]);
  });
});

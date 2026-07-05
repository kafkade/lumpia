import type { LanguageDefinition } from "../types";

/**
 * .NET languages (besides C#, which lives in c-family) that use XML
 * documentation comments: F# and Visual Basic.
 */

export const fsharp: LanguageDefinition = {
  id: "fsharp",
  aliases: [],
  extensions: [".fs", ".fsi", ".fsx"],
  lineComments: ["//"],
  blockComments: [["(*", "*)"]],
  docComments: { line: ["///"] },
};

export const vb: LanguageDefinition = {
  id: "vb",
  aliases: [],
  extensions: [".vb"],
  lineComments: ["'"],
  blockComments: [],
  docComments: { line: ["'''"] },
};

export const dotnetFamilyLanguages: LanguageDefinition[] = [fsharp, vb];

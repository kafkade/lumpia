import type { LanguageDefinition } from "../types";

export const typescript: LanguageDefinition = {
  id: "typescript",
  aliases: ["typescriptreact"],
  extensions: [".ts", ".tsx"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { block: ["/**", "*/"] },
};

export const javascript: LanguageDefinition = {
  id: "javascript",
  aliases: ["javascriptreact"],
  extensions: [".js", ".jsx", ".mjs", ".cjs"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { block: ["/**", "*/"] },
};

export const go: LanguageDefinition = {
  id: "go",
  aliases: [],
  extensions: [".go"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
};

export const rust: LanguageDefinition = {
  id: "rust",
  aliases: [],
  extensions: [".rs"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { line: ["///", "//!"] },
};

export const c: LanguageDefinition = {
  id: "c",
  aliases: [],
  extensions: [".c", ".h"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { line: ["///"], block: ["/**", "*/"] },
};

export const cpp: LanguageDefinition = {
  id: "cpp",
  aliases: [],
  extensions: [".cpp", ".hpp", ".cc", ".cxx", ".hh"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { line: ["///"], block: ["/**", "*/"] },
};

export const java: LanguageDefinition = {
  id: "java",
  aliases: [],
  extensions: [".java"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { block: ["/**", "*/"] },
};

export const csharp: LanguageDefinition = {
  id: "csharp",
  aliases: [],
  extensions: [".cs"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { line: ["///"] },
};

export const dart: LanguageDefinition = {
  id: "dart",
  aliases: [],
  extensions: [".dart"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { line: ["///"], block: ["/**", "*/"] },
};

export const cFamilyLanguages: LanguageDefinition[] = [
  typescript,
  javascript,
  go,
  rust,
  c,
  cpp,
  java,
  csharp,
  dart,
];

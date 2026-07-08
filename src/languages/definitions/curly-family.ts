import type { LanguageDefinition } from "../types";

/**
 * Tier 2 curly-brace languages that use C-style `//` line comments and
 * `/* *\/` block comments, most with a `/** *\/` doc-comment idiom.
 */

export const php: LanguageDefinition = {
  id: "php",
  aliases: [],
  extensions: [".php", ".phtml"],
  lineComments: ["//", "#"],
  blockComments: [["/*", "*/"]],
  docComments: { block: ["/**", "*/"] },
};

export const swift: LanguageDefinition = {
  id: "swift",
  aliases: [],
  extensions: [".swift"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { line: ["///"], block: ["/**", "*/"] },
};

export const kotlin: LanguageDefinition = {
  id: "kotlin",
  aliases: [],
  extensions: [".kt", ".kts"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { block: ["/**", "*/"] },
};

export const scala: LanguageDefinition = {
  id: "scala",
  aliases: [],
  extensions: [".scala", ".sc"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { block: ["/**", "*/"] },
};

export const groovy: LanguageDefinition = {
  id: "groovy",
  aliases: [],
  extensions: [".groovy", ".gradle"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { block: ["/**", "*/"] },
};

export const objectiveC: LanguageDefinition = {
  id: "objective-c",
  aliases: ["objective-cpp"],
  extensions: [".m", ".mm"],
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
  docComments: { block: ["/**", "*/"] },
};

export const curlyFamilyLanguages: LanguageDefinition[] = [
  php,
  swift,
  kotlin,
  scala,
  groovy,
  objectiveC,
];

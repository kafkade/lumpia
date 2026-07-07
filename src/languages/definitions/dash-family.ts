import type { LanguageDefinition } from "../types";

/**
 * Tier 2 languages that use `--` line comments (Lua, SQL, Haskell, Elm) plus
 * Pascal, grouped here for their distinctive block-comment styles.
 */

export const lua: LanguageDefinition = {
  id: "lua",
  aliases: [],
  extensions: [".lua"],
  lineComments: ["--"],
  blockComments: [["--[[", "]]"]],
};

export const sql: LanguageDefinition = {
  id: "sql",
  aliases: [],
  extensions: [".sql"],
  lineComments: ["--"],
  blockComments: [["/*", "*/"]],
};

export const haskell: LanguageDefinition = {
  id: "haskell",
  aliases: [],
  extensions: [".hs"],
  lineComments: ["--"],
  blockComments: [["{-", "-}"]],
};

export const elm: LanguageDefinition = {
  id: "elm",
  aliases: [],
  extensions: [".elm"],
  lineComments: ["--"],
  blockComments: [["{-", "-}"]],
  docComments: { block: ["{-|", "-}"] },
};

export const pascal: LanguageDefinition = {
  id: "pascal",
  aliases: ["objectpascal"],
  extensions: [".pas", ".pp"],
  lineComments: ["//"],
  blockComments: [
    ["{", "}"],
    ["(*", "*)"],
  ],
};

export const dashFamilyLanguages: LanguageDefinition[] = [
  lua,
  sql,
  haskell,
  elm,
  pascal,
];

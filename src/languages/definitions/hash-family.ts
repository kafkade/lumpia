import type { LanguageDefinition } from "../types";

/**
 * Tier 2 languages whose primary comment marker is a single character:
 * `#` (most), `%` (Erlang), or `;` (Clojure, INI). A few carry an extra
 * block-comment or doc-comment idiom.
 */

export const perl: LanguageDefinition = {
  id: "perl",
  aliases: [],
  extensions: [".pl", ".pm", ".t"],
  lineComments: ["#"],
  blockComments: [],
};

export const r: LanguageDefinition = {
  id: "r",
  aliases: [],
  extensions: [".r", ".R"],
  lineComments: ["#"],
  blockComments: [],
  docComments: { line: ["#'"] },
};

export const julia: LanguageDefinition = {
  id: "julia",
  aliases: [],
  extensions: [".jl"],
  lineComments: ["#"],
  blockComments: [["#=", "=#"]],
};

export const elixir: LanguageDefinition = {
  id: "elixir",
  aliases: [],
  extensions: [".ex", ".exs"],
  lineComments: ["#"],
  blockComments: [],
};

export const erlang: LanguageDefinition = {
  id: "erlang",
  aliases: [],
  extensions: [".erl", ".hrl"],
  lineComments: ["%"],
  blockComments: [],
};

export const clojure: LanguageDefinition = {
  id: "clojure",
  aliases: [],
  extensions: [".clj", ".cljs", ".cljc", ".edn"],
  lineComments: [";"],
  blockComments: [],
};

export const yaml: LanguageDefinition = {
  id: "yaml",
  aliases: [],
  extensions: [".yaml", ".yml"],
  lineComments: ["#"],
  blockComments: [],
};

export const toml: LanguageDefinition = {
  id: "toml",
  aliases: [],
  extensions: [".toml"],
  lineComments: ["#"],
  blockComments: [],
};

export const ini: LanguageDefinition = {
  id: "ini",
  aliases: [],
  extensions: [".ini", ".cfg"],
  lineComments: [";", "#"],
  blockComments: [],
};

export const dockerfile: LanguageDefinition = {
  id: "dockerfile",
  aliases: [],
  extensions: [".dockerfile"],
  lineComments: ["#"],
  blockComments: [],
};

export const makefile: LanguageDefinition = {
  id: "makefile",
  aliases: [],
  extensions: [".mk"],
  lineComments: ["#"],
  blockComments: [],
};

export const powershell: LanguageDefinition = {
  id: "powershell",
  aliases: [],
  extensions: [".ps1", ".psm1", ".psd1"],
  lineComments: ["#"],
  blockComments: [["<#", "#>"]],
};

export const coffeescript: LanguageDefinition = {
  id: "coffeescript",
  aliases: [],
  extensions: [".coffee"],
  lineComments: ["#"],
  blockComments: [["###", "###"]],
};

export const hashFamilyLanguages: LanguageDefinition[] = [
  perl,
  r,
  julia,
  elixir,
  erlang,
  clojure,
  yaml,
  toml,
  ini,
  dockerfile,
  makefile,
  powershell,
  coffeescript,
];

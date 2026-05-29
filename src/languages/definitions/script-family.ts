import type { LanguageDefinition } from "../types";

export const python: LanguageDefinition = {
  id: "python",
  aliases: [],
  extensions: [".py", ".pyi"],
  lineComments: ["#"],
  blockComments: [],
  docstrings: [['"""', '"""'], ["'''", "'''"]],
};

export const ruby: LanguageDefinition = {
  id: "ruby",
  aliases: [],
  extensions: [".rb", ".rake", ".gemspec"],
  lineComments: ["#"],
  blockComments: [["=begin", "=end"]],
};

export const shellscript: LanguageDefinition = {
  id: "shellscript",
  aliases: ["bash"],
  extensions: [".sh", ".bash", ".zsh"],
  lineComments: ["#"],
  blockComments: [],
};

export const scriptFamilyLanguages: LanguageDefinition[] = [
  python,
  ruby,
  shellscript,
];

import type { LanguageDefinition } from "../types";

export const css: LanguageDefinition = {
  id: "css",
  aliases: ["scss", "less"],
  extensions: [".css", ".scss", ".less"],
  lineComments: [],
  blockComments: [["/*", "*/"]],
};

export const styleLanguages: LanguageDefinition[] = [css];

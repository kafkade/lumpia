import type { LanguageDefinition } from "./types";
import { cFamilyLanguages } from "./definitions/c-family";
import { scriptFamilyLanguages } from "./definitions/script-family";
import { styleLanguages } from "./definitions/styles";

const byId = new Map<string, LanguageDefinition>();

function register(def: LanguageDefinition): void {
  byId.set(def.id, def);
  for (const alias of def.aliases) {
    byId.set(alias, def);
  }
}

// Register all built-in languages
for (const def of [
  ...cFamilyLanguages,
  ...scriptFamilyLanguages,
  ...styleLanguages,
]) {
  register(def);
}

/** Look up a language by VS Code language ID. */
export function getLanguage(id: string): LanguageDefinition | undefined {
  return byId.get(id);
}

/** Look up a language by file extension (e.g. `".ts"`). */
export function getLanguageByExtension(
  ext: string
): LanguageDefinition | undefined {
  for (const def of new Set(byId.values())) {
    if (def.extensions.includes(ext)) return def;
  }
  return undefined;
}

/** All registered language IDs (including aliases). */
export function registeredIds(): string[] {
  return [...byId.keys()];
}

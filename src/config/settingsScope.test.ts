import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Guards issue #62: every contributed Lumpia setting must declare the
 * `language-overridable` scope so VS Code applies per-language `[language]`
 * overrides. A `window`-scoped setting silently ignores language overrides.
 */

interface ConfigProperty {
  scope?: string;
}

function readLumpiaProperties(): Record<string, ConfigProperty> {
  const pkgPath = fileURLToPath(new URL("../../package.json", import.meta.url));
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
    contributes?: {
      configuration?: { properties?: Record<string, ConfigProperty> };
    };
  };
  const properties = pkg.contributes?.configuration?.properties ?? {};
  return Object.fromEntries(
    Object.entries(properties).filter(([key]) => key.startsWith("lumpia."))
  );
}

describe("Lumpia settings scope (issue #62)", () => {
  const properties = readLumpiaProperties();

  it("contributes at least one lumpia.* setting", () => {
    expect(Object.keys(properties).length).toBeGreaterThan(0);
  });

  it.each(Object.keys(properties))(
    "%s is language-overridable",
    (key) => {
      expect(properties[key].scope).toBe("language-overridable");
    }
  );
});

/**
 * Golden test runner — auto-discovers fixture pairs in src/test/fixtures/
 * and verifies that rollText(input, column) === expected for each one.
 *
 * Fixture format:
 *   {name}.input.txt    — input text
 *   {name}.expected.txt  — expected output after wrapping
 *   {name}.meta.json     — optional { "column": N, "tabWidth": N }
 *
 * Defaults: column = 80, tabWidth = 4.
 * Per-directory meta.json provides directory-level defaults.
 */

import { describe, it, expect } from "vitest";
import { rollText } from "../engine/wrapper";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";

interface FixtureMeta {
  column: number;
  tabWidth: number;
}

const DEFAULT_META: FixtureMeta = { column: 80, tabWidth: 4 };

interface Fixture {
  name: string;
  category: string;
  inputPath: string;
  expectedPath: string;
  meta: FixtureMeta;
}

function loadMeta(name: string, dir: string): FixtureMeta {
  const perFixture = join(dir, `${name}.meta.json`);
  if (existsSync(perFixture)) {
    return {
      ...DEFAULT_META,
      ...JSON.parse(readFileSync(perFixture, "utf-8")),
    };
  }
  const dirMeta = join(dir, "meta.json");
  if (existsSync(dirMeta)) {
    return {
      ...DEFAULT_META,
      ...JSON.parse(readFileSync(dirMeta, "utf-8")),
    };
  }
  return DEFAULT_META;
}

function discoverFixtures(root: string): Fixture[] {
  const results: Fixture[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir).sort()) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".input.txt")) {
        const name = entry.replace(/\.input\.txt$/, "");
        const expectedPath = join(dir, `${name}.expected.txt`);
        if (existsSync(expectedPath)) {
          const category = relative(root, dir).replace(/\\/g, "/");
          results.push({
            name,
            category: category || "root",
            inputPath: fullPath,
            expectedPath,
            meta: loadMeta(name, dir),
          });
        }
      }
    }
  }

  walk(root);
  return results;
}

// ── Run ──────────────────────────────────────────────────────────────

const fixturesDir = join(__dirname, "fixtures");
const fixtures = discoverFixtures(fixturesDir);

describe("golden fixtures", () => {
  it("discovers at least 50 fixtures", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(50);
  });

  for (const fixture of fixtures) {
    it(`${fixture.category}/${fixture.name}`, () => {
      const input = readFileSync(fixture.inputPath, "utf-8").replace(
        /\r\n/g,
        "\n"
      );
      const expected = readFileSync(fixture.expectedPath, "utf-8").replace(
        /\r\n/g,
        "\n"
      );
      const { column, tabWidth } = fixture.meta;
      const actual = rollText(input, column, { tabWidth });
      expect(actual).toBe(expected);
    });
  }
});

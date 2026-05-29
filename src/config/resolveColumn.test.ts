import { describe, it, expect } from "vitest";
import {
  resolveColumn,
  RulerCycleState,
  parseRulers,
} from "./resolveColumn";

// ── resolveColumn ────────────────────────────────────────────────────

describe("resolveColumn", () => {
  it("returns default 80 with empty config", () => {
    expect(resolveColumn({})).toBe(80);
  });

  it("returns explicit arg when provided (highest precedence)", () => {
    expect(
      resolveColumn({
        explicitArg: 120,
        rulerCycleValue: 100,
        languageColumn: 79,
        globalColumn: 80,
        rulers: [72],
        wordWrapColumn: 90,
      })
    ).toBe(120);
  });

  it("returns ruler cycle value at level 2", () => {
    expect(
      resolveColumn({
        rulerCycleValue: 100,
        languageColumn: 79,
        globalColumn: 80,
        rulers: [72],
        wordWrapColumn: 90,
      })
    ).toBe(100);
  });

  it("returns language-specific column at level 3", () => {
    expect(
      resolveColumn({
        languageColumn: 79,
        globalColumn: 80,
        rulers: [72],
        wordWrapColumn: 90,
      })
    ).toBe(79);
  });

  it("returns global column at level 4", () => {
    expect(
      resolveColumn({
        globalColumn: 80,
        rulers: [72],
        wordWrapColumn: 90,
      })
    ).toBe(80);
  });

  it("returns first ruler at level 5", () => {
    expect(
      resolveColumn({
        rulers: [72, 100],
        wordWrapColumn: 90,
      })
    ).toBe(72);
  });

  it("returns wordWrapColumn at level 6", () => {
    expect(resolveColumn({ wordWrapColumn: 90 })).toBe(90);
  });

  it("ignores zero/negative explicitArg", () => {
    expect(resolveColumn({ explicitArg: 0, globalColumn: 100 })).toBe(100);
    expect(resolveColumn({ explicitArg: -1, globalColumn: 100 })).toBe(100);
  });

  it("ignores zero/negative globalColumn", () => {
    expect(resolveColumn({ globalColumn: 0 })).toBe(80);
  });

  it("ignores empty rulers array", () => {
    expect(resolveColumn({ rulers: [] })).toBe(80);
  });

  it("ignores zero ruler value", () => {
    expect(resolveColumn({ rulers: [0], wordWrapColumn: 90 })).toBe(90);
  });
});

// ── RulerCycleState ──────────────────────────────────────────────────

describe("RulerCycleState", () => {
  it("cycles through rulers", () => {
    const state = new RulerCycleState();
    const rulers = [72, 80, 100];

    expect(state.next("doc1", rulers)).toBe(72);
    expect(state.next("doc1", rulers)).toBe(80);
    expect(state.next("doc1", rulers)).toBe(100);
    expect(state.next("doc1", rulers)).toBe(72); // wraps around
  });

  it("tracks state per document", () => {
    const state = new RulerCycleState();
    const rulers = [72, 80];

    expect(state.next("doc1", rulers)).toBe(72);
    expect(state.next("doc2", rulers)).toBe(72); // independent
    expect(state.next("doc1", rulers)).toBe(80);
    expect(state.next("doc2", rulers)).toBe(80);
  });

  it("returns undefined for empty rulers", () => {
    const state = new RulerCycleState();
    expect(state.next("doc1", [])).toBeUndefined();
  });

  it("current returns undefined before first cycle", () => {
    const state = new RulerCycleState();
    expect(state.current("doc1", [72, 80])).toBeUndefined();
  });

  it("current returns last cycled value", () => {
    const state = new RulerCycleState();
    state.next("doc1", [72, 80]);
    expect(state.current("doc1", [72, 80])).toBe(72);
    state.next("doc1", [72, 80]);
    expect(state.current("doc1", [72, 80])).toBe(80);
  });

  it("reset clears state for a document", () => {
    const state = new RulerCycleState();
    state.next("doc1", [72, 80]);
    state.reset("doc1");
    expect(state.current("doc1", [72, 80])).toBeUndefined();
    expect(state.next("doc1", [72, 80])).toBe(72);
  });

  it("clear removes all state", () => {
    const state = new RulerCycleState();
    state.next("doc1", [72, 80]);
    state.next("doc2", [72, 80]);
    state.clear();
    expect(state.current("doc1", [72, 80])).toBeUndefined();
    expect(state.current("doc2", [72, 80])).toBeUndefined();
  });
});

// ── parseRulers ──────────────────────────────────────────────────────

describe("parseRulers", () => {
  it("extracts numeric rulers", () => {
    expect(parseRulers([72, 80, 100])).toEqual([72, 80, 100]);
  });

  it("extracts object rulers with column property", () => {
    expect(
      parseRulers([{ column: 72, color: "#ff0000" }, { column: 100 }])
    ).toEqual([72, 100]);
  });

  it("handles mixed numeric and object rulers", () => {
    expect(parseRulers([72, { column: 100 }])).toEqual([72, 100]);
  });

  it("filters out invalid values", () => {
    expect(parseRulers(["bad", null, undefined, {}] as unknown[])).toEqual([]);
  });

  it("returns empty for undefined", () => {
    expect(parseRulers(undefined)).toEqual([]);
  });

  it("includes zero rulers", () => {
    // Zero means "unwrap" per ADR-004
    expect(parseRulers([0, 80])).toEqual([0, 80]);
  });

  it("filters negative values", () => {
    expect(parseRulers([-1, 80])).toEqual([80]);
  });
});

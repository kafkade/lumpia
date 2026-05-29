/**
 * Column/config resolution with precedence model (ADR-004).
 *
 * Resolves the target wrapping column from multiple sources
 * with a clear, documented precedence chain.
 */

/** Abstraction of the configuration sources for testability. */
export interface ColumnConfig {
  /** Column from an explicit command argument (e.g. lumpia.rollAtColumn prompt). */
  explicitArg?: number;
  /** Currently selected ruler value from cycling state (per-document, per-session). */
  rulerCycleValue?: number;
  /** Language-specific lumpia.column from [language] settings. */
  languageColumn?: number;
  /** Global lumpia.column from user/workspace settings. */
  globalColumn?: number;
  /** editor.rulers values (may include objects with { column } shape). */
  rulers?: number[];
  /** editor.wordWrapColumn value. */
  wordWrapColumn?: number;
}

/**
 * Resolve the target column with precedence (highest to lowest):
 *
 * 1. Explicit command argument (lumpia.rollAtColumn)
 * 2. Ruler cycling state (per-document, per-session)
 * 3. Language-specific lumpia.column
 * 4. Global lumpia.column
 * 5. editor.rulers (first value)
 * 6. editor.wordWrapColumn
 * 7. Default: 80
 */
export function resolveColumn(config: ColumnConfig): number {
  if (config.explicitArg !== undefined && config.explicitArg > 0) {
    return config.explicitArg;
  }
  if (config.rulerCycleValue !== undefined && config.rulerCycleValue > 0) {
    return config.rulerCycleValue;
  }
  if (config.languageColumn !== undefined && config.languageColumn > 0) {
    return config.languageColumn;
  }
  if (config.globalColumn !== undefined && config.globalColumn > 0) {
    return config.globalColumn;
  }
  if (config.rulers && config.rulers.length > 0 && config.rulers[0] > 0) {
    return config.rulers[0];
  }
  if (config.wordWrapColumn !== undefined && config.wordWrapColumn > 0) {
    return config.wordWrapColumn;
  }
  return 80;
}

/**
 * Manages per-document ruler cycling state.
 *
 * When multiple editor.rulers are configured and lumpia.column is not set,
 * repeated invocations cycle through ruler values for the same document.
 */
export class RulerCycleState {
  private state = new Map<string, number>();

  /** Get the next ruler value for a document, cycling through the list. */
  next(documentKey: string, rulers: number[]): number | undefined {
    if (rulers.length === 0) return undefined;

    const currentIndex = this.state.get(documentKey) ?? -1;
    const nextIndex = (currentIndex + 1) % rulers.length;
    this.state.set(documentKey, nextIndex);
    return rulers[nextIndex];
  }

  /** Get the current ruler value without advancing. */
  current(documentKey: string, rulers: number[]): number | undefined {
    if (rulers.length === 0) return undefined;
    const index = this.state.get(documentKey);
    if (index === undefined) return undefined;
    return rulers[index % rulers.length];
  }

  /** Reset cycling state for a document. */
  reset(documentKey: string): void {
    this.state.delete(documentKey);
  }

  /** Clear all cycling state. */
  clear(): void {
    this.state.clear();
  }
}

/** Extract numeric ruler values from VS Code's editor.rulers config.
 *  Rulers can be numbers or objects with a `column` property. */
export function parseRulers(
  rulers: unknown[] | undefined
): number[] {
  if (!rulers) return [];
  return rulers
    .map((r) => {
      if (typeof r === "number") return r;
      if (typeof r === "object" && r !== null && "column" in r) {
        const col = (r as { column: unknown }).column;
        if (typeof col === "number") return col;
      }
      return undefined;
    })
    .filter((v): v is number => v !== undefined && v >= 0);
}

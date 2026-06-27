/**
 * Pure parsing/validation for the `lumpia.rollAtColumn` input box.
 *
 * Extracted verbatim from the command handler so the empty→unwrap and
 * integer-validation rules can be unit-tested without VS Code. Behaviour is
 * intentionally identical to the original inline logic.
 */

import { UNWRAP_COLUMN } from "../config/resolveColumn";

/** Error shown when the input is neither empty nor a positive integer. */
export const COLUMN_INPUT_ERROR =
  "Enter a positive integer, or leave empty to unwrap";

/**
 * Validate the raw input-box value.
 *
 * Mirrors VS Code's `validateInput` contract: returns an error message string
 * when the value is invalid, or `null` when it is acceptable. An empty (or
 * whitespace-only) value is valid and signifies unwrap.
 */
export function validateColumnInput(value: string): string | null {
  if (value.trim() === "") return null;
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num < 1) return COLUMN_INPUT_ERROR;
  return null;
}

/**
 * Map a validated input-box value to a target column.
 *
 * An empty (or whitespace-only) value yields {@link UNWRAP_COLUMN}; otherwise
 * the parsed positive integer. Callers must validate first via
 * {@link validateColumnInput}.
 */
export function parseColumnInput(value: string): number {
  if (value.trim() === "") return UNWRAP_COLUMN;
  return parseInt(value, 10);
}

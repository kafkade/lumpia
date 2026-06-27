import { describe, it, expect } from "vitest";
import { UNWRAP_COLUMN } from "../config/resolveColumn";
import {
  validateColumnInput,
  parseColumnInput,
  COLUMN_INPUT_ERROR,
} from "./columnInput";

// ── validateColumnInput ──────────────────────────────────────────────

describe("validateColumnInput", () => {
  it("accepts empty input (unwrap)", () => {
    expect(validateColumnInput("")).toBeNull();
  });

  it("accepts whitespace-only input as empty (unwrap)", () => {
    expect(validateColumnInput("   ")).toBeNull();
  });

  it("accepts positive integers", () => {
    expect(validateColumnInput("1")).toBeNull();
    expect(validateColumnInput("80")).toBeNull();
    expect(validateColumnInput("120")).toBeNull();
  });

  it("accepts integers with surrounding whitespace", () => {
    expect(validateColumnInput(" 100 ")).toBeNull();
  });

  it("rejects zero", () => {
    expect(validateColumnInput("0")).toBe(COLUMN_INPUT_ERROR);
  });

  it("rejects negative numbers", () => {
    expect(validateColumnInput("-5")).toBe(COLUMN_INPUT_ERROR);
  });

  it("rejects non-numeric input", () => {
    expect(validateColumnInput("abc")).toBe(COLUMN_INPUT_ERROR);
  });
});

// ── parseColumnInput ─────────────────────────────────────────────────

describe("parseColumnInput", () => {
  it("maps empty input to UNWRAP_COLUMN", () => {
    expect(parseColumnInput("")).toBe(UNWRAP_COLUMN);
  });

  it("maps whitespace-only input to UNWRAP_COLUMN", () => {
    expect(parseColumnInput("   ")).toBe(UNWRAP_COLUMN);
  });

  it("parses a positive integer", () => {
    expect(parseColumnInput("80")).toBe(80);
    expect(parseColumnInput("1")).toBe(1);
  });

  it("parses an integer with surrounding whitespace", () => {
    expect(parseColumnInput(" 120 ")).toBe(120);
  });
});

// ── consistency between the two helpers ──────────────────────────────

describe("validateColumnInput / parseColumnInput consistency", () => {
  it("every value that validates produces a usable column", () => {
    for (const value of ["", "   ", "1", "80", " 100 "]) {
      expect(validateColumnInput(value)).toBeNull();
      const column = parseColumnInput(value);
      expect(Number.isInteger(column)).toBe(true);
      expect(column).toBeGreaterThan(0);
    }
  });
});

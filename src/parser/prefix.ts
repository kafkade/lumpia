import type { CommentPrefix } from "./types";

/** An empty prefix for plaintext/docstring regions with no marker. */
export function emptyPrefix(indent = ""): CommentPrefix {
  return { indent, marker: "", spacing: "" };
}

/** Serialize a structured prefix to a flat string. */
export function prefixToString(p: CommentPrefix): string {
  return p.indent + p.marker + p.spacing;
}

/** Length of the prefix in characters. */
export function prefixLength(p: CommentPrefix): number {
  return p.indent.length + p.marker.length + p.spacing.length;
}

/**
 * Normalize spacing to a single space after the marker.
 * Does nothing for markerless prefixes (plaintext/docstring).
 */
export function normalizePrefix(p: CommentPrefix): CommentPrefix {
  if (!p.marker) return p;
  return { indent: p.indent, marker: p.marker, spacing: " " };
}

/**
 * Parse a line comment prefix from a line, given a set of markers.
 * Markers are checked longest-first to avoid `//` matching before `///`.
 * Returns null if the line doesn't match any marker.
 */
export function parseLinePrefix(
  line: string,
  markers: string[]
): CommentPrefix | null {
  const sorted = [...markers].sort((a, b) => b.length - a.length);
  for (const marker of sorted) {
    const regex = new RegExp(
      `^([ \\t]*)(${escapeRegex(marker)})([ \\t]*)`
    );
    const m = line.match(regex);
    if (m) {
      return { indent: m[1], marker: m[2], spacing: m[3] };
    }
  }
  return null;
}

/**
 * Parse a block comment body line prefix (e.g., ` * text` → indent=" ", marker="*", spacing=" ").
 * Falls back to indent-only prefix if no `*` pattern found.
 */
export function parseBlockBodyPrefix(
  line: string,
  outerIndent: number
): CommentPrefix {
  const match = line.match(/^([ \t]*)\*([ \t]*)/);
  if (match) {
    return { indent: match[1], marker: "*", spacing: match[2] };
  }
  return emptyPrefix(" ".repeat(outerIndent + 1));
}

/**
 * Given a run of content lines, find the prefix from the first non-blank
 * content line (the first line whose post-marker text is non-empty).
 * Falls back to the first line if all lines are blank after the marker.
 */
export function prefixFromFirstContentLine(
  lines: string[],
  markers: string[]
): CommentPrefix | null {
  let firstMatch: CommentPrefix | null = null;
  for (const line of lines) {
    const prefix = parseLinePrefix(line, markers);
    if (!prefix) continue;
    if (!firstMatch) firstMatch = prefix;
    // Check if there's actual content after the prefix
    const afterPrefix = line.slice(
      prefix.indent.length + prefix.marker.length + prefix.spacing.length
    );
    if (afterPrefix.trim().length > 0) {
      return prefix;
    }
  }
  return firstMatch;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

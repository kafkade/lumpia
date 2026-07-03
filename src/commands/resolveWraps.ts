/**
 * Selection-to-edits resolution for the wrapping commands.
 *
 * Given a document and a set of cursor/selection positions, determines
 * which regions to wrap and returns the edits to apply. Handles all
 * scenarios from the behavior matrix (#54):
 *
 * - Empty cursor in comment  → wrap whole comment
 * - Empty cursor on code     → no-op
 * - Selection in comment     → wrap only selected lines
 * - Selection across regions → wrap each comment independently
 * - Code + comments          → wrap comments only
 * - Markdown/plaintext       → wrap paragraphs directly
 * - Multiple cursors         → each processed independently
 */

import type { DocumentLike, WrappableRegion } from "../parser/types";
import { RegexRegionProvider } from "../parser/regexProvider";
import { prefixToString } from "../parser/prefix";
import { wrapRegion, rollText, type WrapOptions } from "../engine/wrapper";

// ── Public types ─────────────────────────────────────────────────────

export interface SelectionInfo {
  startLine: number;
  endLine: number;
  isEmpty: boolean;
  activeLine: number;
}

export interface WrapEdit {
  startLine: number;
  endLine: number;
  replacement: string;
}

export interface WrapContext {
  column: number;
  tabWidth?: number;
  reformat?: boolean;
  /** When true (default), empty cursor wraps full comment; when false, wraps only the paragraph within the comment. */
  wholeComment?: boolean;
  /** When true, insert two spaces after sentence-ending punctuation. */
  doubleSentenceSpacing?: boolean;
}

// ── Main entry point ─────────────────────────────────────────────────

const PLAINTEXT_LANGUAGES = new Set(["plaintext", "markdown"]);

export function resolveWraps(
  document: DocumentLike,
  selections: SelectionInfo[],
  context: WrapContext
): WrapEdit[] {
  const {
    column,
    tabWidth = 4,
    reformat = false,
    wholeComment = true,
    doubleSentenceSpacing = false,
  } = context;
  const wrapOpts: WrapOptions = { tabWidth, doubleSentenceSpacing };
  const isPlaintext = PLAINTEXT_LANGUAGES.has(document.languageId);

  // For code files, detect all comment regions in the document once
  let allRegions: WrappableRegion[] | null = null;
  if (!isPlaintext) {
    allRegions = new RegexRegionProvider().getRegions(document, {
      startLine: 0,
      startCol: 0,
      endLine: document.lineCount - 1,
      endCol: 0,
    });
  }

  const edits: WrapEdit[] = [];

  for (const sel of selections) {
    if (isPlaintext) {
      resolvePlaintext(document, sel, column, wrapOpts, edits);
    } else {
      resolveCode(
        document,
        sel,
        allRegions!,
        column,
        reformat,
        wholeComment,
        wrapOpts,
        edits
      );
    }
  }

  return deduplicateEdits(edits);
}

// ── Plaintext / Markdown ─────────────────────────────────────────────

function resolvePlaintext(
  document: DocumentLike,
  sel: SelectionInfo,
  column: number,
  wrapOpts: WrapOptions,
  edits: WrapEdit[]
): void {
  let startLine: number;
  let endLine: number;

  if (sel.isEmpty) {
    if (document.lineAt(sel.activeLine).trim() === "") return;
    const para = expandToParagraph(document, sel.activeLine);
    startLine = para.startLine;
    endLine = para.endLine;
  } else {
    startLine = sel.startLine;
    endLine = sel.endLine;
  }

  const text = getTextForLines(document, startLine, endLine);
  const wrapped = rollText(text, column, wrapOpts);
  if (wrapped !== text) {
    edits.push({ startLine, endLine, replacement: wrapped });
  }
}

// ── Code files (comment-aware) ───────────────────────────────────────

function resolveCode(
  document: DocumentLike,
  sel: SelectionInfo,
  allRegions: WrappableRegion[],
  column: number,
  reformat: boolean,
  wholeComment: boolean,
  wrapOpts: WrapOptions,
  edits: WrapEdit[]
): void {
  if (sel.isEmpty) {
    // Find the region containing the cursor
    const region = allRegions.find(
      (r) =>
        sel.activeLine >= r.range.startLine &&
        sel.activeLine <= r.range.endLine
    );
    if (!region) return; // Cursor on code line → no-op

    if (wholeComment) {
      wrapFullRegion(document, region, column, reformat, wrapOpts, edits);
    } else {
      // Wrap only the paragraph within the comment
      const para = findParagraphInRegion(document, region, sel.activeLine);
      if (!para) return; // Cursor on blank comment line → no-op
      const clipped: WrappableRegion = {
        ...region,
        contentRange: { startLine: para.startLine, endLine: para.endLine },
      };
      wrapFullRegion(document, clipped, column, reformat, wrapOpts, edits);
    }
  } else {
    // Find all regions overlapping the selection
    const overlapping = allRegions.filter(
      (r) =>
        r.range.startLine <= sel.endLine && r.range.endLine >= sel.startLine
    );

    for (const region of overlapping) {
      // Clip contentRange to the selection boundaries
      const clippedStart = Math.max(
        region.contentRange.startLine,
        sel.startLine
      );
      const clippedEnd = Math.min(region.contentRange.endLine, sel.endLine);
      if (clippedStart > clippedEnd) continue;

      const clipped: WrappableRegion = {
        ...region,
        contentRange: { startLine: clippedStart, endLine: clippedEnd },
      };

      const wrapped = wrapRegion(
        clipped,
        document,
        column,
        reformat,
        wrapOpts
      );
      const original = getTextForLines(document, clippedStart, clippedEnd);
      if (wrapped !== original) {
        edits.push({
          startLine: clippedStart,
          endLine: clippedEnd,
          replacement: wrapped,
        });
      }
    }
  }
}

function wrapFullRegion(
  document: DocumentLike,
  region: WrappableRegion,
  column: number,
  reformat: boolean,
  wrapOpts: WrapOptions,
  edits: WrapEdit[]
): void {
  const { startLine, endLine } = region.contentRange;
  const wrapped = wrapRegion(region, document, column, reformat, wrapOpts);
  const original = getTextForLines(document, startLine, endLine);
  if (wrapped !== original) {
    edits.push({ startLine, endLine, replacement: wrapped });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

export function expandToParagraph(
  document: DocumentLike,
  line: number
): { startLine: number; endLine: number } {
  let start = line;
  while (start > 0 && document.lineAt(start - 1).trim() !== "") {
    start--;
  }
  let end = line;
  while (
    end < document.lineCount - 1 &&
    document.lineAt(end + 1).trim() !== ""
  ) {
    end++;
  }
  return { startLine: start, endLine: end };
}

function getTextForLines(
  document: DocumentLike,
  startLine: number,
  endLine: number
): string {
  const lines: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    lines.push(document.lineAt(i));
  }
  return lines.join("\n");
}

function deduplicateEdits(edits: WrapEdit[]): WrapEdit[] {
  const seen = new Set<string>();
  return edits.filter((e) => {
    const key = `${e.startLine}:${e.endLine}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Find the paragraph containing `cursorLine` within a comment region.
 * Paragraphs are separated by blank comment lines (lines whose content
 * after stripping the prefix is empty/whitespace).
 */
function findParagraphInRegion(
  document: DocumentLike,
  region: WrappableRegion,
  cursorLine: number
): { startLine: number; endLine: number } | undefined {
  const prefix = prefixToString(region.prefix);
  const { startLine: rangeStart, endLine: rangeEnd } = region.contentRange;

  if (cursorLine < rangeStart || cursorLine > rangeEnd) return undefined;

  const contentAfterPrefix = (line: number): string => {
    const raw = document.lineAt(line);
    if (raw.startsWith(prefix)) return raw.slice(prefix.length);
    // Blank comment lines may omit trailing spacing (e.g. "//" instead of "// ")
    const markerOnly = region.prefix.indent + region.prefix.marker;
    if (raw.startsWith(markerOnly)) return raw.slice(markerOnly.length);
    return raw;
  };

  // Cursor on blank comment line → no-op
  if (contentAfterPrefix(cursorLine).trim() === "") return undefined;

  // Expand upward
  let start = cursorLine;
  while (start > rangeStart && contentAfterPrefix(start - 1).trim() !== "") {
    start--;
  }

  // Expand downward
  let end = cursorLine;
  while (end < rangeEnd && contentAfterPrefix(end + 1).trim() !== "") {
    end++;
  }

  return { startLine: start, endLine: end };
}

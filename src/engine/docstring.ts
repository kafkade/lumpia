/**
 * Python docstring-aware block parsing and wrapping (issue #68).
 *
 * Recognizes the three major docstring conventions in addition to plain prose:
 *
 *   - **reST / Sphinx** field lists: `:param name: ...`, `:returns: ...`,
 *     `:raises ValueError: ...`, `:type name: ...`.
 *   - **Google** style sections: `Args:`, `Returns:`, `Raises:`, `Note:`, ...
 *     with `name (type): description` entries.
 *   - **NumPy** style sections: a header underlined with dashes
 *     (`Parameters\n----------`) followed by `name : type` entries.
 *
 * These constructs are detected only when the wrapping engine is in docstring
 * mode (`WrapOptions.docstring`), so markdown and non-Python comments are never
 * affected.
 *
 * Continuation-indent conventions (idiomatic per style):
 *   - reST field bodies wrap with a fixed hanging indent of `base + 4`.
 *   - Google argument descriptions wrap with continuation at `argIndent + 4`.
 *   - NumPy descriptions keep their own indentation (flat wrap).
 */

import { displayWidth } from "../utils/displayWidth";
import {
  isSentenceEnd,
  parseContentBlocks,
  tokenize,
  wrapBlock,
  type ContentBlock,
} from "./contentBlocks";

// ── Block types ──────────────────────────────────────────────────────

/** A reST/Sphinx field list entry, e.g. `:param name: description`. */
export interface RestFieldBlock {
  type: "rest-field";
  /** Leading whitespace count on the field line. */
  indent: number;
  /** Field marker verbatim, e.g. `:param name:`. */
  marker: string;
  /** Field body content lines (marker stripped, trimmed). */
  contentLines: string[];
}

/** A Google-style docstring section, e.g. `Args:` / `Returns:`. */
export interface GoogleSectionBlock {
  type: "google-section";
  /** Header line verbatim, e.g. `Args:`. */
  header: string;
  /** Leading whitespace count on the header line. */
  indent: number;
  /** True for sections whose body is a list of `name: description` entries. */
  argType: boolean;
  /** Raw body lines (retaining their original indentation). */
  bodyLines: string[];
}

/** A NumPy-style docstring section, e.g. `Parameters` underlined with dashes. */
export interface NumpySectionBlock {
  type: "numpy-section";
  /** Header line verbatim, e.g. `Parameters`. */
  header: string;
  /** Dash underline line verbatim, e.g. `----------`. */
  underline: string;
  /** Leading whitespace count on the header line. */
  indent: number;
  /** True for sections whose body is a list of `name : type` entries. */
  argType: boolean;
  /** Raw body lines (retaining their original indentation). */
  bodyLines: string[];
}

export type DocstringBlock =
  | RestFieldBlock
  | GoogleSectionBlock
  | NumpySectionBlock;

// ── Section name tables ──────────────────────────────────────────────

/** Google/NumPy section headers whose body is a list of parameter entries. */
const ARG_SECTIONS = new Set([
  "Args",
  "Arguments",
  "Parameters",
  "Keyword Args",
  "Keyword Arguments",
  "Other Parameters",
  "Attributes",
  "Raises",
]);

/** Google/NumPy section headers whose body is reflowed as prose. */
const PROSE_SECTIONS = new Set([
  "Returns",
  "Yields",
  "Note",
  "Notes",
  "Example",
  "Examples",
  "Warning",
  "Warnings",
  "Warns",
  "See Also",
  "References",
  "Todo",
  "Methods",
]);

/**
 * NumPy sections that are always reflowed as prose. Unlike Google, NumPy
 * `Returns`/`Yields` use `name : type` entries (like `Parameters`), so they are
 * treated as argument sections; only these free-text sections are prose.
 */
const NUMPY_PROSE_SECTIONS = new Set([
  "Note",
  "Notes",
  "Example",
  "Examples",
  "Warning",
  "Warnings",
  "Warns",
  "See Also",
  "References",
  "Todo",
  "Methods",
]);

const ALL_SECTIONS = new Set([...ARG_SECTIONS, ...PROSE_SECTIONS]);

// ── Detection patterns ───────────────────────────────────────────────

/** reST field marker at the start of a (trimmed) line, e.g. `:param x:`. */
const REST_FIELD_RE = /^:(\w[\w ]*?):(?:\s|$)/;
/** Google section header line, e.g. `Args:` (whole line is `Word:`). */
const GOOGLE_HEADER_RE = /^([A-Za-z][A-Za-z ]*):\s*$/;
/** A NumPy dash underline line, e.g. `----------`. */
const DASH_UNDERLINE_RE = /^-{3,}\s*$/;
const CODE_FENCE_RE = /^(`{3,}|~{3,})/;

/** True when the trimmed line begins a reST field. */
export function isRestField(trimmed: string): boolean {
  return REST_FIELD_RE.test(trimmed);
}

/** True when the trimmed line is a Google section header. */
export function isGoogleHeader(trimmed: string): boolean {
  const m = trimmed.match(GOOGLE_HEADER_RE);
  return m !== null && ALL_SECTIONS.has(m[1].trim());
}

/**
 * True when `lines[i]` is a NumPy section header (a known section name
 * followed by a dash underline of matching indentation).
 */
export function isNumpyHeaderAt(lines: string[], i: number): boolean {
  const header = lines[i];
  if (header === undefined) return false;
  const trimmed = header.trimStart();
  if (trimmed.trim() === "") return false;
  const next = lines[i + 1];
  if (next === undefined) return false;
  const nextTrimmed = next.trimStart();
  if (!DASH_UNDERLINE_RE.test(nextTrimmed)) return false;
  const headerIndent = header.length - trimmed.length;
  const underlineIndent = next.length - nextTrimmed.length;
  return headerIndent === underlineIndent;
}

// ── Parsers ──────────────────────────────────────────────────────────

/**
 * Try to parse a docstring construct (NumPy > Google > reST) starting at
 * `lines[start]`. Returns the parsed block and the next unconsumed line index,
 * or null when no docstring construct begins here.
 */
export function tryDocstringBlock(
  lines: string[],
  start: number
): { block: DocstringBlock; next: number } | null {
  return (
    tryNumpySection(lines, start) ??
    tryGoogleSection(lines, start) ??
    tryRestField(lines, start)
  );
}

function tryRestField(
  lines: string[],
  start: number
): { block: RestFieldBlock; next: number } | null {
  const raw = lines[start];
  const trimmed = raw.trimStart();
  const indent = raw.length - trimmed.length;
  const m = trimmed.match(/^:(\w[\w ]*?):/);
  if (!m) return null;

  const marker = m[0]; // e.g. ":param name:"
  const firstBody = trimmed.slice(marker.length).trimStart();
  const contentLines: string[] = [];
  if (firstBody !== "") contentLines.push(firstBody);

  let i = start + 1;
  while (i < lines.length) {
    const t = lines[i].trimStart();
    if (t === "") break;
    if (REST_FIELD_RE.test(t)) break;
    if (isNumpyHeaderAt(lines, i)) break;
    if (isGoogleHeader(t)) break;
    if (CODE_FENCE_RE.test(t)) break;
    contentLines.push(t);
    i++;
  }

  return {
    block: { type: "rest-field", indent, marker, contentLines },
    next: i,
  };
}

function tryGoogleSection(
  lines: string[],
  start: number
): { block: GoogleSectionBlock; next: number } | null {
  const raw = lines[start];
  const trimmed = raw.trimStart();
  const indent = raw.length - trimmed.length;

  // A NumPy header also matches `Word` but is handled earlier; ensure the
  // header line is exactly `Word:` and not underlined by dashes.
  const hm = trimmed.match(GOOGLE_HEADER_RE);
  if (!hm) return null;
  const name = hm[1].trim();
  if (!ALL_SECTIONS.has(name)) return null;

  // Collect the indented body (deeper than the header), keeping blank lines.
  const bodyLines: string[] = [];
  let i = start + 1;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      bodyLines.push(line);
      i++;
      continue;
    }
    const lineIndent = line.length - line.trimStart().length;
    if (lineIndent <= indent) break;
    bodyLines.push(line);
    i++;
  }

  // Trim trailing blank lines back out so they re-enter normal processing.
  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === "") {
    bodyLines.pop();
    i--;
  }
  if (bodyLines.length === 0) return null; // Not a real section — plain text.

  return {
    block: {
      type: "google-section",
      header: raw,
      indent,
      argType: ARG_SECTIONS.has(name),
      bodyLines,
    },
    next: i,
  };
}

function tryNumpySection(
  lines: string[],
  start: number
): { block: NumpySectionBlock; next: number } | null {
  if (!isNumpyHeaderAt(lines, start)) return null;

  const header = lines[start];
  const underline = lines[start + 1];
  const trimmed = header.trimStart();
  const indent = header.length - trimmed.length;
  const name = trimmed.trim();

  // Collect body lines up to the next NumPy section header or a dedent below
  // the header indent.
  const bodyLines: string[] = [];
  let i = start + 2;
  while (i < lines.length) {
    if (isNumpyHeaderAt(lines, i)) break;
    const line = lines[i];
    if (line.trim() !== "") {
      const lineIndent = line.length - line.trimStart().length;
      if (lineIndent < indent) break;
    }
    bodyLines.push(line);
    i++;
  }

  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === "") {
    bodyLines.pop();
    i--;
  }

  return {
    block: {
      type: "numpy-section",
      header,
      underline,
      indent,
      argType: !NUMPY_PROSE_SECTIONS.has(name),
      bodyLines,
    },
    next: i,
  };
}

// ── Wrapping ─────────────────────────────────────────────────────────

/** Wrap a docstring block to the target column. */
export function wrapDocstringBlock(
  block: DocstringBlock,
  column: number,
  tabWidth: number,
  doubleSentenceSpacing: boolean
): string {
  switch (block.type) {
    case "rest-field":
      return wrapRestField(block, column, tabWidth, doubleSentenceSpacing);
    case "google-section":
      return wrapGoogleSection(block, column, tabWidth, doubleSentenceSpacing);
    case "numpy-section":
      return wrapNumpySection(block, column, tabWidth, doubleSentenceSpacing);
  }
}

function wrapRestField(
  block: RestFieldBlock,
  column: number,
  tabWidth: number,
  dss: boolean
): string {
  const indentStr = " ".repeat(block.indent);
  const firstPrefix = indentStr + block.marker + " ";
  const contPrefix = indentStr + "    ";
  const content = block.contentLines.join(" ");
  if (content === "") return (indentStr + block.marker).trimEnd();
  return fillHanging(content, column, firstPrefix, contPrefix, tabWidth, dss).join(
    "\n"
  );
}

function wrapGoogleSection(
  block: GoogleSectionBlock,
  column: number,
  tabWidth: number,
  dss: boolean
): string {
  const out: string[] = [block.header];
  if (block.argType) {
    out.push(...wrapArgEntries(block.bodyLines, column, tabWidth, dss, true));
  } else {
    out.push(reflowIndented(block.bodyLines, column, tabWidth, dss));
  }
  return out.join("\n");
}

function wrapNumpySection(
  block: NumpySectionBlock,
  column: number,
  tabWidth: number,
  dss: boolean
): string {
  const out: string[] = [block.header, block.underline];
  if (block.argType) {
    out.push(...wrapArgEntries(block.bodyLines, column, tabWidth, dss, false));
  } else {
    out.push(reflowIndented(block.bodyLines, column, tabWidth, dss));
  }
  return out.join("\n");
}

/**
 * Wrap the body of an argument-type section. `hangingDesc` selects the
 * continuation-indent convention:
 *   - true  (Google): `name: desc` on one line, continuation at `entry + 4`.
 *   - false (NumPy):  `name : type` header preserved verbatim, followed by an
 *     indented description reflowed at its own indent.
 */
function wrapArgEntries(
  bodyLines: string[],
  column: number,
  tabWidth: number,
  dss: boolean,
  hangingDesc: boolean
): string[] {
  const nonBlank = bodyLines.filter((l) => l.trim() !== "");
  if (nonBlank.length === 0) return [];
  const baseIndent = Math.min(
    ...nonBlank.map((l) => l.length - l.trimStart().length)
  );

  const out: string[] = [];
  let i = 0;
  while (i < bodyLines.length) {
    const line = bodyLines[i];
    if (line.trim() === "") {
      out.push("");
      i++;
      continue;
    }
    const lineIndent = line.length - line.trimStart().length;

    // Only lines at the base indent can start an entry.
    if (lineIndent === baseIndent) {
      // Gather the entry's own line plus deeper-indented continuation lines.
      const entryLines = [line];
      let j = i + 1;
      while (j < bodyLines.length) {
        const bl = bodyLines[j];
        if (bl.trim() === "") break;
        const bi = bl.length - bl.trimStart().length;
        if (bi <= baseIndent) break;
        entryLines.push(bl);
        j++;
      }
      i = j;

      if (hangingDesc) {
        out.push(
          wrapGoogleEntry(entryLines, baseIndent, column, tabWidth, dss)
        );
      } else {
        out.push(
          wrapNumpyEntry(entryLines, baseIndent, column, tabWidth, dss)
        );
      }
    } else {
      // Deeper stray line — reflow it as prose preserving its indent.
      out.push(reflowIndented([line], column, tabWidth, dss));
      i++;
    }
  }
  return out;
}

/** Google entry: `name (type): desc` with continuation at `baseIndent + 4`. */
function wrapGoogleEntry(
  entryLines: string[],
  baseIndent: number,
  column: number,
  tabWidth: number,
  dss: boolean
): string {
  const indentStr = " ".repeat(baseIndent);
  const first = entryLines[0].trimStart();
  const markerMatch = first.match(/^(.+?):\s/);

  const rest = entryLines.slice(1).map((l) => l.trimStart());
  if (!markerMatch) {
    // No `name:` marker — reflow the whole entry as prose at base indent.
    return reflowIndented(entryLines, column, tabWidth, dss);
  }

  const marker = markerMatch[1] + ":";
  const firstBody = first.slice(markerMatch[0].length).trimStart();
  const content = [firstBody, ...rest].filter((s) => s !== "").join(" ");
  const firstPrefix = indentStr + marker + " ";
  const contPrefix = indentStr + "    ";
  if (content === "") return (indentStr + marker).trimEnd();
  return fillHanging(
    content,
    column,
    firstPrefix,
    contPrefix,
    tabWidth,
    dss
  ).join("\n");
}

/** NumPy entry: `name : type` header verbatim + reflowed description block. */
function wrapNumpyEntry(
  entryLines: string[],
  _baseIndent: number,
  column: number,
  tabWidth: number,
  dss: boolean
): string {
  const header = entryLines[0];
  const descLines = entryLines.slice(1);
  // A lone entry line with no description is reflowed as prose (this keeps
  // short `name : type` headers intact while wrapping long free text).
  if (descLines.length === 0) {
    return reflowIndented(entryLines, column, tabWidth, dss);
  }
  return header + "\n" + reflowIndented(descLines, column, tabWidth, dss);
}

/**
 * Reflow an indented block of text, preserving its common leading indent. The
 * dedented content is parsed by the generic (non-docstring) block engine so
 * embedded code fences, lists, and blank lines are handled correctly, then the
 * result is re-indented.
 */
function reflowIndented(
  rawLines: string[],
  column: number,
  tabWidth: number,
  dss: boolean
): string {
  const nonBlank = rawLines.filter((l) => l.trim() !== "");
  if (nonBlank.length === 0) return rawLines.map(() => "").join("\n");

  const indent = Math.min(
    ...nonBlank.map((l) => l.length - l.trimStart().length)
  );
  const pad = " ".repeat(indent);
  const dedented = rawLines
    .map((l) => (l.trim() === "" ? "" : l.slice(indent)))
    .join("\n");

  const blocks: ContentBlock[] = parseContentBlocks(dedented, {
    docstring: false,
  });
  const wrapped = blocks
    .map((b) => wrapBlock(b, Math.max(1, column - indent), tabWidth, dss))
    .join("\n");

  return wrapped
    .split("\n")
    .map((l) => (l === "" ? "" : pad + l))
    .join("\n");
}

/**
 * Greedy-fill `content` into lines using a hanging indent: the first line is
 * prefixed with `firstPrefix` and continuation lines with `contPrefix`. Each
 * line's available width is computed from its own prefix, so the first line and
 * the continuation may have different widths.
 */
export function fillHanging(
  content: string,
  column: number,
  firstPrefix: string,
  contPrefix: string,
  tabWidth: number,
  dss: boolean
): string[] {
  const words = tokenize(content);
  if (words.length === 0) return [firstPrefix.trimEnd()];

  const firstWidth = displayWidth(firstPrefix, tabWidth);
  const contWidth = displayWidth(contPrefix, tabWidth);

  const out: string[] = [];
  let line = "";
  let width = 0;
  let onFirst = true;
  const avail = (): number =>
    Math.max(1, column - (onFirst ? firstWidth : contWidth));

  for (const word of words) {
    const wordWidth = displayWidth(word, tabWidth);
    if (!line) {
      line = word;
      width = wordWidth;
      continue;
    }
    const sep = dss && isSentenceEnd(line) ? 2 : 1;
    if (width + sep + wordWidth <= avail()) {
      line += " ".repeat(sep) + word;
      width += sep + wordWidth;
    } else {
      out.push((onFirst ? firstPrefix : contPrefix) + line);
      onFirst = false;
      line = word;
      width = wordWidth;
    }
  }
  if (line) out.push((onFirst ? firstPrefix : contPrefix) + line);
  return out;
}

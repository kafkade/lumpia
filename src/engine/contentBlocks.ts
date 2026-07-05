/**
 * Block-based content model for wrapping engine (ADR-005).
 *
 * Parses comment/document content into typed blocks so each block type
 * can be wrapped (or preserved) according to its semantics.
 */

import { displayWidth } from "../utils/displayWidth";

// ── Block types ──────────────────────────────────────────────────────

export type ContentBlock =
  | ParagraphBlock
  | ListItemBlock
  | CodeFenceBlock
  | IndentedCodeBlock
  | HeadingBlock
  | BlockquoteBlock
  | DocTagBlock
  | DocExampleBlock
  | BlankLineBlock
  | PreservedBreakBlock
  | TableBlock;

export interface ParagraphBlock {
  type: "paragraph";
  lines: string[];
}

export interface ListItemBlock {
  type: "list-item";
  marker: string;   // e.g. "- ", "* ", "1. "
  indent: number;    // leading whitespace count
  lines: string[];
}

export interface CodeFenceBlock {
  type: "code-fence";
  lines: string[];
}

export interface IndentedCodeBlock {
  type: "indented-code";
  lines: string[];
}

export interface HeadingBlock {
  type: "heading";
  line: string;
}

export interface BlockquoteBlock {
  type: "blockquote";
  prefix: string;    // "> " or ">"
  blocks: ContentBlock[];
}

export interface DocTagBlock {
  type: "doc-tag";
  tag: string;       // e.g. "@param"
  lines: string[];
}

/**
 * A verbatim doc-comment example block (e.g. JSDoc/TSDoc `@example`). The
 * `@example` line and every following line are preserved unchanged until the
 * next block tag (`@tag`) or the end of the comment. Blank lines inside the
 * example are kept, and the content is never reflowed so embedded code stays
 * intact.
 */
export interface DocExampleBlock {
  type: "doc-example";
  lines: string[];
}

export interface BlankLineBlock {
  type: "blank-line";
}

export interface PreservedBreakBlock {
  type: "preserved-break";
  line: string;
}

export interface TableBlock {
  type: "table";
  lines: string[];
}

// ── Detection patterns ───────────────────────────────────────────────

const CODE_FENCE_RE = /^(`{3,}|~{3,})/;
const HEADING_RE = /^#{1,6}(?:\s|$)/;
const TABLE_RE = /^\|.*\|/;
const BLOCKQUOTE_RE = /^(>\s?)/;
const LIST_ITEM_RE = /^([-*+])\s|^(\d+[.)])\s/;
const DOC_TAG_RE = /^@\w+/;
/** Tags whose following content is preserved verbatim (e.g. `@example`). */
const DOC_VERBATIM_TAG_RE = /^@(?:example|code)\b/i;
/**
 * Doc tags whose whole line(s) are preserved verbatim (never reflowed),
 * because they carry type expressions or terse metadata rather than prose.
 */
const PRESERVE_TAGS = new Set(["@type", "@typedef", "@template"]);

// ── Parser ───────────────────────────────────────────────────────────

/**
 * Parse text into a sequence of content blocks.
 * Best-effort detection of markdown-like structures.
 */
export function parseContentBlocks(text: string): ContentBlock[] {
  const lines = text.split("\n");
  const blocks: ContentBlock[] = [];
  let i = 0;
  let prevWasBlank = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // ── Blank line ─────────────────────────────────────────────
    if (trimmed === "") {
      if (!prevWasBlank) {
        blocks.push({ type: "blank-line" });
      }
      prevWasBlank = true;
      i++;
      continue;
    }
    prevWasBlank = false;

    // ── Code fence ─────────────────────────────────────────────
    const fenceMatch = trimmed.match(CODE_FENCE_RE);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const fenceChar = fence[0];
      const fenceLen = fence.length;
      const fenceLines = [line];
      i++;
      while (i < lines.length) {
        fenceLines.push(lines[i]);
        const closerTrimmed = lines[i].trimStart();
        if (
          closerTrimmed.startsWith(fenceChar.repeat(fenceLen)) &&
          closerTrimmed.replace(new RegExp(`^${fenceChar}+`), "").trim() === ""
        ) {
          i++;
          break;
        }
        i++;
      }
      blocks.push({ type: "code-fence", lines: fenceLines });
      continue;
    }

    // ── Heading ────────────────────────────────────────────────
    if (HEADING_RE.test(trimmed)) {
      blocks.push({ type: "heading", line });
      i++;
      continue;
    }

    // ── Table ──────────────────────────────────────────────────
    if (TABLE_RE.test(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && TABLE_RE.test(lines[i].trimStart())) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "table", lines: tableLines });
      continue;
    }

    // ── Blockquote ─────────────────────────────────────────────
    const bqMatch = trimmed.match(BLOCKQUOTE_RE);
    if (bqMatch) {
      const prefix = bqMatch[1];
      const indent = line.length - trimmed.length;
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const ql = lines[i];
        const qt = ql.trimStart();
        if (qt === "") break;
        const qIndent = ql.length - qt.length;
        if (qIndent !== indent) break;
        const qm = qt.match(BLOCKQUOTE_RE);
        if (!qm) break;
        // Strip the > prefix for inner parsing
        quoteLines.push(qt.slice(qm[1].length));
        i++;
      }
      const innerBlocks = parseContentBlocks(quoteLines.join("\n"));
      blocks.push({ type: "blockquote", prefix, blocks: innerBlocks });
      continue;
    }

    // ── Doc tag ────────────────────────────────────────────────
    if (DOC_TAG_RE.test(trimmed)) {
      // ── Verbatim example: preserve following content unchanged ──
      // until the next block tag (`@tag`) or end of input. Blank
      // lines inside the example are kept so embedded code (and its
      // spacing) survives intact.
      if (DOC_VERBATIM_TAG_RE.test(trimmed)) {
        const exampleLines = [line];
        i++;
        while (i < lines.length) {
          if (DOC_TAG_RE.test(lines[i].trimStart())) break;
          exampleLines.push(lines[i]);
          i++;
        }
        // Trim trailing blank lines so they re-enter normal processing
        // (keeping blank-line collapsing consistent with the rest of
        // the parser).
        while (
          exampleLines.length > 1 &&
          exampleLines[exampleLines.length - 1].trim() === ""
        ) {
          exampleLines.pop();
          i--;
        }
        blocks.push({ type: "doc-example", lines: exampleLines });
        continue;
      }

      const tagLines = [line];
      i++;
      while (i < lines.length) {
        const tl = lines[i];
        const tt = tl.trimStart();
        if (tt === "") break;
        if (DOC_TAG_RE.test(tt)) break;
        if (HEADING_RE.test(tt)) break;
        if (CODE_FENCE_RE.test(tt)) break;
        if (TABLE_RE.test(tt)) break;
        // Continuation: indented text that isn't a new block
        const tlIndent = tl.length - tt.length;
        if (tlIndent === 0 && !LIST_ITEM_RE.test(tt)) {
          // Non-indented continuation without marker — include
          tagLines.push(tl);
          i++;
        } else if (tlIndent > 0) {
          tagLines.push(tl);
          i++;
        } else {
          break;
        }
      }
      const tagMatch = trimmed.match(/^(@\w+)/);
      blocks.push({
        type: "doc-tag",
        tag: tagMatch![1],
        lines: tagLines,
      });
      continue;
    }

    // ── List item ──────────────────────────────────────────────
    const listMatch = trimmed.match(LIST_ITEM_RE);
    if (listMatch) {
      const markerStr = (listMatch[1] || listMatch[2]) + " ";
      const indent = line.length - trimmed.length;
      const markerWidth = indent + markerStr.length;
      const itemLines = [line];
      i++;
      while (i < lines.length) {
        const ll = lines[i];
        const lt = ll.trimStart();
        if (lt === "") break;
        if (LIST_ITEM_RE.test(lt)) break;
        if (HEADING_RE.test(lt)) break;
        if (CODE_FENCE_RE.test(lt)) break;
        if (TABLE_RE.test(lt)) break;
        if (DOC_TAG_RE.test(lt)) break;
        if (BLOCKQUOTE_RE.test(lt)) break;
        // Continuation if indented past marker
        const llIndent = ll.length - lt.length;
        if (llIndent >= markerWidth) {
          itemLines.push(ll);
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: "list-item",
        marker: markerStr,
        indent,
        lines: itemLines,
      });
      continue;
    }

    // ── Indented code (4+ spaces after blank line) ─────────────
    if (
      blocks.length > 0 &&
      blocks[blocks.length - 1].type === "blank-line" &&
      /^ {4,}\S/.test(line)
    ) {
      const codeLines: string[] = [];
      while (i < lines.length) {
        if (/^ {4,}/.test(lines[i]) || lines[i].trim() === "") {
          codeLines.push(lines[i]);
          i++;
        } else {
          break;
        }
      }
      // Trim trailing blank lines from the code block
      while (
        codeLines.length > 0 &&
        codeLines[codeLines.length - 1].trim() === ""
      ) {
        codeLines.pop();
        i--; // put blank line back for regular processing
      }
      if (codeLines.length > 0) {
        blocks.push({ type: "indented-code", lines: codeLines });
        continue;
      }
    }

    // ── Preserved break (trailing double space) ────────────────
    if (line.endsWith("  ")) {
      blocks.push({ type: "preserved-break", line });
      i++;
      continue;
    }

    // ── Paragraph (default) ────────────────────────────────────
    const paraLines: string[] = [];
    while (i < lines.length) {
      const pl = lines[i];
      const pt = pl.trimStart();
      if (pt === "") break;
      if (CODE_FENCE_RE.test(pt)) break;
      if (HEADING_RE.test(pt)) break;
      if (TABLE_RE.test(pt)) break;
      if (BLOCKQUOTE_RE.test(pt)) break;
      if (LIST_ITEM_RE.test(pt)) break;
      if (DOC_TAG_RE.test(pt)) break;
      // Check for preserved break — ends this paragraph
      if (pl.endsWith("  ")) {
        paraLines.push(pl);
        i++;
        break;
      }
      paraLines.push(pl);
      i++;
    }
    if (paraLines.length > 0) {
      // If the last line has trailing double space, split it off
      const last = paraLines[paraLines.length - 1];
      if (last.endsWith("  ") && paraLines.length > 1) {
        const preserved = paraLines.pop()!;
        blocks.push({ type: "paragraph", lines: paraLines });
        blocks.push({ type: "preserved-break", line: preserved });
      } else if (last.endsWith("  ") && paraLines.length === 1) {
        blocks.push({ type: "preserved-break", line: last });
      } else {
        blocks.push({ type: "paragraph", lines: paraLines });
      }
    }
  }

  return blocks;
}

// ── Wrapping ─────────────────────────────────────────────────────────

/**
 * Determine whether a word ends a sentence. A word is a sentence end when,
 * after stripping any trailing run of closing quotes/brackets (`"`, `'`,
 * `)`, `]`, `}`), its final character is `.`, `?`, or `!`.
 */
export function isSentenceEnd(word: string): boolean {
  const stripped = word.replace(/["')\]}]+$/, "");
  const last = stripped[stripped.length - 1];
  return last === "." || last === "?" || last === "!";
}

/**
 * Markdown constructs that must never be broken across lines, tried in
 * order (longest/most-specific first) at each candidate position:
 *   - inline doc tags:        `{@link target label}`, `{@tutorial ...}`
 *   - inline links & images: `[label](target)`, `![alt](src "title")`
 *   - reference links:        `[text][ref]`
 *   - shortcut references:    `[text]`
 *   - autolinks:              `<scheme:...>`
 * Labels/targets may contain spaces, so these are kept as atomic tokens.
 */
const ATOMIC_LINK_RES: RegExp[] = [
  /^\{@\w+[^}]*\}/,
  /^!?\[[^\]]*\]\([^)]*\)/,
  /^!?\[[^\]]*\]\[[^\]]*\]/,
  /^!?\[[^\]]*\]/,
  /^<[^>\s]+>/,
];

/** Match an atomic link/image span at the start of `s`, if any. */
function matchAtomicLink(s: string): string | null {
  for (const re of ATOMIC_LINK_RES) {
    const m = re.exec(s);
    if (m) return m[0];
  }
  return null;
}

/**
 * Split text into whitespace-delimited tokens, but keep Markdown links,
 * images, and references intact even when they contain spaces. Runs of
 * whitespace between tokens are collapsed; whitespace inside a link is
 * preserved as part of the atomic token.
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const n = text.length;
  let i = 0;

  while (i < n) {
    if (/\s/.test(text[i])) {
      i++;
      continue;
    }
    let token = "";
    while (i < n && !/\s/.test(text[i])) {
      const link = matchAtomicLink(text.slice(i));
      if (link) {
        token += link;
        i += link.length;
      } else {
        token += text[i];
        i++;
      }
    }
    tokens.push(token);
  }

  return tokens;
}

/**
 * Greedy-fill algorithm: fill lines up to `column` display width.
 * Returns wrapped lines (without newline characters).
 *
 * When `doubleSentenceSpacing` is true, words that follow a sentence-ending
 * word are joined with two spaces instead of one.
 */
export function greedyFill(
  text: string,
  column: number,
  tabWidth: number,
  doubleSentenceSpacing = false
): string[] {
  const words = tokenize(text);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let currentLine = "";
  let currentWidth = 0;

  for (const word of words) {
    const wordWidth = displayWidth(word, tabWidth);
    if (!currentLine) {
      currentLine = word;
      currentWidth = wordWidth;
    } else {
      const sep =
        doubleSentenceSpacing && isSentenceEnd(currentLine) ? 2 : 1;
      if (currentWidth + sep + wordWidth <= column) {
        currentLine += " ".repeat(sep) + word;
        currentWidth += sep + wordWidth;
      } else {
        lines.push(currentLine);
        currentLine = word;
        currentWidth = wordWidth;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/** Wrap a single block and return the resulting text. */
export function wrapBlock(
  block: ContentBlock,
  column: number,
  tabWidth: number,
  doubleSentenceSpacing = false
): string {
  switch (block.type) {
    case "paragraph":
      return wrapParagraph(block, column, tabWidth, doubleSentenceSpacing);
    case "list-item":
      return wrapListItem(block, column, tabWidth, doubleSentenceSpacing);
    case "code-fence":
    case "indented-code":
    case "table":
      return block.lines.join("\n");
    case "heading":
      return block.line;
    case "blockquote":
      return wrapBlockquote(block, column, tabWidth, doubleSentenceSpacing);
    case "doc-tag":
      return wrapDocTag(block, column, tabWidth, doubleSentenceSpacing);
    case "doc-example":
      return block.lines.join("\n");
    case "blank-line":
      return "";
    case "preserved-break":
      return block.line;
  }
}

function wrapParagraph(
  block: ParagraphBlock,
  column: number,
  tabWidth: number,
  doubleSentenceSpacing: boolean
): string {
  return greedyFill(
    block.lines.join(" "),
    column,
    tabWidth,
    doubleSentenceSpacing
  ).join("\n");
}

function wrapListItem(
  block: ListItemBlock,
  column: number,
  tabWidth: number,
  doubleSentenceSpacing: boolean
): string {
  const indentStr = " ".repeat(block.indent);
  const firstPrefix = indentStr + block.marker;
  const firstPrefixWidth = displayWidth(firstPrefix, tabWidth);
  const contPrefix = " ".repeat(firstPrefixWidth);

  // Extract content from all lines
  const firstContent = block.lines[0].slice(firstPrefix.length);
  const contContent = block.lines.slice(1).map((l) => l.trimStart());
  const allContent = [firstContent, ...contContent].join(" ");

  const availableWidth = Math.max(1, column - firstPrefixWidth);
  const wrapped = greedyFill(
    allContent,
    availableWidth,
    tabWidth,
    doubleSentenceSpacing
  );
  if (wrapped.length === 0) return firstPrefix.trimEnd();

  return wrapped
    .map((line, i) => (i === 0 ? firstPrefix : contPrefix) + line)
    .join("\n");
}

function wrapDocTag(
  block: DocTagBlock,
  column: number,
  tabWidth: number,
  doubleSentenceSpacing: boolean
): string {
  // Preserve tags are kept verbatim: their type expressions and following
  // lines are never reflowed (e.g. `@type {LongUnion}`, `@typedef`,
  // `@template`).
  if (PRESERVE_TAGS.has(block.tag.toLowerCase())) {
    return block.lines.join("\n");
  }

  const firstLine = block.lines[0];
  const trimmed = firstLine.trimStart();
  const outerIndent = firstLine.length - trimmed.length;
  const outerPrefix = " ".repeat(outerIndent);

  // Detect hanging indent point: @tag {Type} name or @tag name or @tag
  let hangingPrefix: string;
  const match3 = trimmed.match(/^(@\w+\s+\{[^}]*\}\s+\S+)\s/);
  const match2 = trimmed.match(/^(@\w+\s+\S+)\s/);
  const match1 = trimmed.match(/^(@\w+)\s/);

  if (match3) {
    hangingPrefix = outerPrefix + match3[1] + " ";
  } else if (match2) {
    hangingPrefix = outerPrefix + match2[1] + " ";
  } else if (match1) {
    hangingPrefix = outerPrefix + match1[1] + " ";
  } else {
    hangingPrefix = outerPrefix + block.tag + " ";
  }

  const hangWidth = displayWidth(hangingPrefix, tabWidth);
  const contPrefix = " ".repeat(hangWidth);

  // Extract content after the hanging prefix
  const firstContent = firstLine.slice(hangingPrefix.length);
  const contContent = block.lines.slice(1).map((l) => l.trimStart());
  const allContent = [firstContent, ...contContent].join(" ");

  const availableWidth = Math.max(1, column - hangWidth);
  const wrapped = greedyFill(
    allContent,
    availableWidth,
    tabWidth,
    doubleSentenceSpacing
  );
  if (wrapped.length === 0) return hangingPrefix.trimEnd();

  return wrapped
    .map((line, i) => (i === 0 ? hangingPrefix : contPrefix) + line)
    .join("\n");
}

function wrapBlockquote(
  block: BlockquoteBlock,
  column: number,
  tabWidth: number,
  doubleSentenceSpacing: boolean
): string {
  const prefix = block.prefix;
  const prefixWidth = displayWidth(prefix, tabWidth);
  const innerColumn = Math.max(1, column - prefixWidth);

  // Recursively wrap inner blocks
  const innerWrapped = block.blocks
    .map((b) => wrapBlock(b, innerColumn, tabWidth, doubleSentenceSpacing))
    .join("\n");

  return innerWrapped
    .split("\n")
    .map((line) => (line ? prefix + line : prefix.trimEnd()))
    .join("\n");
}

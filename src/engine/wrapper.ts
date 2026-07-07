import type { DocumentLike, WrappableRegion } from "../parser/types";
import { prefixToString, normalizePrefix } from "../parser/prefix";
import { displayWidth } from "../utils/displayWidth";
import { parseContentBlocks, wrapBlock } from "./contentBlocks";

export interface WrapOptions {
  tabWidth?: number;
  doubleSentenceSpacing?: boolean;
  /**
   * When true, apply Python docstring-aware parsing (reST field lists, Google
   * and NumPy sections) in addition to the generic markdown/doc-comment
   * handling. Enabled only for docstring regions so other content is
   * unaffected.
   */
  docstring?: boolean;
  /**
   * When true, parse the text as a LaTeX document: wrap prose paragraphs while
   * preserving commands, environments, math, verbatim blocks, and comments.
   */
  latex?: boolean;
}

/**
 * Roll text to a target column width using a block-aware content model.
 *
 * Parses content into typed blocks (paragraphs, lists, code fences, etc.)
 * and wraps each block according to its type. Uses display-width-aware
 * column calculation for correct CJK, emoji, and tab handling.
 */
export function rollText(
  text: string,
  column: number,
  options: WrapOptions = {}
): string {
  const { tabWidth = 4, doubleSentenceSpacing = false, docstring = false, latex = false } =
    options;

  // Detect the dominant line-ending style, then normalize to LF for
  // processing. Mixed input is normalized to whichever style dominates;
  // ties fall back to LF.
  const useCRLF = prefersCRLF(text);
  const normalized = text.includes("\r\n") ? text.replace(/\r\n/g, "\n") : text;

  const blocks = parseContentBlocks(normalized, { docstring, latex });
  const result = blocks
    .map((b) => wrapBlock(b, column, tabWidth, doubleSentenceSpacing))
    .join("\n");

  return useCRLF ? result.replace(/\n/g, "\r\n") : result;
}

/**
 * Determine whether text should use CRLF line endings. Counts CRLF vs
 * standalone LF occurrences and returns true only when CRLF strictly
 * dominates; ties and LF-majority both resolve to LF.
 */
function prefersCRLF(text: string): boolean {
  let crlf = 0;
  let lf = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") {
      if (i > 0 && text[i - 1] === "\r") crlf++;
      else lf++;
    }
  }
  return crlf > lf;
}

/**
 * Wrap a single detected region — strips comment prefixes, wraps the
 * inner content with `rollText`, then re-applies the prefixes.
 *
 * When `reformat` is true, output uses normalized spacing (single space
 * after marker). Input is always stripped using the original prefix.
 */
export function wrapRegion(
  region: WrappableRegion,
  document: DocumentLike,
  column: number,
  reformat = false,
  options: WrapOptions = {}
): string {
  const { tabWidth = 4, doubleSentenceSpacing = false } = options;
  const { contentRange, prefix } = region;
  const inputPrefix = prefixToString(prefix);
  const outputPrefix = prefixToString(
    reformat ? normalizePrefix(prefix) : prefix
  );

  const lines: string[] = [];
  for (let i = contentRange.startLine; i <= contentRange.endLine; i++) {
    const line = document.lineAt(i);
    // Strip the original prefix to get the inner content
    const content = line.startsWith(inputPrefix)
      ? line.slice(inputPrefix.length)
      : line;
    lines.push(content);
  }

  const innerText = lines.join("\n");
  const prefixDisplayWidth = displayWidth(outputPrefix, tabWidth);
  const availableWidth = Math.max(1, column - prefixDisplayWidth);
  const wrapped = rollText(innerText, availableWidth, {
    tabWidth,
    doubleSentenceSpacing,
    docstring: region.kind === "docstring",
  });

  // Re-apply the (possibly normalized) prefix to each wrapped line
  return wrapped
    .split("\n")
    .map((line) => (line ? outputPrefix + line : outputPrefix.trimEnd()))
    .join("\n");
}

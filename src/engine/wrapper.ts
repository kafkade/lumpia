import type { DocumentLike, WrappableRegion } from "../parser/types";
import { prefixToString, normalizePrefix } from "../parser/prefix";
import { displayWidth } from "../utils/displayWidth";
import { parseContentBlocks, wrapBlock } from "./contentBlocks";

export interface WrapOptions {
  tabWidth?: number;
  doubleSentenceSpacing?: boolean;
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
  const { tabWidth = 4, doubleSentenceSpacing = false } = options;

  // Detect and normalize CRLF line endings
  const hasCRLF = text.includes("\r\n");
  const normalized = hasCRLF ? text.replace(/\r\n/g, "\n") : text;

  const blocks = parseContentBlocks(normalized);
  const result = blocks
    .map((b) => wrapBlock(b, column, tabWidth, doubleSentenceSpacing))
    .join("\n");

  return hasCRLF ? result.replace(/\n/g, "\r\n") : result;
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
  });

  // Re-apply the (possibly normalized) prefix to each wrapped line
  return wrapped
    .split("\n")
    .map((line) => (line ? outputPrefix + line : outputPrefix.trimEnd()))
    .join("\n");
}

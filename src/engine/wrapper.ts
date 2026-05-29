import type { DocumentLike, WrappableRegion } from "../parser/types";
import { prefixToString, normalizePrefix, prefixLength } from "../parser/prefix";

export function rollText(text: string, column: number): string {
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs
    .map((paragraph) => {
      const words = paragraph.replace(/\s+/g, " ").trim().split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        if (!currentLine) {
          currentLine = word;
        } else if (currentLine.length + 1 + word.length <= column) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines.join("\n");
    })
    .join("\n\n");
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
  reformat = false
): string {
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
  const availableWidth = Math.max(1, column - prefixLength(
    reformat ? normalizePrefix(prefix) : prefix
  ));
  const wrapped = rollText(innerText, availableWidth);

  // Re-apply the (possibly normalized) prefix to each wrapped line
  return wrapped
    .split("\n")
    .map((line) => (line ? outputPrefix + line : outputPrefix.trimEnd()))
    .join("\n");
}

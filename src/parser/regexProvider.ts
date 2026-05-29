import type {
  CommentPrefix,
  DocumentLike,
  RegionKind,
  RegionProvider,
  TextRange,
  WrappableRegion,
} from "./types";
import type { LanguageDefinition } from "../languages/types";
import { getLanguage } from "../languages/registry";
import {
  emptyPrefix,
  parseBlockBodyPrefix,
  prefixFromFirstContentLine,
} from "./prefix";

/**
 * Regex-based region provider — detects wrappable comment regions
 * using line-by-line prefix/suffix matching and language definitions.
 *
 * Phase 1 implementation per ADR-001.
 */
export class RegexRegionProvider implements RegionProvider {
  getRegions(document: DocumentLike, range: TextRange): WrappableRegion[] {
    const startLine = range.startLine;
    const endLine = Math.min(range.endLine, document.lineCount - 1);

    // Plaintext / markdown: treat the entire range as one wrappable region
    if (
      document.languageId === "plaintext" ||
      document.languageId === "markdown"
    ) {
      return [
        {
          range,
          languageId: document.languageId,
          kind: document.languageId === "markdown" ? "markdown" : "plaintext",
          prefix: emptyPrefix(),
          innerIndent: 0,
          contentRange: { startLine, endLine },
        },
      ];
    }

    const lang = getLanguage(document.languageId);
    if (!lang) {
      // Unknown language — treat as plaintext
      return [
        {
          range,
          languageId: document.languageId,
          kind: "plaintext",
          prefix: emptyPrefix(),
          innerIndent: 0,
          contentRange: { startLine, endLine },
        },
      ];
    }

    return this.scanWithLanguage(document, lang, startLine, endLine);
  }

  private scanWithLanguage(
    document: DocumentLike,
    lang: LanguageDefinition,
    startLine: number,
    endLine: number
  ): WrappableRegion[] {
    const regions: WrappableRegion[] = [];
    let i = startLine;

    while (i <= endLine) {
      const line = document.lineAt(i);

      // 1. Doc block comments (e.g., /** */)
      if (lang.docComments?.block) {
        const result = this.tryBlockComment(
          document,
          lang,
          i,
          endLine,
          lang.docComments.block,
          "doc-comment"
        );
        if (result) {
          regions.push(result.region);
          i = result.nextLine;
          continue;
        }
      }

      // 2. Regular block comments (e.g., /* */)
      let foundBlock = false;
      for (const pair of lang.blockComments) {
        // Skip if this is actually a doc block opener
        if (
          lang.docComments?.block &&
          line.trimStart().startsWith(lang.docComments.block[0])
        ) {
          break;
        }
        const result = this.tryBlockComment(
          document,
          lang,
          i,
          endLine,
          pair,
          "block-comment"
        );
        if (result) {
          regions.push(result.region);
          i = result.nextLine;
          foundBlock = true;
          break;
        }
      }
      if (foundBlock) continue;

      // 3. Docstrings (Python triple-quote)
      if (lang.docstrings) {
        const result = this.tryDocstring(document, i, endLine, lang);
        if (result) {
          regions.push(result.region);
          i = result.nextLine;
          continue;
        }
      }

      // 4. Doc line comments (e.g., ///, //!)
      if (lang.docComments?.line) {
        const result = this.tryLineCommentRun(
          document,
          lang,
          i,
          endLine,
          lang.docComments.line,
          "doc-comment"
        );
        if (result) {
          regions.push(result.region);
          i = result.nextLine;
          continue;
        }
      }

      // 5. Regular line comments (e.g., //, #)
      if (lang.lineComments.length > 0) {
        // Skip shebangs on line 0 for shell-like languages
        if (i === 0 && line.startsWith("#!")) {
          i++;
          continue;
        }
        const result = this.tryLineCommentRun(
          document,
          lang,
          i,
          endLine,
          lang.lineComments,
          "line-comment"
        );
        if (result) {
          regions.push(result.region);
          i = result.nextLine;
          continue;
        }
      }

      i++;
    }

    return regions;
  }

  private tryBlockComment(
    document: DocumentLike,
    lang: LanguageDefinition,
    startLine: number,
    endLine: number,
    [opener, closer]: [string, string],
    kind: RegionKind
  ): { region: WrappableRegion; nextLine: number } | null {
    const line = document.lineAt(startLine);
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (!trimmed.startsWith(opener)) return null;

    // Single-line block comment: /* comment */
    const afterOpener = trimmed.slice(opener.length);
    if (afterOpener.includes(closer)) {
      const singlePrefix: CommentPrefix = {
        indent: " ".repeat(indent),
        marker: opener,
        spacing: " ",
      };
      return {
        region: {
          range: {
            startLine,
            startCol: indent,
            endLine: startLine,
            endCol: line.length,
          },
          languageId: lang.id,
          kind,
          prefix: singlePrefix,
          suffix: " " + closer,
          innerIndent: indent,
          contentRange: { startLine, endLine: startLine },
        },
        nextLine: startLine + 1,
      };
    }

    // Multi-line block comment: scan to closer
    const isNested = lang.id === "rust";
    const closerLine = this.findCloser(
      document,
      startLine,
      endLine,
      opener,
      closer,
      isNested
    );
    if (closerLine === -1) return null;

    // Detect body prefix from first non-blank body line
    const contentStart = startLine + 1;
    const contentEnd = Math.max(contentStart, closerLine - 1);
    let bodyPrefix: CommentPrefix = emptyPrefix(" ".repeat(indent + 1));
    for (let i = contentStart; i <= contentEnd; i++) {
      const bodyLine = document.lineAt(i);
      if (bodyLine.trim().length > 0) {
        bodyPrefix = parseBlockBodyPrefix(bodyLine, indent);
        break;
      }
    }

    return {
      region: {
        range: {
          startLine,
          startCol: indent,
          endLine: closerLine,
          endCol: document.lineAt(closerLine).length,
        },
        languageId: lang.id,
        kind,
        prefix: bodyPrefix,
        suffix: closer,
        innerIndent: indent,
        contentRange: { startLine: contentStart, endLine: contentEnd },
      },
      nextLine: closerLine + 1,
    };
  }

  private findCloser(
    document: DocumentLike,
    startLine: number,
    endLine: number,
    opener: string,
    closer: string,
    nested: boolean
  ): number {
    let depth = 1;
    // Start scanning after the opener on the first line
    const firstLine = document.lineAt(startLine);
    const afterOpener = firstLine.indexOf(opener) + opener.length;
    let searchFrom = afterOpener;

    for (let i = startLine; i <= endLine; i++) {
      const line = i === startLine ? firstLine.slice(searchFrom) : document.lineAt(i);

      if (nested && opener !== closer) {
        // Handle nested block comments (Rust)
        let pos = 0;
        while (pos < line.length) {
          const closerIdx = line.indexOf(closer, pos);
          const openerIdx = line.indexOf(opener, pos);

          if (closerIdx === -1 && openerIdx === -1) break;

          if (
            closerIdx !== -1 &&
            (openerIdx === -1 || closerIdx <= openerIdx)
          ) {
            depth--;
            if (depth === 0) return i;
            pos = closerIdx + closer.length;
          } else {
            depth++;
            pos = openerIdx + opener.length;
          }
        }
      } else {
        if (line.includes(closer)) return i;
      }

      searchFrom = 0;
    }

    return -1; // Unclosed comment
  }

  private tryDocstring(
    document: DocumentLike,
    startLine: number,
    endLine: number,
    lang: LanguageDefinition
  ): { region: WrappableRegion; nextLine: number } | null {
    if (!lang.docstrings) return null;

    const line = document.lineAt(startLine);
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    for (const [opener, closer] of lang.docstrings) {
      if (!trimmed.startsWith(opener)) continue;

      // Check for single-line docstring: """text"""
      const afterOpener = trimmed.slice(opener.length);
      const closerInSameLine = afterOpener.indexOf(closer);
      if (closerInSameLine !== -1) {
        return {
          region: {
            range: {
              startLine,
              startCol: indent,
              endLine: startLine,
              endCol: line.length,
            },
            languageId: lang.id,
            kind: "docstring",
            prefix: emptyPrefix(" ".repeat(indent)),
            innerIndent: indent,
            contentRange: { startLine, endLine: startLine },
          },
          nextLine: startLine + 1,
        };
      }

      // Multi-line docstring: scan for closing delimiter
      for (let i = startLine + 1; i <= endLine; i++) {
        const scanLine = document.lineAt(i);
        if (scanLine.trimStart().includes(closer)) {
          return {
            region: {
              range: {
                startLine,
                startCol: indent,
                endLine: i,
                endCol: scanLine.length,
              },
              languageId: lang.id,
              kind: "docstring",
              prefix: emptyPrefix(" ".repeat(indent)),
              suffix: closer,
              innerIndent: indent,
              contentRange: { startLine: startLine + 1, endLine: i - 1 },
            },
            nextLine: i + 1,
          };
        }
      }
    }

    return null;
  }

  private tryLineCommentRun(
    document: DocumentLike,
    lang: LanguageDefinition,
    startLine: number,
    endLine: number,
    markers: string[],
    kind: RegionKind
  ): { region: WrappableRegion; nextLine: number } | null {
    const line = document.lineAt(startLine);
    const match = matchLineComment(line, markers);
    if (!match) return null;

    // Scan forward for consecutive lines with the same marker at the same indent
    let runEnd = startLine;
    for (let i = startLine + 1; i <= endLine; i++) {
      const nextLine = document.lineAt(i);
      const nextMatch = matchLineComment(nextLine, markers);
      if (
        nextMatch &&
        nextMatch.markerToken === match.markerToken &&
        nextMatch.indent === match.indent
      ) {
        runEnd = i;
      } else {
        break;
      }
    }

    // Use first non-blank content line to determine spacing
    const runLines: string[] = [];
    for (let i = startLine; i <= runEnd; i++) {
      runLines.push(document.lineAt(i));
    }
    const prefix: CommentPrefix =
      prefixFromFirstContentLine(runLines, markers) ?? {
        indent: match.indent,
        marker: match.markerToken,
        spacing: " ",
      };

    return {
      region: {
        range: { startLine, startCol: 0, endLine: runEnd, endCol: 0 },
        languageId: lang.id,
        kind,
        prefix,
        innerIndent: prefix.indent.length,
        contentRange: { startLine, endLine: runEnd },
      },
      nextLine: runEnd + 1,
    };
  }
}

/** Match a line against comment markers. Returns the marker token and indent. */
function matchLineComment(
  line: string,
  markers: string[]
): { markerToken: string; indent: string } | null {
  // Sort markers longest-first so `///` is checked before `//`
  const sorted = [...markers].sort((a, b) => b.length - a.length);
  for (const marker of sorted) {
    const regex = new RegExp(`^(\\s*)(${escapeRegex(marker)})\\s?`);
    const m = line.match(regex);
    if (m) {
      return { markerToken: m[2], indent: m[1] };
    }
  }
  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

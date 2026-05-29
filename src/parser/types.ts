/** Range expressed as line/column positions. */
export interface TextRange {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
}

/** Minimal document abstraction — keeps the parser VS Code-independent. */
export interface DocumentLike {
  getText(range?: TextRange): string;
  lineAt(line: number): string;
  readonly lineCount: number;
  readonly languageId: string;
}

export type RegionKind =
  | "line-comment"
  | "block-comment"
  | "doc-comment"
  | "docstring"
  | "markdown"
  | "latex"
  | "plaintext";

/** Structured comment prefix per ADR-003. */
export interface CommentPrefix {
  /** Leading whitespace before the marker (e.g. `"    "`). */
  indent: string;
  /** The comment marker itself (e.g. `"//"`, `"#"`, `"*"`, `"///"`). Empty for plaintext. */
  marker: string;
  /** Whitespace between marker and content (e.g. `" "`, `"  "`). */
  spacing: string;
}

/** A contiguous region of text that can be wrapped. */
export interface WrappableRegion {
  range: TextRange;
  languageId: string;
  kind: RegionKind;
  /** Structured prefix — use `prefixToString()` for the flat representation. */
  prefix: CommentPrefix;
  /** Closing suffix for block comments, e.g. `" *\/"` */
  suffix?: string;
  /** Indent level of the content within the comment. */
  innerIndent: number;
  /** Lines that contain wrappable content (excludes opener/closer). */
  contentRange: { startLine: number; endLine: number };
}

/** Backend-neutral interface for detecting wrappable regions. */
export interface RegionProvider {
  getRegions(document: DocumentLike, range: TextRange): WrappableRegion[];
}

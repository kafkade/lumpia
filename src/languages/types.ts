export interface LanguageDefinition {
  /** Primary VS Code language ID. */
  id: string;
  /** Additional VS Code language IDs that share this definition. */
  aliases: string[];
  /** File extensions (with dot), e.g. `[".ts", ".tsx"]`. */
  extensions: string[];
  /** Line-comment markers, e.g. `["//"]` or `["#"]`. */
  lineComments: string[];
  /** Block-comment open/close pairs, e.g. `[["/*", "* /"]]`. */
  blockComments: [string, string][];
  /** Doc-comment markers (checked before regular markers). */
  docComments?: {
    /** Line doc markers, e.g. `["///", "//!"]`. */
    line?: string[];
    /** Block doc open/close pair, e.g. `["/**", "* /"]`. */
    block?: [string, string];
  };
  /** Triple-quote docstring delimiters (Python-style). */
  docstrings?: [string, string][];
}

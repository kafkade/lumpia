import * as vscode from "vscode";
import {
  resolveWraps,
  type SelectionInfo,
  type WrapContext,
} from "./resolveWraps";
import {
  resolveColumn,
  parseRulers,
  RulerCycleState,
  UNWRAP_COLUMN,
  type ColumnConfig,
} from "../config/resolveColumn";
import type { DocumentLike, TextRange } from "../parser/types";
import { validateColumnInput, parseColumnInput } from "./columnInput";

// ── VS Code adapters ─────────────────────────────────────────────────

function toDocumentLike(doc: vscode.TextDocument): DocumentLike {
  return {
    languageId: doc.languageId,
    lineCount: doc.lineCount,
    lineAt(line: number) {
      return doc.lineAt(line).text;
    },
    getText(range?: TextRange) {
      if (!range) return doc.getText();
      return doc.getText(
        new vscode.Range(
          range.startLine,
          range.startCol,
          range.endLine,
          range.endCol
        )
      );
    },
  };
}

function selectionsToInfo(
  selections: readonly vscode.Selection[]
): SelectionInfo[] {
  return selections.map((sel) => {
    let endLine = sel.end.line;
    // If selection ends at column 0, the last line isn't really selected
    if (!sel.isEmpty && sel.end.character === 0 && endLine > sel.start.line) {
      endLine--;
    }
    return {
      startLine: sel.start.line,
      endLine,
      isEmpty: sel.isEmpty,
      activeLine: sel.active.line,
    };
  });
}

// ── Shared edit application ──────────────────────────────────────────

async function applyWraps(
  editor: vscode.TextEditor,
  context: WrapContext
): Promise<void> {
  const doc = toDocumentLike(editor.document);
  const selections = selectionsToInfo(editor.selections);
  const edits = resolveWraps(doc, selections, context);

  if (edits.length === 0) return;

  await editor.edit((editBuilder) => {
    for (const edit of edits) {
      const range = new vscode.Range(
        edit.startLine,
        0,
        edit.endLine,
        editor.document.lineAt(edit.endLine).text.length
      );
      editBuilder.replace(range, edit.replacement);
    }
  });
}

// ── Per-session ruler cycling state ──────────────────────────────────

const rulerCycleState = new RulerCycleState();

// ── Shared formatting config ─────────────────────────────────────────

interface FormatConfig {
  tabWidth: number;
  reformat: boolean;
  wholeComment: boolean;
  doubleSentenceSpacing: boolean;
}

function readFormatConfig(document: vscode.TextDocument): FormatConfig {
  const lumpiaConfig = vscode.workspace.getConfiguration("lumpia", document);
  const editorConfig = vscode.workspace.getConfiguration("editor", document);
  return {
    tabWidth: editorConfig.get<number>("tabSize", 4),
    reformat: lumpiaConfig.get<boolean>("reformat", false),
    wholeComment: lumpiaConfig.get<boolean>("wholeComment", true),
    doubleSentenceSpacing: lumpiaConfig.get<boolean>(
      "doubleSentenceSpacing",
      false
    ),
  };
}

// ── Commands ─────────────────────────────────────────────────────────

export async function roll(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const { document } = editor;
  const lumpiaConfig = vscode.workspace.getConfiguration("lumpia", document);
  const editorConfig = vscode.workspace.getConfiguration("editor", document);

  const inspection = lumpiaConfig.inspect<number>("column");
  const rulers = parseRulers(editorConfig.get<unknown[]>("rulers"));

  const columnConfig: ColumnConfig = {
    languageColumn: inspection?.languageValue,
    globalColumn: inspection?.workspaceValue ?? inspection?.globalValue,
    rulers,
    wordWrapColumn: editorConfig.get<number>("wordWrapColumn"),
  };

  // Cycle through rulers when lumpia.column is not explicitly configured
  const hasLumpiaColumn =
    inspection?.languageValue !== undefined ||
    (inspection?.workspaceValue ?? inspection?.globalValue) !== undefined;

  if (!hasLumpiaColumn && rulers.length > 0) {
    const docKey = document.uri.toString();
    columnConfig.rulerCycleValue = rulerCycleState.next(docKey, rulers);
  }

  const column = resolveColumn(columnConfig);
  const { tabWidth, reformat, wholeComment, doubleSentenceSpacing } =
    readFormatConfig(document);

  await applyWraps(editor, {
    column,
    tabWidth,
    reformat,
    wholeComment,
    doubleSentenceSpacing,
  });

  // Show status bar feedback when cycling
  if (columnConfig.rulerCycleValue !== undefined) {
    const docKey = document.uri.toString();
    const idx = rulerCycleState.currentIndex(docKey)!;
    const label =
      column === UNWRAP_COLUMN ? "unwrap" : `column ${column}`;
    vscode.window.setStatusBarMessage(
      `Lumpia: ${label} (ruler ${idx + 1}/${rulers.length})`,
      3000
    );
  }
}

export async function rollAtColumn(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const input = await vscode.window.showInputBox({
    prompt: "Enter column width for wrapping (leave empty to unwrap)",
    placeHolder: "80",
    validateInput: validateColumnInput,
  });

  // Distinguish a cancelled input box (undefined) from an empty submission ("").
  if (input === undefined) return;

  const { document } = editor;
  const column = parseColumnInput(input);
  const { tabWidth, reformat, wholeComment, doubleSentenceSpacing } =
    readFormatConfig(document);

  await applyWraps(editor, {
    column,
    tabWidth,
    reformat,
    wholeComment,
    doubleSentenceSpacing,
  });
}

export async function unwrap(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const { tabWidth, reformat, wholeComment, doubleSentenceSpacing } =
    readFormatConfig(editor.document);

  await applyWraps(editor, {
    column: UNWRAP_COLUMN,
    tabWidth,
    reformat,
    wholeComment,
    doubleSentenceSpacing,
  });
}

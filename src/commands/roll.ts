import * as vscode from "vscode";
import {
  resolveWraps,
  type SelectionInfo,
  type WrapContext,
} from "./resolveWraps";
import {
  resolveColumn,
  parseRulers,
  type ColumnConfig,
} from "../config/resolveColumn";
import type { DocumentLike, TextRange } from "../parser/types";

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

// ── Commands ─────────────────────────────────────────────────────────

export async function roll(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const { document } = editor;
  const lumpiaConfig = vscode.workspace.getConfiguration("lumpia", document);
  const editorConfig = vscode.workspace.getConfiguration("editor", document);

  const inspection = lumpiaConfig.inspect<number>("column");
  const columnConfig: ColumnConfig = {
    languageColumn: inspection?.languageValue,
    globalColumn: inspection?.workspaceValue ?? inspection?.globalValue,
    rulers: parseRulers(editorConfig.get<unknown[]>("rulers")),
    wordWrapColumn: editorConfig.get<number>("wordWrapColumn"),
  };

  const column = resolveColumn(columnConfig);
  const tabWidth = editorConfig.get<number>("tabSize", 4);
  const reformat = lumpiaConfig.get<boolean>("reformat", false);

  await applyWraps(editor, { column, tabWidth, reformat });
}

export async function rollAtColumn(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const input = await vscode.window.showInputBox({
    prompt: "Enter column width for wrapping",
    placeHolder: "80",
    validateInput: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1) {
        return "Enter a positive integer";
      }
      return null;
    },
  });

  if (!input) return;

  const { document } = editor;
  const column = parseInt(input, 10);
  const editorConfig = vscode.workspace.getConfiguration("editor", document);
  const tabWidth = editorConfig.get<number>("tabSize", 4);
  const lumpiaConfig = vscode.workspace.getConfiguration("lumpia", document);
  const reformat = lumpiaConfig.get<boolean>("reformat", false);

  await applyWraps(editor, { column, tabWidth, reformat });
}

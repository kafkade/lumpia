import * as vscode from "vscode";
import { rollText } from "../engine/wrapper";
import { resolveColumn, parseRulers, type ColumnConfig } from "../config/resolveColumn";

export async function roll(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const { document, selections } = editor;

  const lumpiaConfig = vscode.workspace.getConfiguration("lumpia", document);
  const editorConfig = vscode.workspace.getConfiguration("editor", document);

  // Build config for column resolution
  const inspection = lumpiaConfig.inspect<number>("column");
  const columnConfig: ColumnConfig = {
    languageColumn: inspection?.languageValue,
    globalColumn: inspection?.workspaceValue ?? inspection?.globalValue,
    rulers: parseRulers(
      editorConfig.get<unknown[]>("rulers")
    ),
    wordWrapColumn: editorConfig.get<number>("wordWrapColumn"),
  };

  const column = resolveColumn(columnConfig);
  const tabWidth = editorConfig.get<number>("tabSize", 4);

  await editor.edit((editBuilder) => {
    for (const selection of selections) {
      const range = selection.isEmpty
        ? document.lineAt(selection.active.line).range
        : selection;

      const text = document.getText(range);
      const rolled = rollText(text, column, { tabWidth });
      editBuilder.replace(range, rolled);
    }
  });
}

export async function rollAtColumn(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

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

  const column = parseInt(input, 10);
  const { document, selections } = editor;
  const editorConfig = vscode.workspace.getConfiguration("editor", document);
  const tabWidth = editorConfig.get<number>("tabSize", 4);

  await editor.edit((editBuilder) => {
    for (const selection of selections) {
      const range = selection.isEmpty
        ? document.lineAt(selection.active.line).range
        : selection;

      const text = document.getText(range);
      const rolled = rollText(text, column, { tabWidth });
      editBuilder.replace(range, rolled);
    }
  });
}

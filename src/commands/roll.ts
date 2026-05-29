import * as vscode from "vscode";
import { rollText } from "../engine/wrapper";

export async function roll(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const config = vscode.workspace.getConfiguration("lumpia");
  const column = config.get<number>("column", 80);

  const { document, selections } = editor;

  await editor.edit((editBuilder) => {
    for (const selection of selections) {
      const range = selection.isEmpty
        ? document.lineAt(selection.active.line).range
        : selection;

      const text = document.getText(range);
      const rolled = rollText(text, column);
      editBuilder.replace(range, rolled);
    }
  });
}

import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "lumpia.roll",
    async () => {
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
  );

  context.subscriptions.push(disposable);
}

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

export function deactivate() {}

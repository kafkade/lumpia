import * as vscode from "vscode";
import { roll } from "./commands/roll";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("lumpia.roll", roll)
  );
}

export function deactivate() {}

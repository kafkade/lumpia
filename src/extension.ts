import * as vscode from "vscode";
import { roll, rollAtColumn, unwrap } from "./commands/roll";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("lumpia.roll", roll),
    vscode.commands.registerCommand("lumpia.rollAtColumn", rollAtColumn),
    vscode.commands.registerCommand("lumpia.unwrap", unwrap)
  );
}

export function deactivate() {}

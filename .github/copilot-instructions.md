# Copilot Instructions for Lumpia

## What is this?

Lumpia is a VS Code extension that rolls text to a configurable column width. It exposes a single command (`lumpia.roll`, bound to `Alt+R`) that rolls selected text or the current line.

## Build & Lint

```sh
npm run build          # Production build via esbuild
npm run watch          # Dev build with file watching
npm run lint           # ESLint (eslint src)
npm run package        # Package as .vsix
```

There are no tests yet.

## Architecture

This is a single-file extension. All logic lives in `src/extension.ts`:

- **`activate`** — Registers the `lumpia.roll` command. Reads `lumpia.column` from VS Code config, gets the editor selection (or current line if nothing selected), and calls `rollText`.
- **`rollText(text, column)`** — Pure function. Splits text into paragraphs (on blank lines), then greedily fills each line up to `column` width. Exported separately from the command handler so it can be unit-tested independently.

The extension is bundled with esbuild (`esbuild.js`) into a single `dist/extension.js` CJS file. VS Code APIs are externalized.

## Git Policy

- **Never commit automatically.** Do not run `git commit`, `git push`, or any
  other command that creates or modifies commits without explicit user approval.
- Always present proposed changes and let the user decide when to commit.
- This applies to all agents, sub-agents, and automated workflows.

## Conventions

- TypeScript with strict mode, targeting ES2022
- Extension entry point must remain `src/extension.ts` (referenced by both `esbuild.js` and `tsconfig.json`)
- Configuration keys are namespaced under `lumpia.*` in `package.json` contributes
- Debug the extension via the "Run Extension" launch config which opens an Extension Development Host

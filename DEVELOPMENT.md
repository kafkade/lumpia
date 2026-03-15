# Development Guide

## Prerequisites

- [Node.js](https://nodejs.org/) 22 LTS or later
- [Visual Studio Code](https://code.visualstudio.com/)
- A [VS Code Marketplace](https://marketplace.visualstudio.com/) publisher account (for publishing)

## Project Structure

```
lumpia/
├── src/
│   ├── extension.ts        # Extension entry point + rollText logic
│   └── rollText.test.ts    # Unit tests (vitest)
├── dist/
│   └── extension.js        # Bundled output (generated)
├── .github/
│   └── workflows/
│       ├── ci.yml           # PR validation (lint, build, test)
│       └── release.yml      # Automated release & publish on push to main
├── esbuild.js              # Build configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint configuration
└── package.json            # Extension manifest & scripts
```

## Development Workflow

### 1. Install dependencies

```sh
npm install
```

### 2. Build

```sh
npm run build       # Production build (minified, no sourcemaps)
npm run watch       # Dev build with file watching
```

The build uses [esbuild](https://esbuild.github.io/) to bundle `src/extension.ts` into a single `dist/extension.js` CommonJS file. VS Code APIs are externalized.

### 3. Run and debug

1. Open the project in VS Code
2. Press `F5` (or use the **Run Extension** launch config)
3. An Extension Development Host window opens with Lumpia loaded
4. Test the extension by selecting text and pressing `Alt+R`

### 4. Run tests

```sh
npm test
```

Tests use [vitest](https://vitest.dev/). Unit tests for the `rollText` function live in `src/rollText.test.ts`.

### 5. Lint

```sh
npm run lint
```

Uses ESLint with TypeScript support.

## Making Changes

1. **Create a branch** from `main` for your work
2. **Edit `src/extension.ts`** — all extension logic lives in this single file
3. **Write or update tests** in `src/rollText.test.ts` for any `rollText` changes
4. **Run the full check suite** before pushing:
   ```sh
   npm run lint && npm run build && npm test
   ```
5. **Open a pull request** against `main` — CI will run lint, build, and test automatically

## Release Process

Lumpia uses a fully automated release pipeline. When you push to `main`, the [release workflow](.github/workflows/release.yml) handles packaging, tagging, GitHub Releases, and VS Code Marketplace publishing — but only if the version in `package.json` has changed.

### Step-by-step: Creating a new release

#### 1. Update the version

Bump the version in `package.json`. Follow [semver](https://semver.org/):

```sh
npm version patch   # 0.0.1 → 0.0.2 (bug fixes)
npm version minor   # 0.0.1 → 0.1.0 (new features)
npm version major   # 0.0.1 → 1.0.0 (breaking changes)
```

Or edit the `"version"` field in `package.json` manually.

#### 2. Update the changelog

Move items from the `Unreleased` section in `CHANGELOG.md` under a new version heading:

```md
## 0.0.2

- Fixed edge case with trailing whitespace
- Added support for indented paragraphs

## 0.0.1

- Initial release
```

#### 3. Commit and push to main

```sh
git add package.json CHANGELOG.md
git commit -m "Release v0.0.2"
git push origin main
```

Or merge a pull request into `main` — either way triggers the release.

#### 4. What happens automatically

The release workflow:

1. **Installs dependencies** (`npm ci`)
2. **Builds** the extension (`npm run build`)
3. **Runs tests** (`npm test`)
4. **Reads the version** from `package.json`
5. **Checks if a tag** `v{version}` already exists — if it does, all remaining steps are skipped
6. **Packages the extension** into a `.vsix` file (`npx vsce package`)
7. **Creates a git tag** `v{version}` and pushes it
8. **Creates a GitHub Release** at that tag with auto-generated release notes and the `.vsix` attached
9. **Publishes to the VS Code Marketplace** using `vsce publish`

#### 5. Verify

- **GitHub Release**: Go to [Releases](../../releases) — you should see the new version with the `.vsix` file attached
- **VS Code Marketplace**: Search for "Lumpia" in the VS Code Extensions panel or visit the Marketplace page

### Required setup (one-time)

For the automated publish to the VS Code Marketplace to work, you need a **Personal Access Token (PAT)** stored as a GitHub repository secret:

1. Go to [Azure DevOps](https://dev.azure.com/) → User Settings → Personal Access Tokens
2. Create a token with the **Marketplace (Manage)** scope
3. In your GitHub repo, go to Settings → Secrets and variables → Actions
4. Add a secret named `VSCE_PAT` with the token value

### Manual release (if needed)

If you need to publish without the workflow:

```sh
npm run build
npm test
npx vsce package           # Creates lumpia-{version}.vsix
npx vsce publish            # Publishes to VS Code Marketplace (requires VSCE_PAT env var)
```

To create a GitHub Release manually:

```sh
git tag v0.0.2
git push origin v0.0.2
```

Then go to GitHub → Releases → Draft a new release, select the tag, and attach the `.vsix` file.

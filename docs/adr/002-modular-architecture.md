# ADR-002: Modular File Architecture

## Status

Accepted

## Context

Lumpia is currently a single-file extension (`src/extension.ts`, ~60 lines). To support comment-aware wrapping, 40+ languages, multiple commands, and configurable behavior, the codebase must be restructured without over-engineering.

## Decision

Adopt a modular architecture organized by responsibility:

```
src/
├── extension.ts              # VS Code command registration, activation
├── commands/
│   ├── roll.ts               # lumpia.roll command handler
│   ├── unwrap.ts             # lumpia.unwrap command handler
│   └── rollAtColumn.ts       # lumpia.rollAtColumn command handler
├── engine/
│   ├── wrapper.ts            # Core wrapping algorithm (pure function)
│   ├── unwrapper.ts          # Unwrap/join-lines logic
│   └── blocks.ts             # Block model (paragraph, list, code, heading, etc.)
├── parser/
│   ├── types.ts              # RegionProvider interface, WrappableRegion type
│   ├── regexProvider.ts      # Regex-based region detection
│   └── treeSitterProvider.ts # Future: Tree-sitter WASM provider
├── languages/
│   ├── registry.ts           # Language definition registry + lookup
│   ├── types.ts              # LanguageDefinition type
│   └── definitions/          # One file per language family
│       ├── c-family.ts       # C, C++, C#, Java, JS, TS, Go, Rust, Swift, etc.
│       ├── script-family.ts  # Python, Ruby, Perl, Shell, PowerShell, etc.
│       ├── markup.ts         # HTML, XML, Markdown, LaTeX
│       └── config.ts         # YAML, TOML, INI, Dockerfile, Makefile
├── config/
│   ├── resolver.ts           # Column/config resolution with precedence
│   └── types.ts              # Configuration types
├── content/
│   ├── markdown.ts           # Markdown-aware block splitting
│   └── docComments.ts        # Doc comment tag handling (JSDoc, XMLDoc, etc.)
└── utils/
    ├── displayWidth.ts       # Unicode display-width calculation (CJK, emoji)
    └── text.ts               # Text utilities (indentation, prefix detection)
```

### Key principles

1. **Pure functions over classes**: The wrapping engine, parser, and content handlers are pure functions that take data and return data. No hidden state.
2. **VS Code API isolated to extension.ts and commands/**: All other modules are VS Code-independent and can be unit tested without mocks.
3. **Language definitions are data**: Each language is a declarative object (comment markers, doc patterns), not procedural code.
4. **Single entry point**: `extension.ts` remains the activation entry point as required by esbuild config and `package.json`.

## Consequences

### Positive

- Each module can be tested in isolation without VS Code mocks
- Language definitions are easy to add/modify
- Wrapping engine is reusable (could support CLI, other editors)
- Clear dependency flow: commands → config → parser → engine

### Negative

- More files to navigate than the current single-file approach
- esbuild bundles everything into one file anyway, so the structure is for developer experience only
- Initial refactoring effort before new features can be added

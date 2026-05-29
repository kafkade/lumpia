# ADR-000: Architecture Decision Record Template

## Status

Accepted

## Context

We need a lightweight way to record architectural decisions as the project grows from a single-file extension to a full-featured comment-aware wrapping engine.

## Decision

Use Markdown ADR files in `docs/adr/`. Each ADR is numbered sequentially and follows this template format.

## Consequences

- All significant architecture decisions are documented and discoverable
- New contributors can understand the "why" behind design choices
- Decisions can be superseded by later ADRs (reference the superseding ADR in Status)

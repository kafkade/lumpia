# ADR-010: Unicode Display Width Handling

## Status

Proposed

## Context

Lumpia currently uses `string.length` to measure line width. This is incorrect for:

- **CJK characters** — display as 2 columns wide (Chinese, Japanese, Korean)
- **Emoji** — may be 2 columns wide
- **Combining marks** — zero width (diacritics, accents)
- **Tabs** — variable width depending on tab stops
- **Full-width punctuation** — 2 columns wide

For Lumpia to correctly handle international text, display-width-aware wrapping is essential.

## Decision

### Use display-width calculation instead of `string.length`

Implement or adopt a `displayWidth(text: string, tabWidth: number): number` function that accounts for:

1. **East Asian Width** — characters marked as Wide (W) or Fullwidth (F) in Unicode's `EastAsianWidth.txt` count as 2 columns
2. **Tabs** — expand to next tab stop based on current column position
3. **Combining marks** — zero width
4. **Control characters** — zero width
5. **Emoji** — generally 2 columns (use Unicode emoji properties)

### Implementation approach

Use a lightweight lookup table derived from Unicode data, not a full ICU library. The table maps Unicode ranges to width values (0, 1, or 2).

Consider using or adapting the npm package `string-width` (MIT licensed, widely used, handles East Asian Width + emoji + ANSI). Bundle size is minimal.

### Integration points

- `wrapper.ts` — use `displayWidth` instead of `.length` for column calculations
- `utils/displayWidth.ts` — centralized width function
- Tab handling — resolve tabs to spaces using `editor.tabSize` before width calculation

## Consequences

### Positive

- Correct wrapping for CJK text (significant user base)
- Correct wrapping for emoji-heavy comments
- Tabs handled correctly
- Matches terminal/editor column rendering

### Negative

- Slight performance cost for width calculation (mitigated by lookup table)
- Must handle tab expansion carefully (tab stops are position-dependent)
- Display width ≠ byte length ≠ character count — all three are different

/**
 * Unicode display-width utilities.
 *
 * Replaces naive `string.length` with column-aware width calculation
 * that handles CJK, emoji, combining marks, and tabs.
 */

// Sorted ranges where characters are wide (display width 2).
// Covers CJK, Hangul, fullwidth forms, and common emoji blocks.
const WIDE_RANGES: readonly [number, number][] = [
  [0x1100, 0x115F],   // Hangul Jamo
  [0x231A, 0x231B],   // Watch, Hourglass
  [0x2329, 0x232A],   // Angle brackets
  [0x23E9, 0x23F3],   // Media controls
  [0x23F8, 0x23FA],   // More media
  [0x25FD, 0x25FE],   // Squares
  [0x2614, 0x2615],   // Umbrella, hot beverage
  [0x2648, 0x2653],   // Zodiac
  [0x267F, 0x267F],   // Wheelchair
  [0x2693, 0x2693],   // Anchor
  [0x26A1, 0x26A1],   // Zap
  [0x26AA, 0x26AB],   // Circles
  [0x26BD, 0x26BE],   // Soccer, baseball
  [0x26C4, 0x26C5],   // Snowman, sun behind cloud
  [0x26CE, 0x26CE],   // Ophiuchus
  [0x26D4, 0x26D4],   // No entry
  [0x26EA, 0x26EA],   // Church
  [0x26F2, 0x26F3],   // Fountain, golf
  [0x26F5, 0x26F5],   // Sailboat
  [0x26FA, 0x26FA],   // Tent
  [0x26FD, 0x26FD],   // Fuel pump
  [0x2702, 0x2702],   // Scissors
  [0x2705, 0x2705],   // Check mark
  [0x2708, 0x270D],   // Airplane through writing hand
  [0x270F, 0x270F],   // Pencil
  [0x2712, 0x2712],   // Black nib
  [0x2714, 0x2714],   // Heavy check
  [0x2716, 0x2716],   // Heavy multiplication
  [0x271D, 0x271D],   // Cross
  [0x2721, 0x2721],   // Star of David
  [0x2728, 0x2728],   // Sparkles
  [0x2733, 0x2734],   // Eight spoked asterisk
  [0x2744, 0x2744],   // Snowflake
  [0x2747, 0x2747],   // Sparkle
  [0x274C, 0x274C],   // Cross mark
  [0x274E, 0x274E],   // Cross mark
  [0x2753, 0x2755],   // Question marks
  [0x2757, 0x2757],   // Exclamation
  [0x2763, 0x2764],   // Heart exclamation, heart
  [0x2795, 0x2797],   // Plus, minus, divide
  [0x27A1, 0x27A1],   // Right arrow
  [0x27B0, 0x27B0],   // Curly loop
  [0x27BF, 0x27BF],   // Double curly loop
  [0x2934, 0x2935],   // Arrows
  [0x2B05, 0x2B07],   // Arrows
  [0x2B1B, 0x2B1C],   // Squares
  [0x2B50, 0x2B50],   // Star
  [0x2B55, 0x2B55],   // Circle
  [0x2E80, 0x303E],   // CJK Radicals through CJK Symbols
  [0x3041, 0x33FF],   // Hiragana through CJK Compatibility
  [0x3400, 0x4DBF],   // CJK Extension A
  [0x4E00, 0x9FFF],   // CJK Unified Ideographs
  [0xA000, 0xA4CF],   // Yi
  [0xA960, 0xA97C],   // Hangul Jamo Extended-A
  [0xAC00, 0xD7A3],   // Hangul Syllables
  [0xD7B0, 0xD7FF],   // Hangul Jamo Extended-B
  [0xF900, 0xFAFF],   // CJK Compatibility Ideographs
  [0xFE10, 0xFE19],   // Vertical forms
  [0xFE30, 0xFE6F],   // CJK Compatibility Forms
  [0xFF01, 0xFF60],   // Fullwidth Forms
  [0xFFE0, 0xFFE6],   // Fullwidth Signs
  [0x1F000, 0x1FAFF], // Emoji (Mahjong through Symbols Extended-A)
  [0x1FC00, 0x1FFFD], // Supplementary symbols
  [0x20000, 0x2FFFD], // CJK Supplement
  [0x30000, 0x3FFFD], // CJK Extension G+
];

// Sorted ranges where characters have zero display width.
// Covers combining marks, zero-width characters, variation selectors.
const ZERO_WIDTH_RANGES: readonly [number, number][] = [
  [0x00AD, 0x00AD],   // Soft hyphen
  [0x0300, 0x036F],   // Combining Diacritical Marks
  [0x0483, 0x0489],   // Cyrillic combining
  [0x0591, 0x05C7],   // Hebrew combining
  [0x0600, 0x0605],   // Arabic number signs
  [0x0610, 0x061A],   // Arabic combining
  [0x061C, 0x061C],   // ALM
  [0x064B, 0x065F],   // Arabic combining
  [0x0670, 0x0670],   // Arabic combining
  [0x06D6, 0x06ED],   // Arabic combining
  [0x070F, 0x074A],   // Syriac
  [0x07A6, 0x07B0],   // Thaana
  [0x07EB, 0x07F3],   // NKo combining
  [0x07FD, 0x07FD],   // NKo combining
  [0x0816, 0x082D],   // Samaritan combining
  [0x0859, 0x085B],   // Mandaic combining
  [0x0898, 0x089F],   // Arabic combining
  [0x08CA, 0x0903],   // Arabic/Devanagari combining
  [0x093A, 0x094F],   // Devanagari combining
  [0x0951, 0x0957],   // Devanagari stress
  [0x0962, 0x0963],   // Devanagari vowel
  [0x0981, 0x0983],   // Bengali combining
  [0x09BC, 0x09CD],   // Bengali combining
  [0x09D7, 0x09D7],   // Bengali AU length mark
  [0x09E2, 0x09E3],   // Bengali vowel
  [0x09FE, 0x09FE],   // Bengali sandhi mark
  [0x0A01, 0x0A03],   // Gurmukhi combining
  [0x0A3C, 0x0A51],   // Gurmukhi combining
  [0x0A70, 0x0A71],   // Gurmukhi combining
  [0x0A75, 0x0A75],   // Gurmukhi combining
  [0x0A81, 0x0A83],   // Gujarati combining
  [0x0ABC, 0x0ACD],   // Gujarati combining
  [0x0AE2, 0x0AE3],   // Gujarati vowel
  [0x0AFA, 0x0AFF],   // Gujarati combining
  [0x0B01, 0x0B03],   // Oriya combining
  [0x0B3C, 0x0B57],   // Oriya combining
  [0x0B62, 0x0B63],   // Oriya vowel
  [0x0B82, 0x0B82],   // Tamil combining
  [0x0BBE, 0x0BCD],   // Tamil combining
  [0x0BD7, 0x0BD7],   // Tamil AU length mark
  [0x0C00, 0x0C04],   // Telugu combining
  [0x0C3C, 0x0C56],   // Telugu combining
  [0x0C62, 0x0C63],   // Telugu vowel
  [0x0C81, 0x0C83],   // Kannada combining
  [0x0CBC, 0x0CCD],   // Kannada combining
  [0x0CD5, 0x0CD6],   // Kannada length mark
  [0x0CE2, 0x0CE3],   // Kannada vowel
  [0x0D00, 0x0D03],   // Malayalam combining
  [0x0D3B, 0x0D4D],   // Malayalam combining
  [0x0D57, 0x0D57],   // Malayalam AU length mark
  [0x0D62, 0x0D63],   // Malayalam vowel
  [0x0D81, 0x0D83],   // Sinhala combining
  [0x0DCA, 0x0DDF],   // Sinhala combining
  [0x0DF2, 0x0DF3],   // Sinhala vowel
  [0x0E31, 0x0E31],   // Thai combining
  [0x0E34, 0x0E3A],   // Thai combining
  [0x0E47, 0x0E4E],   // Thai combining
  [0x0EB1, 0x0EB1],   // Lao combining
  [0x0EB4, 0x0EBC],   // Lao combining
  [0x0EC8, 0x0ECE],   // Lao combining
  [0x0F18, 0x0F19],   // Tibetan combining
  [0x0F35, 0x0F35],   // Tibetan combining
  [0x0F37, 0x0F37],   // Tibetan combining
  [0x0F39, 0x0F39],   // Tibetan combining
  [0x0F71, 0x0F84],   // Tibetan combining
  [0x0F86, 0x0F87],   // Tibetan combining
  [0x0F8D, 0x0FBC],   // Tibetan combining
  [0x0FC6, 0x0FC6],   // Tibetan combining
  [0x1160, 0x11FF],   // Hangul Jamo medial/final
  [0x135D, 0x135F],   // Ethiopic combining
  [0x1712, 0x1715],   // Tagalog combining
  [0x1732, 0x1734],   // Hanunoo combining
  [0x1752, 0x1753],   // Buhid combining
  [0x1772, 0x1773],   // Tagbanwa combining
  [0x17B4, 0x17D3],   // Khmer combining
  [0x17DD, 0x17DD],   // Khmer combining
  [0x180B, 0x180F],   // Mongolian free variation selectors
  [0x1885, 0x1886],   // Mongolian combining
  [0x18A9, 0x18A9],   // Mongolian combining
  [0x1920, 0x193B],   // Limbu/Tai Le combining
  [0x1A17, 0x1A1B],   // Buginese combining
  [0x1A55, 0x1A7F],   // Tai Tham combining
  [0x1AB0, 0x1ACE],   // Combining Diacritical Marks Extended
  [0x1B00, 0x1B04],   // Balinese combining
  [0x1B34, 0x1B44],   // Balinese combining
  [0x1B6B, 0x1B73],   // Balinese musical symbols
  [0x1B80, 0x1B82],   // Sundanese combining
  [0x1BA1, 0x1BAD],   // Sundanese combining
  [0x1BE6, 0x1BF3],   // Batak combining
  [0x1C24, 0x1C37],   // Lepcha combining
  [0x1CD0, 0x1CF9],   // Vedic extensions
  [0x1DC0, 0x1DFF],   // Combining Diacritical Marks Supplement
  [0x200B, 0x200F],   // Zero-width chars and direction marks
  [0x2028, 0x202E],   // Line/paragraph separators, direction
  [0x2060, 0x206F],   // Invisible operators and deprecated
  [0x20D0, 0x20FF],   // Combining Marks for Symbols
  [0xA66F, 0xA672],   // Cyrillic Extended combining
  [0xA674, 0xA67D],   // Cyrillic Extended combining
  [0xA69E, 0xA69F],   // Cyrillic Extended combining
  [0xA6F0, 0xA6F1],   // Bamum combining
  [0xA802, 0xA802],   // Syloti Nagri combining
  [0xA806, 0xA806],   // Syloti Nagri combining
  [0xA80B, 0xA80B],   // Syloti Nagri combining
  [0xA823, 0xA827],   // Syloti Nagri combining
  [0xA82C, 0xA82C],   // Syloti Nagri combining
  [0xA880, 0xA881],   // Saurashtra combining
  [0xA8B4, 0xA8C5],   // Saurashtra combining
  [0xA8E0, 0xA8F1],   // Combining Devanagari
  [0xA926, 0xA92D],   // Kayah Li combining
  [0xA947, 0xA953],   // Rejang combining
  [0xA980, 0xA983],   // Javanese combining
  [0xA9B3, 0xA9C0],   // Javanese combining
  [0xAA29, 0xAA36],   // Cham combining
  [0xAA43, 0xAA43],   // Cham combining
  [0xAA4C, 0xAA4D],   // Cham combining
  [0xAA7B, 0xAA7D],   // Myanmar Extended combining
  [0xAAB0, 0xAABF],   // Tai Viet combining
  [0xAAC1, 0xAAC1],   // Tai Viet combining
  [0xAAEB, 0xAAEF],   // Meetei Mayek combining
  [0xAAF5, 0xAAF6],   // Meetei Mayek combining
  [0xABE3, 0xABEA],   // Meetei Mayek Extended combining
  [0xABEC, 0xABED],   // Meetei Mayek Extended combining
  [0xFB1E, 0xFB1E],   // Hebrew combining
  [0xFE00, 0xFE0F],   // Variation Selectors
  [0xFE20, 0xFE2F],   // Combining Half Marks
  [0xFEFF, 0xFEFF],   // BOM / ZWNBSP
  [0xFFF9, 0xFFFB],   // Interlinear annotations
  [0xE0001, 0xE007F], // Tags
  [0xE0100, 0xE01EF], // Variation Selectors Supplement
];

/** Binary search over sorted range table. */
function inRanges(cp: number, ranges: readonly [number, number][]): boolean {
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [start, end] = ranges[mid];
    if (cp < start) {
      hi = mid - 1;
    } else if (cp > end) {
      lo = mid + 1;
    } else {
      return true;
    }
  }
  return false;
}

/** Returns the display width of a single Unicode code point (0, 1, or 2). */
export function charWidth(cp: number): 0 | 1 | 2 {
  if (cp < 0x20) return 0;              // C0 control (tab handled by caller)
  if (cp >= 0x7F && cp < 0xA0) return 0; // C1 control
  if (inRanges(cp, ZERO_WIDTH_RANGES)) return 0;
  if (inRanges(cp, WIDE_RANGES)) return 2;
  return 1;
}

/**
 * Calculate the display width of a string in terminal/editor columns.
 *
 * - CJK / fullwidth characters → 2 columns
 * - Combining marks / zero-width → 0 columns
 * - Tabs → expand to next tab stop
 * - Everything else → 1 column
 */
export function displayWidth(text: string, tabWidth = 4): number {
  let width = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp === 0x09) {
      // Tab: advance to next tab stop
      width += tabWidth - (width % tabWidth);
    } else {
      width += charWidth(cp);
    }
  }
  return width;
}

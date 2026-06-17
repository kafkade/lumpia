import { describe, it, expect } from "vitest";
import { charWidth, displayWidth } from "./displayWidth";

describe("charWidth", () => {
  it("returns 1 for ASCII characters", () => {
    expect(charWidth(0x41)).toBe(1); // A
    expect(charWidth(0x7A)).toBe(1); // z
    expect(charWidth(0x30)).toBe(1); // 0
    expect(charWidth(0x20)).toBe(1); // space
  });

  it("returns 0 for C0 control characters", () => {
    expect(charWidth(0x00)).toBe(0); // NUL
    expect(charWidth(0x01)).toBe(0); // SOH
    expect(charWidth(0x0A)).toBe(0); // LF
    expect(charWidth(0x0D)).toBe(0); // CR
  });

  it("returns 0 for C1 control characters", () => {
    expect(charWidth(0x7F)).toBe(0); // DEL
    expect(charWidth(0x80)).toBe(0);
    expect(charWidth(0x9F)).toBe(0);
  });

  it("returns 2 for CJK ideographs", () => {
    expect(charWidth(0x4E2D)).toBe(2); // 中
    expect(charWidth(0x6587)).toBe(2); // 文
    expect(charWidth(0x5B57)).toBe(2); // 字
  });

  it("returns 2 for Hangul syllables", () => {
    expect(charWidth(0xAC00)).toBe(2); // 가
    expect(charWidth(0xD7A3)).toBe(2); // last Hangul syllable
  });

  it("returns 2 for Hiragana", () => {
    expect(charWidth(0x3042)).toBe(2); // あ
  });

  it("returns 2 for Katakana", () => {
    expect(charWidth(0x30A2)).toBe(2); // ア
  });

  it("returns 2 for fullwidth forms", () => {
    expect(charWidth(0xFF01)).toBe(2); // ！
    expect(charWidth(0xFF10)).toBe(2); // ０
    expect(charWidth(0xFF21)).toBe(2); // Ａ
  });

  it("returns 2 for common emoji", () => {
    expect(charWidth(0x1F600)).toBe(2); // 😀
    expect(charWidth(0x1F4A9)).toBe(2); // 💩
    expect(charWidth(0x1F680)).toBe(2); // 🚀
  });

  it("returns 0 for combining diacritical marks", () => {
    expect(charWidth(0x0300)).toBe(0); // Combining grave accent
    expect(charWidth(0x0301)).toBe(0); // Combining acute accent
    expect(charWidth(0x0308)).toBe(0); // Combining diaeresis
    expect(charWidth(0x0327)).toBe(0); // Combining cedilla
  });

  it("returns 0 for variation selectors", () => {
    expect(charWidth(0xFE0E)).toBe(0); // VS15 (text)
    expect(charWidth(0xFE0F)).toBe(0); // VS16 (emoji)
  });

  it("returns 0 for zero-width characters", () => {
    expect(charWidth(0x200B)).toBe(0); // Zero-width space
    expect(charWidth(0x200C)).toBe(0); // ZWNJ
    expect(charWidth(0x200D)).toBe(0); // ZWJ
    expect(charWidth(0xFEFF)).toBe(0); // BOM
    expect(charWidth(0x2060)).toBe(0); // Word joiner
  });

  it("returns 1 for standard Latin extended", () => {
    expect(charWidth(0x00E9)).toBe(1); // é (precomposed)
    expect(charWidth(0x00F1)).toBe(1); // ñ (precomposed)
    expect(charWidth(0x00FC)).toBe(1); // ü (precomposed)
  });
});

describe("displayWidth", () => {
  it("returns 0 for empty string", () => {
    expect(displayWidth("")).toBe(0);
  });

  it("returns character count for pure ASCII", () => {
    expect(displayWidth("hello")).toBe(5);
    expect(displayWidth("hello world")).toBe(11);
  });

  it("counts CJK characters as 2 columns", () => {
    expect(displayWidth("中文")).toBe(4);       // 2 CJK chars × 2
    expect(displayWidth("hello中文")).toBe(9); // 5 + 4
  });

  it("counts Hangul as 2 columns", () => {
    expect(displayWidth("한글")).toBe(4);
  });

  it("counts fullwidth forms as 2 columns", () => {
    expect(displayWidth("Ｈｅｌｌｏ")).toBe(10); // 5 fullwidth Latin
  });

  it("counts emoji as 2 columns", () => {
    expect(displayWidth("🚀")).toBe(2);
    expect(displayWidth("hello 🚀")).toBe(8); // 6 + 2
    expect(displayWidth("🎉🎊")).toBe(4);     // 2 emoji × 2
  });

  it("treats combining marks as 0 columns", () => {
    // e + combining acute accent = é (decomposed)
    expect(displayWidth("e\u0301")).toBe(1);
    // n + combining tilde = ñ (decomposed)
    expect(displayWidth("n\u0303")).toBe(1);
  });

  it("handles precomposed accented characters as 1 column", () => {
    expect(displayWidth("café")).toBe(4);
    expect(displayWidth("naïve")).toBe(5);
  });

  it("treats zero-width characters as 0 columns", () => {
    expect(displayWidth("a\u200Bb")).toBe(2);  // a + ZWS + b
    expect(displayWidth("a\u200Db")).toBe(2);  // a + ZWJ + b
    expect(displayWidth("\uFEFFtext")).toBe(4); // BOM + text
  });

  it("expands tabs to tab stops (default tabWidth=4)", () => {
    expect(displayWidth("\t")).toBe(4);
    expect(displayWidth("a\t")).toBe(4);       // a=1, tab advances to 4
    expect(displayWidth("ab\t")).toBe(4);      // ab=2, tab advances to 4
    expect(displayWidth("abc\t")).toBe(4);     // abc=3, tab advances to 4
    expect(displayWidth("abcd\t")).toBe(8);    // abcd=4, tab advances to 8
  });

  it("expands tabs with custom tabWidth", () => {
    expect(displayWidth("\t", 8)).toBe(8);
    expect(displayWidth("a\t", 8)).toBe(8);
    expect(displayWidth("ab\t", 2)).toBe(4);   // ab=2, at tab stop already → next=4, width=4
  });

  it("handles tab at beginning", () => {
    expect(displayWidth("\thello")).toBe(9);    // tab=4, hello=5
  });

  it("handles multiple tabs", () => {
    expect(displayWidth("\t\t")).toBe(8);       // each tab = 4
    expect(displayWidth("a\tb\t")).toBe(8);    // a=1, tab→4, b=5, tab→8
  });

  it("handles mixed CJK and ASCII", () => {
    // "Hello世界" = 5 ASCII + 2 CJK × 2 = 9
    expect(displayWidth("Hello世界")).toBe(9);
  });

  it("handles mixed content with emoji and CJK", () => {
    // "🚀中a" = 2 + 2 + 1 = 5
    expect(displayWidth("🚀中a")).toBe(5);
  });
});

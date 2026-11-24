import { describe, expect, it } from "vitest";
import { translateString } from "@/lib/i18n/autoTranslate";
import { JA_DICT, JA_PATTERNS } from "@/lib/i18n/jaDictionary";

describe("Japanese translation", () => {
  it("translates dictionary strings, ignoring extra whitespace", () => {
    expect(translateString("Community Posts")).toBe("地域の投稿");
    expect(translateString("  Community   Posts ")).toBe("地域の投稿");
  });

  it("leaves unknown text and non-text alone", () => {
    expect(translateString("Ken Tanaka")).toBeNull();
    expect(translateString("42")).toBeNull();
    expect(translateString("")).toBeNull();
  });

  it("translates sentences with numbers", () => {
    expect(translateString("Showing 6 of 8 posts")).toBe("8件中6件を表示");
    expect(translateString("3 connections")).toBe("3人のつながり");
  });

  it("does not let number-only patterns swallow ordinary words", () => {
    // "{n0} completed" must not turn "Exchange completed" into nonsense
    expect(translateString("Exchange completed")).not.toBe("Exchange件完了");
  });

  it("translates names inside notification sentences", () => {
    expect(translateString("Ken Tanaka sent you a service request.")).toBe("Ken Tanakaさんから依頼が届きました。");
  });

  it("translates dates, times and availability slots", () => {
    expect(translateString("24 Nov 2026")).toBe("2026年11月24日");
    expect(translateString("24 Nov, 13:04")).toBe("11月24日 13:04");
    expect(translateString("2h")).toBe("2時間");
    expect(translateString("Sat 5 Dec 2026, 14:00–16:30")).toBe("2026年12月5日(土) 14:00〜16:30");
    expect(translateString("Weekends; Mon 7 Dec 2026, from 09:00")).toBe("週末、2026年12月7日(月) 09:00から");
  });

  it("translates captured words inside patterns", () => {
    expect(translateString("Cooking (3)")).toBe("料理（3）");
    expect(translateString("Available: Weekends")).toBe("対応可能：週末");
  });

  it("has a Japanese value for every dictionary key", () => {
    for (const [en, ja] of Object.entries(JA_DICT)) {
      expect(ja, en).toBeTruthy();
      expect(ja, en).not.toBe(en);
    }
  });

  it("uses every placeholder of each pattern in its translation", () => {
    for (const [en, ja] of JA_PATTERNS) {
      const used = Array.from(en.matchAll(/\{n?(\d)\}/g), (m) => m[1]);
      for (const i of used) {
        // {2} in "Showing {n0} of {n1} {2}" is intentionally dropped (the noun)
        if (en.startsWith("Showing") || en.startsWith("You've seen all") || en.includes("accepted your request{1}")) continue;
        expect(ja, en).toContain(`{${i}}`);
      }
    }
  });
});

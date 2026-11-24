import { describe, expect, it } from "vitest";
import { answerLanguage, matchFaq } from "@/lib/assistant/faqMatcher";
import { FAQS } from "@/lib/assistant/faq";

describe("FAQ matcher (offline answers)", () => {
  it("answers common English questions instantly", () => {
    expect(matchFaq("How do I create a post?", "en")?.faq.id).toBeTruthy();
    expect(matchFaq("how do i change my password", "en")).not.toBeNull();
  });
  it("answers Japanese questions", () => expect(matchFaq("パスワードを変更するには？", "ja")).not.toBeNull());
  it("does not guess on unrelated text", () => expect(matchFaq("What is the capital of Peru in 1850?", "en")).toBeNull());
  it("picks the answer language from the question's script", () => {
    expect(answerLanguage("投稿の方法", "en")).toBe("ja");
    expect(answerLanguage("how to post", "ja")).toBe("en");
    expect(answerLanguage("?", "ja")).toBe("ja");
  });
  it("every FAQ question finds its own answer, in both languages", () => {
    for (const f of FAQS) {
      expect(matchFaq(f.question.en, "en")?.faq.id, f.question.en).toBe(f.id);
      expect(matchFaq(f.question.ja, "ja")?.faq.id, f.question.ja).toBe(f.id);
    }
  });
  it("understands natural Japanese wording", () => {
    expect(matchFaq("パスワードを変更するには？", "ja")?.faq.id).toBe("change-password");
    expect(matchFaq("ログアウトしたい", "ja")?.faq.id).toBe("logout");
  });
  it("every FAQ has both languages", () => {
    for (const f of FAQS) {
      expect(f.question.en && f.question.ja, f.id).toBeTruthy();
      expect(f.answer.en && f.answer.ja, f.id).toBeTruthy();
    }
  });
});

describe("FAQ vs AI routing", () => {
  it("still sends personal requests to the AI", () => {
    expect(matchFaq("スマホを教えてくれる人を探しています", "ja")).toBeNull();
    expect(matchFaq("find someone to help with my smartphone", "en")).toBeNull();
  });
});

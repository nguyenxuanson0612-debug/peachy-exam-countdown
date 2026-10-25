import { describe, expect, it } from "vitest";
import { documentFlashCards, taskProgress } from "@/lib/study-tools";

describe("Study tools", () => {
  it("creates flashcards from each category's original document content", () => {
    for (const category of ["luat", "chuyen-mon", "tinh-huong", "tips"]) {
      const cards = documentFlashCards([{ id: category, category, title: "Tài liệu", html: '<h2 data-toc="1">Chương I</h2><p>Nội dung gốc</p>', created_at: "" }]);
      expect(cards).toEqual([{ id: `${category}-0`, question: "Chương I", answer: "Nội dung gốc", source: "Tài liệu" }]);
    }
  });
  it("tracks completed personal study goals", () => {
    expect(taskProgress([{ id: "1", title: "Luật", category: "luat", date: "", done: true }, { id: "2", title: "Chuyên môn", category: "chuyen-mon", date: "", done: false }])).toBe(50);
    expect(taskProgress([])).toBe(0);
  });
});
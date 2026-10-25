import type { Doc } from "@/lib/docs";

export type FlashCard = { id: string; question: string; answer: string; source: string };
export type StudyTask = { id: string; title: string; category: string; date: string; done: boolean };

/** Uses the user's own headings and paragraphs, without inventing exam answers. */
export function documentFlashCards(docs: Doc[]): FlashCard[] {
  const cards: FlashCard[] = [];
  for (const doc of docs) {
    const parsed = new DOMParser().parseFromString(doc.html, "text/html");
    let heading = doc.title;
    let paragraphs: string[] = [];
    let index = 0;
    const flush = () => {
      const answer = paragraphs.join("\n\n").trim();
      if (answer) cards.push({ id: `${doc.id}-${index++}`, question: heading, answer, source: doc.title });
      paragraphs = [];
    };
    parsed.querySelectorAll("h1,h2,h3,p,li").forEach((el) => {
      const text = el.textContent?.trim();
      if (!text) return;
      if (el.hasAttribute("data-toc") || /^H[123]$/.test(el.tagName)) { flush(); heading = text; }
      else { paragraphs.push(text); if (paragraphs.join(" ").length > 700) flush(); }
    });
    flush();
  }
  return cards;
}

export function taskProgress(tasks: StudyTask[]) {
  return tasks.length ? Math.round(tasks.filter((task) => task.done).length / tasks.length * 100) : 0;
}
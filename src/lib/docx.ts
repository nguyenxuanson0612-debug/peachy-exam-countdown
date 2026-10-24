export const CATEGORIES = {
  luat: { label: "Luật", desc: "Luật Giáo dục, Luật Viên chức, Thông tư, Nghị định" },
  "chuyen-mon": { label: "Chuyên môn & Bài giảng", desc: "Nội dung chuyên môn, kế hoạch bài giảng" },
  "tinh-huong": { label: "Tình huống sư phạm", desc: "Các tình huống và cách xử lý" },
  tips: { label: "Tip ôn thi", desc: "Mẹo và lưu ý khi đi thi" },
} as const;
export type CategoryKey = keyof typeof CATEGORIES;

const RULES: { re: RegExp; level: 1 | 2 }[] = [
  { re: /^(chương|phần)\s+[ivxlcdm\d]+/i, level: 1 },
  { re: /^tình\s*huống\s*(số\s*)?\d*/i, level: 1 },
  { re: /^(bài|chủ đề)\s+\d+/i, level: 1 },
  { re: /^điều\s+\d+/i, level: 2 },
  { re: /^(mục|tip|lưu ý)\s+\d+/i, level: 2 },
];

/** Convert a .docx file to HTML and tag Chapter/Article/Situation anchors (never cuts text). */
export async function docxToHtml(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.convertToHtml({ arrayBuffer: buf });
  return tagAnchors(value);
}

export function tagAnchors(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild!;
  let n = 0;
  root.querySelectorAll("h1,h2,h3,p").forEach((el) => {
    const text = (el.textContent ?? "").trim();
    if (!text || text.length > 220) return;
    let level: 1 | 2 | 0 = 0;
    if (el.tagName === "H1" || el.tagName === "H2") level = 1;
    else if (el.tagName === "H3") level = 2;
    for (const r of RULES) if (r.re.test(text)) { level = r.level; break; }
    if (level) {
      el.setAttribute("data-toc", String(level));
      el.id = `a-${Date.now().toString(36)}-${n++}`;
    }
  });
  return root.innerHTML;
}

export type TocItem = { id: string; text: string; level: number };

export function extractToc(html: string): TocItem[] {
  if (typeof DOMParser === "undefined") return [];
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  return Array.from(doc.querySelectorAll("[data-toc]")).map((el) => ({
    id: el.id,
    text: (el.textContent ?? "").trim().slice(0, 120),
    level: Number(el.getAttribute("data-toc")),
  }));
}

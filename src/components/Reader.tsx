import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eraser, FileUp, Highlighter, ListTree, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { docxToHtml, extractToc, type TocItem } from "@/lib/docx";
import type { Doc } from "@/lib/docs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function UploadButton({ category, label = "Tải file Word" }: { category: string; label?: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        if (!f.name.toLowerCase().endsWith(".docx")) { toast.error(`${f.name}: chỉ hỗ trợ file .docx`); continue; }
        const html = await docxToHtml(f);
        const { error } = await supabase.from("documents").insert({ category, title: f.name.replace(/\.docx$/i, ""), html });
        if (error) throw error;
      }
      toast.success("Đã tải tài liệu lên");
      qc.invalidateQueries({ queryKey: ["documents"] });
    } catch (e) {
      toast.error("Không đọc được file: " + (e as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <>
      <input ref={ref} type="file" accept=".docx" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      <Button onClick={() => ref.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <FileUp />} {label}
      </Button>
    </>
  );
}

function Toc({ docs, tocs, onGo }: { docs: Doc[]; tocs: Record<string, TocItem[]>; onGo: (id: string) => void }) {
  return (
    <div className="space-y-4 text-sm">
      {docs.map((d) => (
        <div key={d.id}>
          <button onClick={() => onGo(`doc-${d.id}`)} className="text-left font-bold text-primary hover:underline">{d.title}</button>
          <ul className="mt-1 space-y-0.5">
            {tocs[d.id]?.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => onGo(t.id)}
                  className={`block w-full truncate rounded px-2 py-1 text-left hover:bg-accent ${t.level === 1 ? "font-semibold" : "pl-5 text-muted-foreground"}`}
                  title={t.text}
                >{t.text}</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function Reader({ docs, category, target }: { docs: Doc[]; category: string; target?: string }) {
  const qc = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [sel, setSel] = useState<{ x: number; y: number } | null>(null);
  const tocs = useMemo(() => Object.fromEntries(docs.map((d) => [d.id, extractToc(d.html)])), [docs]);

  const go = (id: string) => {
    setTocOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  };

  // Jump to search target "docId:blockIndex"
  useEffect(() => {
    if (!target) return;
    const [docId, idx] = target.split(":");
    const t = setTimeout(() => {
      const root = document.getElementById(`body-${docId}`);
      const el = root?.querySelectorAll("p,h1,h2,h3,li")[Number(idx)] as HTMLElement | undefined;
      if (el) {
        el.style.scrollMarginTop = "9rem";
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
      }
    }, 150);
    return () => clearTimeout(t);
  }, [target, docs]);

  const persist = async (docId: string) => {
    const el = document.getElementById(`body-${docId}`);
    if (!el) return;
    const html = el.innerHTML;
    const { error } = await supabase.from("documents").update({ html }).eq("id", docId);
    if (error) toast.error("Không lưu được đánh dấu");
    qc.setQueryData<Doc[]>(["documents"], (old) => old?.map((d) => (d.id === docId ? { ...d, html } : d)));
  };

  const onMouseUp = () => {
    const s = window.getSelection();
    if (!s || s.isCollapsed || !containerRef.current?.contains(s.anchorNode)) { setSel(null); return; }
    const r = s.getRangeAt(0).getBoundingClientRect();
    setSel({ x: r.left + r.width / 2, y: r.top });
  };

  const highlight = () => {
    const s = window.getSelection();
    if (!s || s.isCollapsed) return;
    const range = s.getRangeAt(0);
    const body = (range.commonAncestorContainer instanceof Element ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement)?.closest("[data-body]");
    if (!body) return;
    // Wrap each text node segment inside the range
    const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) nodes.push(range.commonAncestorContainer as Text);
    while (walker.nextNode()) if (range.intersectsNode(walker.currentNode)) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      let start = 0, end = node.length;
      if (node === range.startContainer) start = range.startOffset;
      if (node === range.endContainer) end = range.endOffset;
      if (start >= end || !node.data.slice(start, end).trim()) continue;
      const target = node.splitText(start);
      target.splitText(end - start);
      const mark = document.createElement("mark");
      mark.className = "hl";
      target.parentNode!.replaceChild(mark, target);
      mark.appendChild(target);
    }
    s.removeAllRanges(); setSel(null);
    persist(body.getAttribute("data-body")!);
  };

  const onClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "MARK" && t.classList.contains("hl")) {
      const body = t.closest("[data-body]");
      t.replaceWith(...Array.from(t.childNodes));
      if (body) persist(body.getAttribute("data-body")!);
      toast("Đã xóa dạ quang ở đoạn này");
    }
  };

  const clearAll = () => {
    docs.forEach((d) => {
      const body = document.getElementById(`body-${d.id}`);
      if (!body || !body.querySelector("mark.hl")) return;
      body.querySelectorAll("mark.hl").forEach((m) => m.replaceWith(...Array.from(m.childNodes)));
      persist(d.id);
    });
    toast.success("Đã xóa toàn bộ phần đánh dấu");
  };

  const remove = async (d: Doc) => {
    if (!confirm(`Xóa tài liệu "${d.title}"?`)) return;
    await supabase.from("documents").delete().eq("id", d.id);
    qc.invalidateQueries({ queryKey: ["documents"] });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-36 hidden max-h-[calc(100vh-10rem)] overflow-auto rounded-2xl bg-card p-4 shadow-soft lg:block">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><ListTree className="h-4 w-4" /> Mục lục</p>
        {docs.length ? <Toc docs={docs} tocs={tocs} onGo={go} /> : <p className="text-sm text-muted-foreground">Chưa có tài liệu</p>}
      </aside>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <UploadButton category={category} />
          <Sheet open={tocOpen} onOpenChange={setTocOpen}>
            <SheetTrigger asChild><Button variant="outline" className="lg:hidden"><ListTree /> Mục lục</Button></SheetTrigger>
            <SheetContent side="left" className="overflow-auto pt-10"><Toc docs={docs} tocs={tocs} onGo={go} /></SheetContent>
          </Sheet>
          <Button variant="outline" onClick={clearAll}><Eraser /> Xóa đánh dấu</Button>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Highlighter className="h-3.5 w-3.5" /> Bôi đen chữ để tô dạ quang · bấm vào chữ đã tô để bỏ</span>
        </div>

        <div ref={containerRef} onMouseUp={onMouseUp} onTouchEnd={onMouseUp} onClick={onClick} className="rounded-2xl bg-card p-5 shadow-soft md:p-10">
          {docs.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <FileUp className="mx-auto h-12 w-12 text-primary" />
              <p className="mt-3">Chưa có tài liệu. Tải file Word (.docx) lên để bắt đầu.</p>
            </div>
          )}
          {docs.map((d) => (
            <article key={d.id} id={`doc-${d.id}`} className="scroll-mt-36 border-b pb-8 last:border-0">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="font-display text-2xl font-bold md:text-3xl">{d.title}</h2>
                <button onClick={() => remove(d)} aria-label="Xóa tài liệu" className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div id={`body-${d.id}`} data-body={d.id} className="doc-reader" dangerouslySetInnerHTML={{ __html: d.html }} />
            </article>
          ))}
        </div>
      </div>

      {sel && (
        <button
          onMouseDown={(e) => { e.preventDefault(); highlight(); }}
          style={{ left: sel.x, top: sel.y - 44 }}
          className="fixed z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background shadow-soft"
        >
          <Highlighter className="h-3.5 w-3.5 text-highlight" /> Tô dạ quang
        </button>
      )}
    </div>
  );
}

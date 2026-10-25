import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, RotateCw, Layers } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { documentFlashCards } from "@/lib/study-tools";
import { useStudyStorage } from "@/hooks/use-study-storage";
import type { Doc } from "@/lib/docs";

export function FlashCardMode({ docs, category }: { docs: Doc[]; category: string }) {
  const cards = useMemo(() => documentFlashCards(docs), [docs]);
  const { value: known, update, ready } = useStudyStorage<string[]>(`flashcards:${category}`, []);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [review, setReview] = useState(false);
  const reduced = useReducedMotion();
  const deck = review ? cards.filter((card) => !known.includes(card.id)) : cards;
  const card = deck[Math.min(index, Math.max(0, deck.length - 1))];
  const move = (delta: number) => { setIndex((Math.min(index, deck.length - 1) + delta + deck.length) % deck.length); setFlipped(false); };
  return <section className="mx-auto max-w-3xl py-3">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 font-semibold"><Layers className="size-5 text-primary" /> {cards.filter((item) => known.includes(item.id)).length}/{cards.length} thẻ đã nhớ</p>
      <div className="flex gap-2"><Button variant={review ? "default" : "outline"} onClick={() => { setReview(!review); setIndex(0); setFlipped(false); }}>Ôn thẻ chưa nhớ</Button><Button variant="ghost" size="icon" aria-label="Đặt lại tiến độ" disabled={!ready} onClick={() => { update([]); setIndex(0); setFlipped(false); }}><RotateCcw /></Button></div>
    </div>
    {card ? <>
      <motion.div key={`${card.id}-${flipped}`} initial={reduced ? false : { opacity: .4, rotateY: -12 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ duration: .25 }} className="flashcard-surface reading-surface flex min-h-80 flex-col rounded-lg p-6 md:p-10">
        <p className="text-xs font-semibold uppercase text-primary">{flipped ? "Nội dung ghi nhớ" : "Chủ đề"} · {Math.min(index + 1, deck.length)}/{deck.length}</p>
        <div className="my-7 max-h-80 overflow-y-auto whitespace-pre-line text-lg font-semibold leading-relaxed">{flipped ? card.answer : card.question}</div>
        <p className="mt-auto text-xs text-muted-foreground">{card.source}</p>
      </motion.div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" size="icon" aria-label="Thẻ trước" onClick={() => move(-1)}><ArrowLeft /></Button>
        <Button variant="secondary" onClick={() => setFlipped(!flipped)}><RotateCw />{flipped ? "Xem chủ đề" : "Lật thẻ"}</Button>
        <Button disabled={!ready || known.includes(card.id)} onClick={() => { update([...known, card.id]); if (review) { setIndex(0); setFlipped(false); } }}><Check />{known.includes(card.id) ? "Đã nhớ" : "Đánh dấu đã nhớ"}</Button>
        <Button variant="outline" size="icon" aria-label="Thẻ tiếp theo" onClick={() => move(1)}><ArrowRight /></Button>
      </div>
    </> : <div className="py-16 text-center"><Layers className="mx-auto mb-4 size-10 text-primary" /><h2 className="text-xl font-bold">{cards.length ? "Bạn đã nhớ tất cả thẻ!" : "Chưa có thẻ ghi nhớ"}</h2><p className="mt-2 text-muted-foreground">{cards.length ? "Chọn lại toàn bộ thẻ để tiếp tục ôn tập." : "Tải tài liệu Word trong mục Đọc tài liệu để tạo bộ thẻ của bạn."}</p></div>}
  </section>;
}
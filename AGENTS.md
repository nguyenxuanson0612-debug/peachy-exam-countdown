<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Uploaded .docx files are converted to HTML in the browser (mammoth) and stored whole in `documents.html`; Chapter/Article/Situation anchors are tagged with `data-toc` so text is never split. Why: keeps reading continuous while TOC/search jump to anchors.
- Highlights are `<mark class="hl">` saved back into the document HTML. Why: no separate offsets table to drift.
- AI calls go through `src/lib/ai/llm.server.ts` (server-only); bearer-authenticated `/api/chat` returns AI SDK UI-message SSE consumed by `src/lib/chat-stream.ts`. Why: keep keys server-side and display partial responses without buffering or custom SSE parsing.

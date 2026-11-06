import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconFileUpload, IconPlus, IconSparkles } from "@tabler/icons-react";
import { motion } from "motion/react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { CourtDialog, fieldClass, ghostButton, primaryButton } from "./Dialog";
import type { Exhibit } from "./types";

export function ExhibitCard({
  exhibit,
  citedBy,
  onOpen,
  onToggleStrike,
  disabled,
  tilt = 0,
}: {
  tilt?: number;
  exhibit: Exhibit;
  citedBy: "defense" | "prosecution" | null;
  onOpen: () => void;
  onToggleStrike: () => void;
  disabled: boolean;
}) {
  const struck = exhibit.status !== "admitted";
  const total = exhibit.citedBy.defense + exhibit.citedBy.prosecution;
  const cite = (
    citedBy === "defense"
      ? { "--cite-color": "226 86% 48%" }
      : citedBy === "prosecution"
        ? { "--cite-color": "8 82% 48%" }
        : {}
  ) as Record<string, string>;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, rotate: tilt * 2 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={{ rotate: 0, y: -3 }}
      style={cite}
      className={cn(
        "exhibit-paper tape group relative flex min-h-[168px] flex-col gap-2 rounded-xl border-[1.5px] !border-brass p-4 pt-5",
        citedBy && "exhibit-cited",
        struck && "opacity-70 saturate-50",
      )}
    >
      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
        <span className="font-semibold tracking-[0.12em]">EXHIBIT {exhibit.letter}</span>
        {citedBy ? (
          <span className="font-semibold uppercase tracking-wide text-paper-ink">
            Being used by {citedBy}
          </span>
        ) : exhibit.addedVia === "sample" ? (
          <span className="text-paper-muted">demo evidence</span>
        ) : exhibit.addedBy !== "judge" || exhibit.addedVia !== "ui" ? (
          <span className="text-paper-muted">
            {exhibit.addedBy} via {exhibit.addedVia}
          </span>
        ) : (
          <span className="text-paper-muted">added by you</span>
        )}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-ink/40 rounded-md"
      >
        <h3
          className={cn(
            "font-serif text-[23px] leading-tight",
            struck && "line-through decoration-failed-ink decoration-2",
          )}
        >
          {exhibit.title}
        </h3>
        <p className="mt-1 line-clamp-3 text-[13.5px] leading-snug text-paper-muted">
          {exhibit.content}
        </p>
      </button>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-[12px] text-paper-muted tabular-nums">
          {struck
            ? "Struck by the judge"
            : total === 0
              ? "Not used yet"
              : `Used ${total}×: Defense ${exhibit.citedBy.defense}, Prosecution ${exhibit.citedBy.prosecution}`}
        </span>
        <button
          type="button"
          onClick={onToggleStrike}
          disabled={disabled}
          className="min-h-8 rounded-md border border-paper-ink/25 px-2.5 text-[12px] font-medium text-paper-ink transition-colors hover:bg-paper-ink hover:text-paper disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-ink/40"
        >
          {struck ? "Put back" : "Remove"}
        </button>
      </div>
      {struck && (
        <span className="stamp-struck pointer-events-none absolute right-5 top-12 rounded px-2 py-0.5 font-mono text-[11px] font-semibold uppercase">
          Struck
        </span>
      )}
    </motion.article>
  );
}

/** Full exhibit text, with the quotes counsel took from it highlighted. */
export function ExhibitDialog({
  exhibit,
  quotes,
  focusQuote,
  onOpenChange,
}: {
  exhibit: Exhibit | null;
  quotes: { quote: string; side: "defense" | "prosecution"; verified: boolean }[];
  focusQuote: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const parts = useMemo(() => {
    if (!exhibit) return [];
    const verified = quotes.filter((q) => q.verified);
    const text = exhibit.content;
    const marks: { start: number; end: number; side: string }[] = [];
    const lower = text.toLowerCase();
    for (const q of verified) {
      const idx = lower.indexOf(q.quote.toLowerCase().replace(/[.]+$/, ""));
      if (idx >= 0) marks.push({ start: idx, end: idx + q.quote.replace(/[.]+$/, "").length, side: q.side });
    }
    marks.sort((a, b) => a.start - b.start);
    const out: { text: string; side: string | null }[] = [];
    let cursor = 0;
    for (const m of marks) {
      if (m.start < cursor) continue;
      out.push({ text: text.slice(cursor, m.start), side: null });
      out.push({ text: text.slice(m.start, m.end), side: m.side });
      cursor = m.end;
    }
    out.push({ text: text.slice(cursor), side: null });
    return out;
  }, [exhibit, quotes]);

  const missing = focusQuote && quotes.find((q) => q.quote === focusQuote && !q.verified);

  return (
    <CourtDialog
      open={exhibit !== null}
      onOpenChange={onOpenChange}
      tone="paper"
      title={exhibit ? `Evidence ${exhibit.letter}: ${exhibit.title}` : ""}
      description={exhibit?.source ? `Source: ${exhibit.source}` : "Entered by the judge"}
    >
      {missing && (
        <p className="rounded-lg border border-failed-ink/40 bg-paper-dim px-3 py-2 text-sm text-paper-ink">
          The quote <span className="font-serif italic">"{missing.quote}"</span> is not in this evidence, so the court rejected it.
        </p>
      )}
      <p className="whitespace-pre-wrap font-serif text-[19px] leading-relaxed">
        {parts.map((p, i) =>
          p.side ? (
            <mark
              key={i}
              className={cn(
                "rounded px-0.5 text-paper-ink",
                p.side === "defense" ? "bg-defense/45" : "bg-prosecution/45",
              )}
            >
              {p.text}
            </mark>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </p>
      <div className="flex flex-wrap gap-4 text-xs text-paper-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-5 rounded-sm bg-defense/45" /> Quoted by Defense
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-5 rounded-sm bg-prosecution/45" /> Quoted by Prosecution
        </span>
      </div>
    </CourtDialog>
  );
}

export function AddExhibitDialog({
  caseId,
  open,
  onOpenChange,
  suggestion,
}: {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion?: { title: string; content: string; source: string } | null;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const add = useActionMutation("add-exhibit", {
    onError: (e) => toast.error(e.message.replace(/^Action [\w-]+ failed: /, "")),
  });

  function reset() {
    setTitle("");
    setContent("");
    setSource("");
  }

  async function readFile(file: File) {
    if (file.size > 200_000) {
      toast.error("That file is too large. Paste the part that matters instead.");
      return;
    }
    const text = await file.text();
    setContent(text.slice(0, 20000));
    setSource(file.name);
    if (!title) setTitle(file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    add.mutate(
      { caseId, title: title.trim(), content: content.trim(), source: source.trim() },
      {
        onSuccess: (r) => {
          toast.success(`Evidence ${r.letter} added. Both lawyers can use it.`);
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <CourtDialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
      title="Add evidence"
      description="The lawyers can only quote what you add here. Paste text or load a text file."
    >
      {suggestion && !content && (
        <button
          type="button"
          onClick={() => {
            setTitle(suggestion.title);
            setContent(suggestion.content);
            setSource(suggestion.source);
          }}
          className="flex items-start gap-3 rounded-xl border border-brass/40 bg-brass-deep p-3.5 text-left transition-colors hover:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
        >
          <IconSparkles className="mt-0.5 size-5 shrink-0 text-brass" aria-hidden="true" />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-brass-strong">Use the surprise twist</span>
            <span className="text-[13px] text-foreground/75">"{suggestion.content}"</span>
          </span>
        </button>
      )}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ex-title" className="text-sm font-medium">
            Title
          </label>
          <input
            id="ex-title"
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Q3 incident log"
            required
            maxLength={140}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="ex-content" className="text-sm font-medium">
              Evidence text
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-brass hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              <IconFileUpload className="size-4" aria-hidden="true" /> Load a file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.csv,.json,.log,.yaml,.yml,.ts,.js,.sql,text/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readFile(f);
                e.target.value = "";
              }}
            />
          </div>
          <textarea
            id="ex-content"
            className={cn(fieldClass, "min-h-40 resize-y font-mono text-[13px] leading-relaxed")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste the document, numbers or notes counsel may quote."
            required
            maxLength={20000}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ex-source" className="text-sm font-medium">
            Source <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="ex-source"
            className={fieldClass}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="incident-log.md or a link"
            maxLength={400}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={ghostButton} onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button type="submit" className={primaryButton} disabled={add.isPending || !title || !content}>
            <IconPlus className="size-4" aria-hidden="true" />
            {add.isPending ? "Adding…" : "Add this evidence"}
          </button>
        </div>
      </form>
    </CourtDialog>
  );
}

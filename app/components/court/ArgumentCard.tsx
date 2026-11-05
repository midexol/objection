import { IconChevronDown, IconMessageQuestion } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { BASIS_LABEL, STAGES } from "@shared/court";

import { CitationChip, Eyebrow } from "./primitives";
import type { Argument, Question } from "./types";

const STAGE_LABEL: Record<(typeof STAGES)[number], string> = {
  opening: "Opening",
  rebuttal: "Reply",
  closing: "Closing",
};

/** Reveal text word by word, for the statement counsel has just made. */
function useTypewriter(text: string, active: boolean) {
  const [count, setCount] = useState(active ? 0 : Number.POSITIVE_INFINITY);
  const words = text.split(/(\s+)/);
  useEffect(() => {
    if (!active) {
      setCount(Number.POSITIVE_INFINITY);
      return;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setCount(Number.POSITIVE_INFINITY);
      return;
    }
    setCount(0);
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= words.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 2;
      });
    }, 45);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active]);
  return {
    shown: count >= words.length ? text : words.slice(0, count).join(""),
    done: count >= words.length,
  };
}

export function ArgumentCard({
  argument,
  fresh,
  question,
  speaking,
  onOpenExhibit,
  onTyped,
}: {
  argument: Argument;
  fresh: boolean;
  question: Question | undefined;
  speaking: boolean;
  onOpenExhibit: (letter: string, quote?: string) => void;
  onTyped?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { shown, done } = useTypewriter(argument.body, fresh);
  const struck = argument.status === "struck";
  const accent = argument.side === "defense" ? "border-defense" : "border-prosecution";

  useEffect(() => {
    if (done && fresh) onTyped?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, fresh]);

  return (
    <motion.article
      layout
      initial={fresh ? { opacity: 0, y: 14, filter: "blur(4px)" } : false}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border-[1.5px] bg-bench p-4 pl-5 shadow-[0_1px_0_hsl(24_18%_8%/0.08)]",
        "before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full",
        argument.side === "defense" ? "before:bg-defense" : "before:bg-prosecution",
        speaking ? accent : "border-brass/20",
        speaking && (argument.side === "defense" ? "shadow-[4px_4px_0_hsl(226_86%_48%)]" : "shadow-[4px_4px_0_hsl(8_82%_48%)]"),
        struck && "opacity-60",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <Eyebrow className={cn(speaking && "text-foreground")}>
          {speaking ? "Speaking now" : STAGE_LABEL[argument.stage]}
          {argument.authorVia !== "engine" && argument.authorVia !== "rehearsal" && (
            <span className="ml-2 text-brass">via {argument.authorVia}</span>
          )}
        </Eyebrow>
        {struck ? (
          <span className="stamp-struck rounded px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase">
            Struck from the record
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">{BASIS_LABEL[argument.basis]}</span>
        )}
      </header>

      {question && (
        <p className="flex items-start gap-2 rounded-lg bg-brass-deep px-3 py-2 text-[13px] text-brass-strong">
          <IconMessageQuestion className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          <span>Answering the judge: {question.question}</span>
        </p>
      )}

      <h3
        className={cn(
          "font-didone text-[22px] font-normal leading-[1.12] tracking-[-0.005em]",
          struck && "line-through decoration-failed decoration-2",
        )}
      >
        {argument.claim}
      </h3>
      <p className={cn("text-[15px] leading-relaxed text-foreground/85", struck && "line-through decoration-failed/70")}>
        {shown}
      </p>

      {done && (
        <motion.div
          initial={fresh ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-1.5"
        >
          {argument.citations.map((c, i) => (
            <CitationChip
              key={`${c.exhibit}-${i}`}
              exhibit={c.exhibit}
              verified={c.verified}
              onClick={() => onOpenExhibit(c.exhibit, c.quote)}
            />
          ))}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="ml-auto inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          >
            Show reasoning
            <IconChevronDown
              className={cn("size-3.5 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </motion.div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-line pt-3 text-[13px]">
              <div className="flex flex-col gap-1">
                <Eyebrow>Why</Eyebrow>
                <p className="text-foreground/80">{argument.reasoning || "No reasoning given."}</p>
              </div>
              {argument.citations.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Eyebrow>Quotes from the evidence</Eyebrow>
                  <ul className="flex flex-col gap-1.5">
                    {argument.citations.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span
                          className={cn(
                            "shrink-0 font-mono text-[11px]",
                            c.verified ? "text-verified" : "text-failed",
                          )}
                        >
                          {c.verified ? "found in" : "not in"} {c.exhibit}
                        </span>
                        <span className="font-serif text-[15px] italic leading-snug text-foreground/90">
                          "{c.quote}"
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.article>
  );
}

export function DraftingCard({ side }: { side: "defense" | "prosecution" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-dashed bg-bench-raised/60 p-4",
        side === "defense" ? "border-defense/40" : "border-prosecution/40",
      )}
      aria-live="polite"
    >
      <span className="court-shimmer font-display text-[17px] font-semibold">
        {side === "defense" ? "Defense" : "Prosecution"} is thinking…
      </span>
      <div className="flex flex-col gap-2">
        <span className="h-2.5 w-11/12 animate-pulse rounded bg-line-strong" />
        <span className="h-2.5 w-4/5 animate-pulse rounded bg-line-strong" />
        <span className="h-2.5 w-2/3 animate-pulse rounded bg-line-strong" />
      </div>
    </motion.div>
  );
}

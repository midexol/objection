import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconGavel } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { GROUNDS_LABEL, SIDE_LABEL, opposing, type Grounds } from "@shared/court";

import { strikeGavel } from "./gavel";
import { CounselSeal, Eyebrow, sideText } from "./primitives";
import type { Argument, Objection } from "./types";

export function ObjectionOverlay({
  objection,
  target,
  sound,
  onRuled,
}: {
  objection: Objection | null;
  target: Argument | undefined;
  sound: boolean;
  onRuled: (ruling: "sustained" | "overruled") => void;
}) {
  const rule = useActionMutation("rule-objection", {
    onError: (e) => toast.error(e.message.replace(/^Action [\w-]+ failed: /, "")),
  });
  const shownFor = useRef<string | null>(null);
  const sustainRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (objection && shownFor.current !== objection.id) {
      shownFor.current = objection.id;
      if (sound) strikeGavel(1);
      window.setTimeout(() => sustainRef.current?.focus(), 650);
    }
  }, [objection, sound]);

  function decide(ruling: "sustained" | "overruled") {
    if (!objection) return;
    rule.mutate(
      { id: objection.id, ruling },
      {
        onSuccess: () => {
          if (sound) strikeGavel(2);
          onRuled(ruling);
        },
      },
    );
  }

  const raiser = objection?.raisedBy ?? "defense";
  const challenged = opposing(raiser);

  return (
    <AnimatePresence>
      {objection && (
        <motion.div
          key={objection.id}
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="objection-title"
        >
          <motion.section
            initial={{ scale: 1.08, y: 10 }}
            animate={{ scale: 1, y: 0, x: [0, -10, 9, -6, 4, 0] }}
            transition={{ duration: 0.5, ease: "easeOut", x: { delay: 0.18, duration: 0.42 } }}
            className="court-grain relative flex w-full max-w-[780px] flex-col gap-6 overflow-hidden rounded-[28px] border-2 border-stamp/50 bg-bench p-7 shadow-[0_40px_120px_-30px_hsl(var(--primary)/0.45)] sm:p-10"
          >
            <div className="brass-edge absolute inset-x-0 top-0 h-px" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-3">
                <CounselSeal side={raiser} size="sm" />
                <Eyebrow className={sideText(raiser)}>
                  {SIDE_LABEL[raiser]} rises
                  {objection.origin === "court" ? ", on the court's citation check" : ""}
                </Eyebrow>
              </span>
              <Eyebrow>Both counsel paused</Eyebrow>
            </div>

            <motion.h2
              id="objection-title"
              initial={{ scale: 2.4, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: -2 }}
              transition={{ type: "spring", stiffness: 520, damping: 18, mass: 0.9 }}
              className="origin-left font-serif text-[clamp(64px,13vw,132px)] italic leading-[0.85] tracking-[-0.02em] text-stamp"
            >
              Objection!
            </motion.h2>

            <div className="flex flex-col gap-2">
              <Eyebrow>Grounds</Eyebrow>
              <p className="font-display text-2xl font-semibold tracking-tight">
                {GROUNDS_LABEL[objection.grounds as Grounds] ?? objection.grounds}
              </p>
              <p className="text-[16px] leading-relaxed text-foreground/80">{objection.explanation}</p>
            </div>

            {target && (
              <blockquote
                className={cn(
                  "flex flex-col gap-1.5 rounded-r-xl border-l-[3px] bg-bench-raised px-5 py-4",
                  challenged === "defense" ? "border-defense" : "border-prosecution",
                )}
              >
                <Eyebrow className={sideText(challenged)}>
                  Challenged statement, {SIDE_LABEL[challenged]}
                </Eyebrow>
                <p className="font-serif text-[19px] italic leading-snug text-foreground/90">
                  "{target.claim}"
                </p>
              </blockquote>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line-strong p-4">
                <p className="font-semibold text-foreground">If you sustain</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The statement is struck. It stops counting toward the weight of argument.
                </p>
              </div>
              <div className="rounded-xl border border-line-strong p-4">
                <p className="font-semibold text-foreground">If you overrule</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The statement stands, and {SIDE_LABEL[raiser]} loses a point for the objection.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                ref={sustainRef}
                type="button"
                disabled={rule.isPending}
                onClick={() => decide("sustained")}
                className="inline-flex min-h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl bg-brass text-[17px] font-semibold text-primary-foreground transition-colors hover:bg-brass-strong disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-strong focus-visible:ring-offset-2 focus-visible:ring-offset-bench"
              >
                <IconGavel className="size-5" aria-hidden="true" /> Sustained
              </button>
              <button
                type="button"
                disabled={rule.isPending}
                onClick={() => decide("overruled")}
                className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-brass/70 text-[17px] font-semibold text-foreground transition-colors hover:bg-brass-deep disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
              >
                Overruled
              </button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Nothing proceeds until you rule. Your ruling is written to the transcript.
            </p>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

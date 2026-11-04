import { IconCheck, IconX } from "@tabler/icons-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** A looping glimpse of the court: a quote fails its check and draws an objection. */
export function HeroVignette() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setPhase((p) => (p + 1) % 4), 1700);
    return () => window.clearInterval(id);
  }, []);
  const failed = phase >= 2;
  return (
    <div aria-hidden="true" className="relative hidden w-[380px] shrink-0 lg:block">
      <motion.div animate={{ rotate: -2.5 }} className="exhibit-paper relative rounded-2xl p-5">
        <div className="flex justify-between font-mono text-[11px] font-semibold tracking-[0.12em]">
          <span>EXHIBIT B</span>
          <span className="text-paper-muted">launch-plan.md</span>
        </div>
        <p className="mt-2 font-serif text-[22px] leading-tight">Launch timeline</p>
        <p className="mt-1 text-[13px] leading-snug text-paper-muted">
          Public launch is 18 November. Code freeze is 11 November. That leaves 21 days from today.
        </p>
      </motion.div>
      <motion.div
        animate={{ y: phase === 0 ? 8 : 0, opacity: phase === 0 ? 0.6 : 1 }}
        className="relative -mt-6 ml-10 rounded-2xl border border-prosecution/40 bg-bench-raised p-4 shadow-2xl"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-prosecution">Prosecution</span>
        <p className="mt-1.5 text-[14px] leading-snug text-foreground/90">"A full migration is a three-week job."</p>
        <span
          className={cn(
            "mt-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] font-medium transition-colors",
            failed
              ? "bg-paper-dim text-paper-ink line-through decoration-failed-ink decoration-2"
              : "bg-paper text-paper-ink",
          )}
        >
          Exhibit B
          {failed ? (
            <IconX className="size-3.5 text-failed-ink" strokeWidth={2.6} />
          ) : (
            <IconCheck className="size-3.5 text-paper-muted" strokeWidth={2.6} />
          )}
        </span>
      </motion.div>
      <motion.span
        initial={false}
        animate={phase === 3 ? { opacity: 1, scale: 1, rotate: -8 } : { opacity: 0, scale: 1.8, rotate: -14 }}
        transition={{ type: "spring", stiffness: 480, damping: 16 }}
        className="absolute -bottom-14 -left-8 font-serif text-[64px] italic leading-none text-brass drop-shadow-[0_6px_30px_hsl(var(--primary)/0.5)]"
      >
        Objection!
      </motion.span>
    </div>
  );
}

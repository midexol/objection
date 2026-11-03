import { useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconCheck,
  IconGavel,
  IconPlayerPlay,
  IconPlus,
  IconQuote,
  IconX,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { ghostButton, primaryButton } from "@/components/court/Dialog";
import { Eyebrow, StatusChip, Wordmark } from "@/components/court/primitives";
import { cn } from "@/lib/utils";
import { CASE_TYPE_META, CASE_TYPES, DECISION_LABEL, type Decision } from "@shared/court";

export function meta() {
  return [
    { title: "Objection! Put any decision on trial" },
    {
      name: "description",
      content:
        "Two AI counsel argue your decision from your evidence. Every quote is checked in code. You hold the gavel.",
    },
  ];
}

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1713620689462-e201360c743e?auto=format&fit=crop&w=2200&q=70";

export default function DocketRoute() {
  const navigate = useNavigate();
  const { data, isLoading } = useActionQuery("list-cases");
  const sample = useActionMutation("open-sample-case", {
    onSuccess: (r) => navigate(r.path),
    onError: (e) => toast.error(e.message.replace(/^Action [\w-]+ failed: /, "")),
  });
  const cases = data?.cases ?? [];

  return (
    <div className="court-spotlight court-grain min-h-full">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-16 px-4 pb-20 pt-6 sm:px-6 lg:px-10">
        <nav className="flex items-center justify-between gap-4">
          <Wordmark className="text-[28px]" />
          <div className="flex items-center gap-2">
            <Link to="/court/new" className={ghostButton}>
              <IconPlus className="size-4" aria-hidden="true" /> File a case
            </Link>
          </div>
        </nav>

        <section className="relative isolate overflow-hidden rounded-[32px] border border-line">
          <img
            src={HERO_IMAGE}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,hsl(var(--background))_18%,hsl(var(--background)/0.86)_46%,hsl(var(--background)/0.25)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,hsl(var(--background))_0%,transparent_45%)]" />

          <div className="flex flex-wrap items-end gap-10 px-6 pb-10 pt-16 sm:px-12 sm:pb-14 sm:pt-24 lg:pt-28">
            <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-7">
              <Eyebrow className="text-brass">A decision court for teams</Eyebrow>
              <h1 className="font-display text-[clamp(52px,8.4vw,124px)] font-extrabold leading-[0.88] tracking-[-0.045em]">
                Put the decision
                <br />
                <span className="font-serif font-normal italic tracking-[-0.02em] text-brass">on trial.</span>
              </h1>
              <p className="max-w-[560px] text-[19px] leading-relaxed text-foreground/80">
                Two AI counsel argue your decision from your own evidence, one for and one against. Every quote they use is checked in code. You hold the gavel.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/court/new" className={cn(primaryButton, "min-h-13 px-6 text-base")}>
                  File a case <IconArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => sample.mutate({})}
                  disabled={sample.isPending}
                  className={cn(ghostButton, "min-h-13 px-5 text-base backdrop-blur")}
                >
                  <IconPlayerPlay className="size-4" aria-hidden="true" />
                  {sample.isPending ? "Opening the court…" : "Watch a sample trial"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                The sample trial runs without any API key.
              </p>
            </div>
            <HeroVignette />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="How the court works">
          {[
            {
              icon: IconQuote,
              title: "Nothing counts unless it is on the record",
              body: "Counsel argue only from the exhibits you enter. Every citation is matched against the exhibit text by code, not by a model.",
            },
            {
              icon: IconGavel,
              title: "A bad quote draws an objection",
              body: "When a quote is not in the record, opposing counsel objects and the court pauses. You sustain or overrule.",
            },
            {
              icon: IconArrowUpRight,
              title: "You rule, and the record keeps",
              body: "Your verdict becomes a decision record: the strongest case for and against, the dissent, and when to revisit.",
            },
          ].map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="flex flex-col gap-4 rounded-[24px] border border-line bg-bench/80 p-6"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brass-deep text-brass">
                <f.icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight">{f.title}</h2>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.article>
          ))}
        </section>

        <section className="flex flex-col gap-6" aria-labelledby="start-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-2">
              <Eyebrow>Start a case</Eyebrow>
              <h2 id="start-heading" className="font-display text-4xl font-semibold tracking-tight">
                What are you deciding?
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CASE_TYPES.map((t) => (
              <Link
                key={t}
                to={`/court/new?type=${t}`}
                className="group flex min-h-[176px] flex-col gap-3 rounded-[20px] border border-line bg-bench/70 p-5 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brass/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
              >
                <span className="font-display text-lg font-semibold tracking-tight">{CASE_TYPE_META[t].label}</span>
                <span className="text-sm text-muted-foreground">{CASE_TYPE_META[t].prompt}</span>
                <span className="mt-auto font-serif text-[17px] italic leading-snug text-foreground/75 transition-colors group-hover:text-brass-strong">
                  "{CASE_TYPE_META[t].example}"
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5" aria-labelledby="docket-heading">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-2">
              <Eyebrow>Your docket</Eyebrow>
              <h2 id="docket-heading" className="font-display text-4xl font-semibold tracking-tight">
                Cases
              </h2>
            </div>
            {data && !data.counsel.live && (
              <span className="max-w-[340px] text-right text-xs text-muted-foreground">
                Live counsel is off until a free Groq, Gemini or OpenRouter key is set on the server.
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1].map((i) => (
                <span key={i} className="h-20 animate-pulse rounded-2xl bg-bench" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-[24px] border border-dashed border-line-strong p-8">
              <p className="font-display text-2xl font-semibold tracking-tight">The docket is empty.</p>
              <p className="max-w-[520px] text-muted-foreground">
                File your first case, or open the sample trial to see how a ruling comes together.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to="/court/new" className={primaryButton}>
                  File a case
                </Link>
                <button type="button" className={ghostButton} onClick={() => sample.mutate({})}>
                  Open the sample trial
                </button>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {cases.map((c) => (
                <li key={c.id}>
                  <Link
                    to={c.status === "ruled" ? `/court/${c.id}/record` : `/court/${c.id}`}
                    className="group flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-line bg-bench/70 px-5 py-4 transition-colors hover:border-brass/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                  >
                    <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
                      {c.id.slice(5, 11).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-[1_1_320px] font-display text-lg font-semibold tracking-tight">
                      {c.motion}
                    </span>
                    {c.rehearsed && <span className="text-xs text-brass">Sample</span>}
                    {c.decision ? (
                      <span className="text-sm text-foreground/80">{DECISION_LABEL[c.decision as Decision]}</span>
                    ) : (
                      <span className="text-sm tabular-nums text-muted-foreground">Turn {Math.min(c.turn + 1, 6)} of 6</span>
                    )}
                    <StatusChip status={c.status} />
                    <IconArrowRight
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brass"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-xs text-muted-foreground">
          <Wordmark className="text-lg" />
          <span>Built on Agent-Native. Hero photo by Tim Mus on Unsplash.</span>
        </footer>
      </div>
    </div>
  );
}

/** A looping glimpse of the court: a quote fails its check and draws an objection. */
function HeroVignette() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setPhase((p) => (p + 1) % 4), 1700);
    return () => window.clearInterval(id);
  }, []);
  const failed = phase >= 2;
  return (
    <div aria-hidden="true" className="relative hidden w-[380px] shrink-0 lg:block">
      <motion.div
        animate={{ rotate: -2.5 }}
        className="exhibit-paper relative rounded-2xl p-5"
      >
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
        <p className="mt-1.5 text-[14px] leading-snug text-foreground/90">
          "A full migration is a three-week job."
        </p>
        <span
          className={cn(
            "mt-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] font-medium transition-colors",
            failed ? "bg-paper-dim text-paper-ink line-through decoration-failed-ink decoration-2" : "bg-paper text-paper-ink",
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
        className="absolute -bottom-6 -left-6 font-serif text-[64px] italic leading-none text-brass drop-shadow-[0_6px_30px_hsl(var(--primary)/0.5)]"
      >
        Objection!
      </motion.span>
    </div>
  );
}

import { useSession } from "@agent-native/core/client/hooks";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBrandGithub,
  IconGavel,
  IconPlayerPlay,
  IconQuote,
} from "@tabler/icons-react";
import { motion } from "motion/react";

import { ghostButton, primaryButton } from "@/components/court/Dialog";
import { HeroVignette } from "@/components/court/HeroVignette";
import { Eyebrow, Wordmark } from "@/components/court/primitives";
import { cn } from "@/lib/utils";

const TITLE = "Objection! Put the decision on trial";
const DESCRIPTION =
  "Two AI counsel argue your decision from your own evidence, one for and one against. Every quote is checked in code. You hold the gavel.";

export function meta() {
  return [
    { title: TITLE },
    { name: "description", content: DESCRIPTION },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: TITLE },
    { name: "twitter:description", content: DESCRIPTION },
  ];
}

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1713620689462-e201360c743e?auto=format&fit=crop&w=2200&q=70";

const REPO = "https://github.com/midexol/objection";

/** Where a call to action leads: straight in when signed in, through sign-in otherwise. */
function useEnter() {
  const { session } = useSession() as { session?: { email?: string } | null };
  const signedIn = !!session?.email;
  return (path: string) => (signedIn ? path : `/sign-in?return=${encodeURIComponent(path)}`);
}

const STEPS = [
  {
    n: "01",
    title: "File the motion",
    body: "A yes or no question, plus the evidence: docs, numbers, notes. Each becomes a lettered exhibit.",
  },
  {
    n: "02",
    title: "Counsel argue",
    body: "Defense argues for, Prosecution against: opening, rebuttal, closing, each quoting the exhibits.",
  },
  {
    n: "03",
    title: "Quotes are checked",
    body: "Code matches every quote to the exhibit text. A quote that is not there draws an objection.",
  },
  {
    n: "04",
    title: "You intervene",
    body: "Sustain or overrule, strike evidence, call a surprise witness, cross-examine either side.",
  },
  {
    n: "05",
    title: "The record keeps",
    body: "Your verdict becomes a decision record with the case for, against, the dissent and when to revisit.",
  },
];

const CALL = `submit-argument
{
  "caseId": "case_74aff77c1425",
  "side": "prosecution",
  "claim": "Launch first, migrate after.",
  "citations": [
    { "exhibit": "B",
      "quote": "A full migration is a three-week job" }
  ]
}`;

const REPLY = `{
  "failedCitations": [
    "\\"A full migration is a three-week job\\"
     does not appear in Exhibit B"
  ],
  "objection": {
    "grounds": "misquotes_the_record",
    "raisedBy": "defense",
    "origin": "court"
  },
  "message": "Recorded. Defense objects:
    Misquotes the record. The court pauses
    for the judge."
}`;

export default function LandingRoute() {
  const enter = useEnter();
  return (
    <div className="court-spotlight court-grain h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-20 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <nav className="flex items-center justify-between gap-4">
          <Wordmark className="text-[28px]" />
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href="#how"
              className="hidden min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              How it works
            </a>
            <a
              href="#agents"
              className="hidden min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              For agents
            </a>
            <a href={enter("/court")} className={ghostButton}>
              Enter the court
            </a>
          </div>
        </nav>

        <section className="relative isolate -mt-8 overflow-hidden rounded-[32px] border border-line">
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
          <div className="flex flex-wrap items-end gap-10 px-6 pb-16 pt-16 sm:px-12 sm:pb-20 sm:pt-28">
            <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-7">
              <Eyebrow className="text-brass">A decision court for teams</Eyebrow>
              <h1 className="font-display text-[clamp(52px,8.4vw,124px)] font-extrabold leading-[0.88] tracking-[-0.045em]">
                Put the decision
                <br />
                <span className="font-serif font-normal italic tracking-[-0.02em] text-brass">on trial.</span>
              </h1>
              <p className="max-w-[560px] text-[19px] leading-relaxed text-foreground/80">
                AI assistants tend to agree with whoever is asking. Objection! makes two AI counsel argue your decision from your own evidence, one for and one against. Every quote is checked in code. You hold the gavel.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={enter("/court/new")} className={cn(primaryButton, "min-h-13 px-6 text-base")}>
                  File a case <IconArrowRight className="size-4" aria-hidden="true" />
                </a>
                <a href={enter("/court?sample=1")} className={cn(ghostButton, "min-h-13 px-5 text-base backdrop-blur")}>
                  <IconPlayerPlay className="size-4" aria-hidden="true" /> Watch a sample trial
                </a>
              </div>
              <p className="text-xs text-muted-foreground">Free to try. The sample trial needs no API key.</p>
            </div>
            <HeroVignette />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Why it works">
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
              body: "Your verdict becomes a decision record your team can keep in the repo, exported as Markdown.",
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

        <section id="how" className="flex scroll-mt-8 flex-col gap-8" aria-labelledby="how-heading">
          <div className="flex flex-col gap-3">
            <Eyebrow>How a trial runs</Eyebrow>
            <h2 id="how-heading" className="font-display text-[clamp(34px,4.4vw,56px)] font-bold leading-[0.98] tracking-[-0.03em]">
              Five steps from <span className="font-serif font-normal italic text-brass">"should we?"</span> to a ruling.
            </h2>
          </div>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="relative flex flex-col gap-3 overflow-hidden rounded-[22px] border border-line bg-bench/70 p-5"
              >
                <span className="font-display text-[56px] font-extrabold leading-none tracking-[-0.05em] text-brass/25">
                  {s.n}
                </span>
                <h3 className="font-display text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        <section
          id="agents"
          className="flex scroll-mt-8 flex-wrap items-start gap-10 rounded-[32px] border border-line bg-bench/80 p-6 sm:p-10"
          aria-labelledby="agents-heading"
        >
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-5">
            <Eyebrow className="text-brass">Built on Agent-Native</Eyebrow>
            <h2 id="agents-heading" className="font-display text-[clamp(30px,3.6vw,46px)] font-bold leading-[1.02] tracking-[-0.03em]">
              Any agent can be counsel.
              <br />
              <span className="font-serif font-normal italic text-foreground/70">None can fake a quote.</span>
            </h2>
            <p className="text-[16px] leading-relaxed text-foreground/80">
              Every court operation is one action shared by the screen, the in-app Clerk, the CLI and MCP. An outside agent such as Claude Code can argue a side by calling <code className="rounded bg-ink px-1.5 py-0.5 font-mono text-[14px] text-brass-strong">submit-argument</code>, and it faces the same citation check as the built-in counsel.
            </p>
            <ul className="flex flex-col gap-2.5 text-[15px] text-foreground/85">
              <li className="flex gap-3">
                <span className="font-mono text-sm text-brass">A</span> Agents can propose evidence, rulings and verdicts. A person approves each one.
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-sm text-brass">B</span> The transcript records who acted and from which surface: ui, agent or mcp.
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-sm text-brass">C</span> Citation checks, objections and the weight of argument are plain code.
              </li>
            </ul>
          </div>
          <div className="grid min-w-0 flex-[1.2_1_480px] grid-cols-1 gap-3 md:grid-cols-2">
            <figure className="flex min-w-0 flex-col gap-2">
              <figcaption className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                An agent argues over MCP
              </figcaption>
              <pre className="whitespace-pre-wrap break-words rounded-2xl border border-line-strong bg-ink p-4 font-mono text-[12.5px] leading-relaxed text-foreground/85">
                {CALL}
              </pre>
            </figure>
            <figure className="flex min-w-0 flex-col gap-2">
              <figcaption className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                The court answers
              </figcaption>
              <pre className="whitespace-pre-wrap break-words rounded-2xl border border-brass/40 bg-ink p-4 font-mono text-[12.5px] leading-relaxed text-brass-strong">
                {REPLY}
              </pre>
            </figure>
          </div>
        </section>

        <section className="flex flex-col items-center gap-6 py-6 text-center">
          <h2 className="font-display text-[clamp(40px,6vw,84px)] font-extrabold leading-[0.9] tracking-[-0.045em]">
            Your next big call
            <br />
            <span className="font-serif font-normal italic text-brass">deserves a cross-examination.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={enter("/court/new")} className={cn(primaryButton, "min-h-13 px-6 text-base")}>
              File a case <IconArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a href={enter("/court?sample=1")} className={cn(ghostButton, "min-h-13 px-5 text-base")}>
              <IconPlayerPlay className="size-4" aria-hidden="true" /> Watch a sample trial
            </a>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-xs text-muted-foreground">
          <Wordmark className="text-lg" />
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={REPO}
              className="inline-flex min-h-10 items-center gap-1.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              <IconBrandGithub className="size-4" aria-hidden="true" /> Source
            </a>
            <span>Built on Agent-Native. Hero photo by Tim Mus on Unsplash.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

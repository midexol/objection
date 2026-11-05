import { callAction, useActionQuery } from "@agent-native/core/client/hooks";
import { IconArrowLeft, IconCopy, IconDownload, IconScale } from "@tabler/icons-react";
import { motion } from "motion/react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { ghostButton, primaryButton } from "@/components/court/Dialog";
import { Eyebrow, WeightBar } from "@/components/court/primitives";
import type { Argument, CaseFile } from "@/components/court/types";
import {
  BASIS_LABEL,
  DECISION_LABEL,
  GROUNDS_LABEL,
  SIDE_LABEL,
  type Decision,
  type Grounds,
  type Side,
} from "@shared/court";

export function meta() {
  return [{ title: "Decision - Objection!" }];
}

function strength(a: Argument) {
  const base = a.basis === "record" ? 3 : a.basis === "inference" ? 2 : 1;
  return base + Math.min(3, a.citations.filter((c) => c.verified).length);
}

function strongest(file: CaseFile, side: Side) {
  const standing = file.arguments.filter((a) => a.side === side && a.status === "standing");
  return standing.length ? standing.reduce((b, a) => (strength(a) >= strength(b) ? a : b)) : null;
}

export default function RecordRoute() {
  const { id = "" } = useParams();
  const { data, isLoading } = useActionQuery("get-case", { id });
  const file = data as unknown as CaseFile | undefined;

  if (isLoading || !file) {
    return <div className="court-spotlight h-full animate-pulse" />;
  }
  const k = file.case;
  if (k.status !== "ruled") {
    return (
      <div className="court-spotlight flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="font-display text-3xl font-semibold">The judge has not ruled on this case yet.</p>
        <Link to={`/court/${k.id}`} className={primaryButton}>
          Return to the courtroom
        </Link>
      </div>
    );
  }

  const decision = (k.decision ?? "denied") as Decision;
  const forArg = strongest(file, "defense");
  const againstArg = strongest(file, "prosecution");
  const dissentSide: Side =
    decision === "granted" ? "prosecution" : decision === "denied" ? "defense" : file.weight.defense >= file.weight.prosecution ? "prosecution" : "defense";
  const shown = dissentSide === "defense" ? forArg : againstArg;
  const dissentPool = file.arguments.filter(
    (a) => a.side === dissentSide && a.status === "standing" && a.id !== shown?.id,
  );
  const dissent = dissentPool.length
    ? dissentPool.reduce((b, a) => (a.turn > b.turn ? a : b))
    : null;
  const sustained = file.objections.filter((o) => o.status === "sustained").length;
  const struckExhibits = file.exhibits.filter((e) => e.status !== "admitted").length;

  async function exportRecord(mode: "download" | "copy") {
    try {
      const r = await callAction("export-record", { id: k.id }, { method: "GET" });
      if (mode === "copy") {
        await navigator.clipboard.writeText(r.markdown);
        toast.success("Decision copied.");
        return;
      }
      const blob = new Blob([r.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not save the decision. Try again.");
    }
  }

  return (
    <div className="court-room min-h-full">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 pb-20 pt-6 sm:px-6 lg:px-10">
        <nav className="flex items-center justify-between gap-4">
          <Link
            to={`/court/${k.id}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          >
            <IconArrowLeft className="size-4" aria-hidden="true" /> Back to the trial
          </Link>
          <Link to="/court" className="text-sm font-semibold underline-offset-4 hover:underline">
            My cases
          </Link>
        </nav>

        <div className="flex flex-wrap items-start gap-8">
          <motion.article
            initial={{ opacity: 0, y: 24, rotate: -0.6 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            className="exhibit-paper pop flex min-w-0 flex-[999_1_640px] flex-col gap-8 !border-brass p-7 sm:p-12"
            style={{ "--pop": "hsl(232 100% 89%)" } as unknown as Record<string, string>}
          >
            <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px] font-medium tracking-[0.14em] text-paper-muted">
              <span>THE DECISION, CASE {k.id.slice(5, 11).toUpperCase()}</span>
              <span>DECIDED {k.ruledAt ? new Date(k.ruledAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }).toUpperCase() : ""}</span>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-paper-muted">THE QUESTION</span>
              <h1 className="font-didone text-[clamp(32px,4.4vw,58px)] font-normal leading-[1.02] tracking-[-0.01em]">{k.motion}</h1>
            </div>

            <div className="pop-sm flex flex-col gap-3 bg-highlight p-6 text-paper-ink sm:p-8">
              <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-paper-ink/70">
                RULING, {DECISION_LABEL[decision].toUpperCase()}
              </span>
              <p className="font-didone text-[clamp(26px,3vw,40px)] leading-[1.12]">{k.ruling}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CaseColumn title="Strongest case for" side="defense" arg={forArg} file={file} />
              <CaseColumn title="Strongest case against" side="prosecution" arg={againstArg} file={file} />
            </div>

            {dissent && (
              <section className="flex flex-col gap-2">
                <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-paper-muted">
                  THE OTHER SIDE, {SIDE_LABEL[dissentSide].toUpperCase()}
                </span>
                <p className="font-serif text-[20px] italic leading-relaxed text-paper-ink/85">{dissent.body}</p>
              </section>
            )}

            <section className="flex flex-col gap-3">
              <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-paper-muted">
                LOOK AT THIS AGAIN IF
              </span>
              {k.appealConditions.length ? (
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[16px]">
                  {k.appealConditions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-paper-muted">No conditions were set.</p>
              )}
            </section>

            <section className="flex flex-col gap-3 border-t border-paper-ink/15 pt-6">
              <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-paper-muted">EVIDENCE</span>
              <ul className="grid grid-cols-1 gap-2 text-[15px] sm:grid-cols-2">
                {file.exhibits.map((e) => (
                  <li key={e.id} className={e.status !== "admitted" ? "text-paper-muted line-through" : ""}>
                    <span className="font-mono text-[12px] font-semibold">EVIDENCE {e.letter}</span>{" "}
                    <span className="font-serif text-[18px]">{e.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          </motion.article>

          <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 lg:sticky lg:top-6">
            <section className="flex flex-col gap-3 pop bg-bench p-6">
              <h2 className="font-didone text-[28px] leading-none">Take it with you</h2>
              <p className="text-sm text-muted-foreground">Saves the decision as a plain text note your team can keep with its code.</p>
              <button type="button" className={primaryButton} onClick={() => void exportRecord("download")}>
                <IconDownload className="size-4" aria-hidden="true" /> Download .md
              </button>
              <button type="button" className={ghostButton} onClick={() => void exportRecord("copy")}>
                <IconCopy className="size-4" aria-hidden="true" /> Copy as Markdown
              </button>
              <Link to="/court/new" className={ghostButton}>
                <IconScale className="size-4" aria-hidden="true" /> File another case
              </Link>
            </section>

            <section className="flex flex-col gap-4 pop bg-bench p-6">
              <Eyebrow>The trial in numbers</Eyebrow>
              <dl className="grid grid-cols-2 gap-4">
                {[
                  { n: file.exhibits.length, label: struckExhibits ? `exhibits, ${struckExhibits} struck` : "exhibits" },
                  { n: file.objections.length, label: `objections, ${sustained} sustained` },
                  { n: file.arguments.length, label: "statements" },
                  {
                    n: file.arguments.reduce((s, a) => s + a.citations.filter((c) => c.verified).length, 0),
                    label: "verified quotes",
                  },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <dt className="order-2 text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="font-display text-4xl font-bold tabular-nums tracking-tight">{s.n}</dd>
                  </div>
                ))}
              </dl>
              <WeightBar defensePct={file.weight.defensePct} caption={false} />
            </section>

            {file.objections.length > 0 && (
              <section className="flex flex-col gap-2 pop bg-bench p-6 text-sm">
                <Eyebrow>Objections raised</Eyebrow>
                <ul className="flex flex-col gap-2">
                  {file.objections.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3">
                      <span>{GROUNDS_LABEL[o.grounds as Grounds] ?? o.grounds}</span>
                      <span className={o.status === "sustained" ? "text-defense" : "text-prosecution"}>
                        {o.status === "pending" ? "Pending" : o.status === "sustained" ? "Sustained" : "Overruled"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function CaseColumn({
  title,
  side,
  arg,
  file,
}: {
  title: string;
  side: Side;
  arg: Argument | null;
  file: CaseFile;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-paper-ink/15 p-5">
      <span
        className={
          "font-mono text-[11px] font-semibold tracking-[0.16em] " +
          (side === "defense" ? "text-defense-ink" : "text-prosecution-ink")
        }
      >
        {title.toUpperCase()}
      </span>
      {arg ? (
        <>
          <p className="font-display text-[19px] font-semibold leading-snug tracking-tight">{arg.claim}</p>
          <p className="text-[14.5px] leading-relaxed text-paper-ink/80">{arg.body}</p>
          <ul className="flex flex-col gap-1">
            {arg.citations
              .filter((c) => c.verified)
              .map((c, i) => (
                <li key={i} className="text-[13px] text-paper-muted">
                  <span className="font-mono font-semibold">EXHIBIT {c.exhibit}</span>{" "}
                  <span className="font-serif text-[15px] italic">"{c.quote}"</span>
                </li>
              ))}
          </ul>
          <span className="text-xs text-paper-muted">{BASIS_LABEL[arg.basis]}</span>
        </>
      ) : (
        <p className="text-paper-muted">Nothing left standing for {SIDE_LABEL[side]}.</p>
      )}
      {file.arguments.filter((a) => a.side === side && a.status === "struck").length > 0 && (
        <span className="text-xs text-paper-muted">
          {file.arguments.filter((a) => a.side === side && a.status === "struck").length} statement(s) struck
        </span>
      )}
    </section>
  );
}

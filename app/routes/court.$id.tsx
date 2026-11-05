import { useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import {
  IconArrowLeft,
  IconFileText,
  IconGavel,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRotate,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { ArgumentCard, DraftingCard } from "@/components/court/ArgumentCard";
import { fieldClass, ghostButton, primaryButton } from "@/components/court/Dialog";
import { AddExhibitDialog, ExhibitCard, ExhibitDialog } from "@/components/court/Exhibits";
import { ObjectionOverlay } from "@/components/court/ObjectionOverlay";
import {
  CounselSeal,
  Eyebrow,
  Scoreboard,
  SideLabel,
  StatusChip,
  TrialProgress,
} from "@/components/court/primitives";
import type { Argument, CaseFile } from "@/components/court/types";
import { VerdictDialog } from "@/components/court/VerdictDialog";
import { cn } from "@/lib/utils";
import { SCHEDULE, SIDE_LABEL, TOTAL_TURNS, type Side } from "@shared/court";

export function meta() {
  return [{ title: "Courtroom - Objection!" }];
}

const SURPRISE = {
  title: "Team availability",
  source: "Judge's note",
  content:
    "Our only backend developer, Tola, is out all of next week for a family wedding. No one else on the team has written a database migration before.",
};

function cleanError(error: Error) {
  return error.message.replace(/^Action [\w-]+ failed: /, "");
}

function readSoundPref() {
  try {
    return window.localStorage.getItem("objection.sound") !== "off";
  } catch {
    return true;
  }
}

export default function CourtroomRoute() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = useActionQuery("get-case", { id });
  const file = data as unknown as CaseFile | undefined;

  if (isLoading && !file) return <CourtroomSkeleton />;
  if (error || !file) {
    return (
      <div className="court-spotlight flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="font-display text-3xl font-semibold">This case is not on your docket.</p>
        <Link to="/court" className={ghostButton}>
          Back to the docket
        </Link>
      </div>
    );
  }
  return <Courtroom file={file} />;
}

function Courtroom({ file }: { file: CaseFile }) {
  const k = file.case;
  const [sound, setSound] = useState(true);
  const [auto, setAuto] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [exhibitOpen, setExhibitOpen] = useState<{ letter: string; quote: string | null } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [verdictOpen, setVerdictOpen] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const autoTimer = useRef<number | null>(null);

  useEffect(() => setSound(readSoundPref()), []);
  useEffect(() => {
    try {
      window.localStorage.setItem("objection.sound", sound ? "on" : "off");
    } catch {
      // Preference only.
    }
  }, [sound]);

  // Arguments present on first paint are history; later ones type in.
  if (seen.current === null) seen.current = new Set(file.arguments.map((a) => a.id));
  const latest = file.arguments[file.arguments.length - 1];
  useEffect(() => {
    if (latest && !seen.current!.has(latest.id)) {
      seen.current!.add(latest.id);
      setTypingId(latest.id);
    }
  }, [latest]);

  const pending = file.objections.find((o) => o.status === "pending") ?? null;
  const pendingTarget = pending ? file.arguments.find((a) => a.id === pending.targetArgumentId) : undefined;
  const ruled = k.status === "ruled";
  const finished = k.turn >= TOTAL_TURNS;
  const nextSlot = finished ? null : SCHEDULE[k.turn]!;
  const needsKey = !k.rehearsed && !file.counsel.live;

  const advance = useActionMutation("advance-trial", {
    onError: (e) => {
      setAuto(false);
      toast.error(cleanError(e));
    },
  });

  const callCounsel = useCallback(() => {
    if (advance.isPending || pending || finished || ruled) return;
    advance.mutate({ caseId: k.id });
  }, [advance, pending, finished, ruled, k.id]);

  // Auto-proceed: once the last statement has finished typing, call the next counsel.
  useEffect(() => {
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    if (!auto || typingId || advance.isPending || pending || finished || ruled) return;
    autoTimer.current = window.setTimeout(callCounsel, 1100);
    return () => {
      if (autoTimer.current) window.clearTimeout(autoTimer.current);
    };
  }, [auto, typingId, advance.isPending, pending, finished, ruled, callCounsel]);

  useEffect(() => {
    if (finished && auto) {
      setAuto(false);
      toast("Closing statements are done. The court awaits your verdict.");
    }
  }, [finished, auto]);

  const citedNow = useMemo(() => {
    const map = new Map<string, Side>();
    const source = typingId ? file.arguments.find((a) => a.id === typingId) : null;
    if (source) for (const c of source.citations) if (c.verified) map.set(c.exhibit, source.side);
    return map;
  }, [typingId, file.arguments]);

  const strike = useActionMutation("update-exhibit", { onError: (e) => toast.error(cleanError(e)) });
  const restart = useActionMutation("restart-trial", {
    onSuccess: () => {
      seen.current = new Set();
      setTypingId(null);
      setAuto(false);
      toast("The trial is reset to opening statements.");
    },
    onError: (e) => toast.error(cleanError(e)),
  });

  const hasWitness = file.exhibits.some((e) => e.title === SURPRISE.title);
  const openExhibit = file.exhibits.find((e) => e.letter === exhibitOpen?.letter) ?? null;
  const exhibitQuotes = useMemo(
    () =>
      openExhibit
        ? file.arguments.flatMap((a) =>
            a.citations
              .filter((c) => c.exhibit === openExhibit.letter)
              .map((c) => ({ quote: c.quote, side: a.side, verified: c.verified })),
          )
        : [],
    [openExhibit, file.arguments],
  );

  const draftingSide: Side | null = advance.isPending && nextSlot ? nextSlot.side : null;

  // The room takes the colour of the moment, like the landing film.
  const room = pending
    ? "hsl(12 100% 91%)"
    : ruled
      ? "hsl(232 100% 94%)"
      : finished
        ? "hsl(38 100% 90%)"
        : "hsl(42 38% 95%)";

  return (
    <div className="court-room min-h-full" style={{ "--room": room } as React.CSSProperties}>
      <header className="border-b-[1.5px] border-brass bg-highlight">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-[3_1_520px] items-start gap-3">
            <Link
              to="/court"
              aria-label="Back to the docket"
              className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-brass bg-bench transition-colors hover:bg-brass hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-defense"
            >
              <IconArrowLeft className="size-5" aria-hidden="true" />
            </Link>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Eyebrow className="text-foreground/70">
                Case {k.id.slice(5, 11).toUpperCase()}
                {k.rehearsed && <span className="ml-3 text-stamp">Rehearsed sample trial</span>}
              </Eyebrow>
              <h1 className="font-didone text-[clamp(26px,3.4vw,46px)] font-normal leading-[1.02] tracking-[-0.01em]">
                {k.motion}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="mr-1 hidden flex-col items-end gap-1.5 md:flex">
              <TrialProgress turn={k.turn} />
              <span className="text-[11px] font-medium text-foreground/70">
                {ruled
                  ? "Record closed"
                  : finished
                    ? "Closings done"
                    : `${nextSlot!.stage[0]!.toUpperCase()}${nextSlot!.stage.slice(1)}, ${SIDE_LABEL[nextSlot!.side]} next`}
              </span>
            </div>
            <StatusChip status={k.status} paused={!!pending} />
            <button
              type="button"
              onClick={() => setSound((s) => !s)}
              aria-label={sound ? "Mute gavel" : "Unmute gavel"}
              aria-pressed={sound}
              className="inline-flex size-11 items-center justify-center rounded-full border-[1.5px] border-brass bg-bench transition-colors hover:bg-brass hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-defense"
            >
              {sound ? <IconVolume className="size-5" aria-hidden="true" /> : <IconVolumeOff className="size-5" aria-hidden="true" />}
            </button>
            {!ruled && (
              <button type="button" className={ghostButton} onClick={() => setAddOpen(true)}>
                <IconPlus className="size-4" aria-hidden="true" /> Add exhibit
              </button>
            )}
            {ruled ? (
              <Link to={`/court/${k.id}/record`} className={primaryButton}>
                <IconFileText className="size-4" aria-hidden="true" /> Decision record
              </Link>
            ) : (
              <button
                type="button"
                className={finished ? primaryButton : ghostButton}
                onClick={() => setVerdictOpen(true)}
                disabled={!!pending || file.arguments.length === 0}
              >
                <IconGavel className="size-4" aria-hidden="true" /> {finished ? "Deliver verdict" : "Rule early"}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="z-20 md:sticky md:top-0">
        <Scoreboard defensePct={file.weight.defensePct} />
      </div>

      {needsKey && (
        <div className="mx-auto mt-5 max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pop-sm bg-brass-deep px-5 py-4">
            <p className="text-sm text-brass-strong">
              Live counsel needs a free model key (Groq, Gemini or OpenRouter) in the server environment. You can still build the evidence board now, or watch the rehearsed sample trial.
            </p>
          </div>
        </div>
      )}

      <main className="@container mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-5 @3xl:grid-cols-2 @6xl:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)_minmax(0,1fr)]">
        <Bench
          side="defense"
          file={file}
          typingId={typingId}
          drafting={draftingSide === "defense"}
          onOpenExhibit={(letter, quote) => setExhibitOpen({ letter, quote: quote ?? null })}
          onTyped={() => setTypingId(null)}
        />

        <section
          aria-label="Evidence board"
          className="pop grid-paper order-first flex min-w-0 flex-col gap-5 p-5 @3xl:col-span-2 @6xl:order-none @6xl:col-span-1"
          style={{ "--pop": "hsl(52 100% 60%)" } as React.CSSProperties}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-didone text-[34px] font-normal leading-none tracking-[-0.01em]">Evidence board</h2>
            <Eyebrow>
              {file.exhibits.filter((e) => e.status === "admitted").length} admitted
              {file.exhibits.some((e) => e.status !== "admitted") &&
                `, ${file.exhibits.filter((e) => e.status !== "admitted").length} struck`}
              , shared with both counsel
            </Eyebrow>
          </div>
          <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @5xl:grid-cols-3 @6xl:grid-cols-2">
            {file.exhibits.map((e, i) => (
              <ExhibitCard
                key={e.id}
                tilt={[-1.1, 0.8, -0.5, 1][i % 4]!}
                exhibit={e}
                citedBy={citedNow.get(e.letter) ?? null}
                disabled={ruled || strike.isPending}
                onOpen={() => setExhibitOpen({ letter: e.letter, quote: null })}
                onToggleStrike={() =>
                  strike.mutate({
                    caseId: k.id,
                    letter: e.letter,
                    status: e.status === "admitted" ? "struck" : "admitted",
                  })
                }
              />
            ))}
            {!ruled && (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-brass/50 bg-bench/70 text-foreground/70 transition-colors hover:border-brass hover:bg-brass-deep hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-defense"
              >
                <IconPlus className="size-6" aria-hidden="true" />
                <span className="font-medium">
                  {k.rehearsed && !hasWitness ? "Call a surprise witness" : "Enter an exhibit"}
                </span>
                <span className="max-w-[260px] text-center text-xs">
                  Both counsel will rework their arguments around it.
                </span>
              </button>
            )}
          </div>
          <p className="text-xs text-foreground/60">
            The scoreboard above is scored by rule from standing, verified arguments.
          </p>
        </section>

        <Bench
          side="prosecution"
          file={file}
          typingId={typingId}
          drafting={draftingSide === "prosecution"}
          onOpenExhibit={(letter, quote) => setExhibitOpen({ letter, quote: quote ?? null })}
          onTyped={() => setTypingId(null)}
        />
        </div>
      </main>

      <JudgeBench
        file={file}
        auto={auto}
        busy={advance.isPending}
        paused={!!pending}
        onToggleAuto={() => {
          if (auto) setAuto(false);
          else {
            setAuto(true);
            if (!typingId) callCounsel();
          }
        }}
        onStep={callCounsel}
        onRestart={() => restart.mutate({ caseId: k.id })}
        onVerdict={() => setVerdictOpen(true)}
        needsKey={needsKey}
      />

      <ObjectionOverlay
        objection={pending}
        target={pendingTarget}
        sound={sound}
        onRuled={(ruling) =>
          toast(ruling === "sustained" ? "Sustained. The statement is struck." : "Overruled. The statement stands.")
        }
      />
      <ExhibitDialog
        exhibit={exhibitOpen ? openExhibit : null}
        quotes={exhibitQuotes}
        focusQuote={exhibitOpen?.quote ?? null}
        onOpenChange={(o) => !o && setExhibitOpen(null)}
      />
      <AddExhibitDialog
        caseId={k.id}
        open={addOpen}
        onOpenChange={setAddOpen}
        suggestion={k.rehearsed && !hasWitness ? SURPRISE : null}
      />
      <VerdictDialog file={file} open={verdictOpen} onOpenChange={setVerdictOpen} sound={sound} />
    </div>
  );
}

function Bench({
  side,
  file,
  typingId,
  drafting,
  onOpenExhibit,
  onTyped,
}: {
  side: Side;
  file: CaseFile;
  typingId: string | null;
  drafting: boolean;
  onOpenExhibit: (letter: string, quote?: string) => void;
  onTyped: () => void;
}) {
  const args = file.arguments.filter((a) => a.side === side);
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = args[args.length - 1]?.id;
  const mounted = useRef(false);
  useEffect(() => {
    // Follow new statements as they arrive, but never jump the page on first paint.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lastId, drafting]);
  const standing = args.filter((a: Argument) => a.status === "standing").length;

  return (
    <section
      aria-label={`${SIDE_LABEL[side]} bench`}
      className={cn(
        "pop flex min-w-0 flex-col gap-4 p-5 @6xl:sticky @6xl:top-[96px] @6xl:max-h-[calc(100vh-120px)]",
        side === "defense" ? "bg-[hsl(226_100%_96%)]" : "bg-[hsl(10_100%_96%)]",
      )}
      style={{ "--pop": side === "defense" ? "hsl(226 86% 48%)" : "hsl(8 82% 48%)" } as React.CSSProperties}
    >
      <header className="flex items-center gap-3">
        <CounselSeal side={side} size="lg" />
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "font-didone text-[30px] leading-none tracking-[-0.01em]",
              side === "defense" ? "text-defense" : "text-prosecution",
            )}
          >
            {SIDE_LABEL[side]}
          </span>
          <span className="text-[13px] text-foreground/65">
            {side === "defense" ? "Argues for the motion" : "Argues against the motion"}
          </span>
        </div>
        <span className="ml-auto shrink-0 whitespace-nowrap rounded-full border-[1.5px] border-brass bg-bench px-2.5 py-1 text-xs font-semibold tabular-nums">
          {standing} standing
        </span>
      </header>
      <div className="court-scroll -mr-2 flex flex-col gap-3 overflow-y-auto pr-2">
        {args.length === 0 && !drafting && (
          <p className="rounded-xl border-[1.5px] border-dashed border-brass/40 bg-bench/60 px-4 py-6 text-center text-sm text-foreground/70">
            {side === "defense" ? "Defense opens the trial." : "Prosecution answers the opening."}
          </p>
        )}
        {args.map((a) => (
          <ArgumentCard
            key={a.id}
            argument={a}
            fresh={a.id === typingId}
            speaking={a.id === typingId}
            question={a.answersQuestionId ? file.questions.find((q) => q.id === a.answersQuestionId) : undefined}
            onOpenExhibit={onOpenExhibit}
            onTyped={onTyped}
          />
        ))}
        <AnimatePresence>{drafting && <DraftingCard side={side} />}</AnimatePresence>
        <div ref={endRef} />
      </div>
    </section>
  );
}

function JudgeBench({
  file,
  auto,
  busy,
  paused,
  needsKey,
  onToggleAuto,
  onStep,
  onRestart,
  onVerdict,
}: {
  file: CaseFile;
  onVerdict: () => void;
  auto: boolean;
  busy: boolean;
  paused: boolean;
  needsKey: boolean;
  onToggleAuto: () => void;
  onStep: () => void;
  onRestart: () => void;
}) {
  const k = file.case;
  const [question, setQuestion] = useState("");
  const [to, setTo] = useState<"defense" | "prosecution" | "both">("defense");
  const ask = useActionMutation("cross-examine", {
    onSuccess: (r) => {
      toast(r.message);
      setQuestion("");
    },
    onError: (e) => toast.error(cleanError(e)),
  });
  const finished = k.turn >= TOTAL_TURNS;
  const ruled = k.status === "ruled";
  const next = finished ? null : SCHEDULE[k.turn]!;
  const openQuestions = file.questions.filter((q) => !q.answered);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (question.trim().length < 4) return;
    ask.mutate({ caseId: k.id, side: to, question: question.trim() });
  }

  return (
    <footer className="mx-auto flex max-w-[1600px] flex-wrap items-start gap-5 px-4 pb-10 sm:px-6 lg:px-8">
      <section
        aria-label="Judge's bench"
        className="pop relative flex min-w-0 flex-[2_1_620px] flex-col gap-5 bg-highlight p-5 sm:p-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-didone text-[34px] leading-none tracking-[-0.01em]">Your bench</span>
            <p className="text-sm font-medium text-foreground/75">
              {ruled
                ? "The record is closed."
                : paused
                  ? "Counsel is paused until you rule on the objection."
                  : finished
                    ? "Both sides have closed. Deliver your verdict."
                    : `${SIDE_LABEL[next!.side]} gives the ${next!.stage} next.`}
            </p>
          </div>
          {!ruled && finished && (
            <button type="button" className={primaryButton} disabled={paused} onClick={onVerdict}>
              <IconGavel className="size-4" aria-hidden="true" /> Deliver verdict
            </button>
          )}
          {!ruled && !finished && (
            <div className="flex flex-wrap gap-2">
              {k.turn === 0 && file.arguments.length === 0 ? (
                <button type="button" className={primaryButton} disabled={busy || needsKey} onClick={onToggleAuto}>
                  <IconPlayerPlay className="size-4" aria-hidden="true" /> Begin the trial
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={auto ? primaryButton : ghostButton}
                    disabled={finished || paused || needsKey}
                    onClick={onToggleAuto}
                    aria-pressed={auto}
                  >
                    {auto ? (
                      <>
                        <IconPlayerPause className="size-4" aria-hidden="true" /> Pause counsel
                      </>
                    ) : (
                      <>
                        <IconPlayerPlay className="size-4" aria-hidden="true" /> Let counsel continue
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className={ghostButton}
                    disabled={busy || finished || paused || auto || needsKey}
                    onClick={onStep}
                  >
                    Call {next ? SIDE_LABEL[next.side] : "counsel"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {!ruled && !finished && (
          <form onSubmit={submit} className="flex flex-col gap-2.5">
            <label htmlFor="cross" className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em]">
              Cross-examine
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="cross"
                className={cn(fieldClass, "min-h-11 flex-[1_1_320px]")}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Who runs the migration if the backend developer is away?"
                maxLength={400}
              />
              <div role="radiogroup" aria-label="Direct question to" className="flex overflow-hidden rounded-full border-[1.5px] border-brass bg-bench">
                {(["defense", "prosecution", "both"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={to === s}
                    onClick={() => setTo(s)}
                    className={cn(
                      "min-h-11 px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brass",
                      s !== "defense" && "border-l-[1.5px] border-brass",
                      to === s
                        ? s === "defense"
                          ? "bg-defense text-white"
                          : s === "prosecution"
                            ? "bg-prosecution text-white"
                            : "bg-brass text-white"
                        : "text-foreground/70 hover:text-foreground",
                    )}
                  >
                    {s === "both" ? "Both" : SIDE_LABEL[s]}
                  </button>
                ))}
              </div>
              <button type="submit" className={ghostButton} disabled={ask.isPending || question.trim().length < 4}>
                Ask
              </button>
            </div>
            {openQuestions.length > 0 && (
              <p className="text-xs font-medium text-foreground">
                Waiting on {openQuestions.map((q) => SIDE_LABEL[q.side]).join(" and ")} to answer: "{openQuestions[0]!.question}"
              </p>
            )}
          </form>
        )}

        {file.arguments.length > 0 && !ruled && (
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-defense"
          >
            <IconRotate className="size-3.5" aria-hidden="true" /> Restart from opening statements
          </button>
        )}
      </section>

      <section
        aria-label="Court transcript"
        className="pop flex min-w-0 flex-[1_1_380px] flex-col gap-3 bg-bench p-5 sm:p-6"
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-didone text-[26px] leading-none">Transcript</span>
          <span className="text-[11px] text-muted-foreground">who, and from which surface</span>
        </div>
        <ol className="court-scroll flex max-h-64 flex-col gap-3 overflow-y-auto font-mono text-[12px]">
          {[...file.transcript].reverse().slice(0, 40).map((t) => (
            <li key={t.id} className="grid grid-cols-[42px_minmax(0,1fr)] gap-x-3 gap-y-0.5">
              <span className="row-span-2 pt-px tabular-nums text-muted-foreground/80">
                {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
              </span>
              <span
                className={cn(
                  "uppercase tracking-[0.08em]",
                  t.actor === "defense"
                    ? "text-defense"
                    : t.actor === "prosecution"
                      ? "text-prosecution"
                      : t.actor === "judge"
                        ? "text-brass"
                        : "text-muted-foreground",
                )}
              >
                {t.actor}
                <span className="ml-2 normal-case tracking-normal text-muted-foreground/70">
                  {t.via === "engine" ? "counsel" : t.via === "rehearsal" ? "rehearsed" : t.via}
                </span>
              </span>
              <span className="text-foreground/85">{t.entry}</span>
            </li>
          ))}
        </ol>
      </section>
    </footer>
  );
}

function CourtroomSkeleton() {
  return (
    <div className="court-room flex h-full flex-col gap-6 p-8">
      <span className="h-9 w-2/3 animate-pulse rounded-lg bg-bench-raised" />
      <div className="flex flex-1 gap-5">
        <span className="flex-1 animate-pulse rounded-[22px] bg-bench" />
        <span className="flex-[2] animate-pulse rounded-[22px] bg-bench" />
        <span className="flex-1 animate-pulse rounded-[22px] bg-bench" />
      </div>
    </div>
  );
}

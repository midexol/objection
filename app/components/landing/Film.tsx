import { IconCheck, IconX } from "@tabler/icons-react";
import { useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------------- */
/* The clock. One progress value, 0 at the top of the film and 1 at the end. */
/* ------------------------------------------------------------------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Smoothstep from a to b. */
const ss = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Visible inside [a, b] with short fades at both ends. `hold` keeps it at the end. */
const win = (p: number, a: number, b: number, fade = 0.022, hold = false) =>
  ss(a, a + fade, p) * (hold ? 1 : 1 - ss(b - fade, b, p));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const BEATS = [
  { key: "hero", a: 0, b: 0.11 },
  { key: "agree", a: 0.1, b: 0.23 },
  { key: "evidence", a: 0.22, b: 0.35 },
  { key: "argument", a: 0.34, b: 0.49 },
  { key: "objection", a: 0.48, b: 0.65 },
  { key: "ruling", a: 0.64, b: 0.77 },
  { key: "agents", a: 0.76, b: 0.89 },
  { key: "record", a: 0.88, b: 1.01 },
] as const;

const BEAT = Object.fromEntries(BEATS.map((b) => [b.key, b])) as unknown as Record<
  (typeof BEATS)[number]["key"],
  { a: number; b: number }
>;

/** One bright ground per beat. Ink type stays legible on every one of them. */
const FIELDS: { beat: (typeof BEATS)[number]["key"]; color: string }[] = [
  { beat: "hero", color: "hsl(52 100% 60%)" },
  { beat: "agree", color: "hsl(330 100% 87%)" },
  { beat: "evidence", color: "hsl(198 100% 84%)" },
  { beat: "argument", color: "hsl(152 72% 80%)" },
  { beat: "objection", color: "hsl(12 100% 88%)" },
  { beat: "ruling", color: "hsl(38 100% 78%)" },
  { beat: "agents", color: "hsl(232 100% 89%)" },
  { beat: "record", color: "hsl(52 100% 60%)" },
];

export const IMAGES = {
  columns:
    "https://images.unsplash.com/photo-1713620689462-e201360c743e?auto=format&fit=crop&w=2400&q=70",
  desk: "https://images.unsplash.com/photo-1681301865120-7c74657dc01a?auto=format&fit=crop&w=2400&q=70",
  lamp: "https://images.unsplash.com/photo-1728473577296-309fa0ac619b?auto=format&fit=crop&w=2400&q=70",
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!m) return;
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------------- */

export function Film({
  scroller,
  enterHref,
  sampleHref,
}: {
  scroller: RefObject<HTMLDivElement | null>;
  enterHref: string;
  sampleHref: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    container: scroller,
    target: track,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 32, mass: 0.6 });
  const [p, setP] = useState(0);
  useMotionValueEvent(reduced ? scrollYProgress : smooth, "change", (v) => setP(v));

  const beatIndex = BEATS.reduce((idx, b, i) => (p >= b.a + 0.01 ? i : idx), 0);

  return (
    <div ref={track} className="relative" style={{ height: "1000vh" }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden film-ink">
        <Plates p={p} />
        <div className="film-vignette pointer-events-none absolute inset-0" />

        <Hero p={p} enterHref={enterHref} sampleHref={sampleHref} />
        <AgreeBeat p={p} />
        <Board p={p} />
        <ArgumentBeat p={p} />
        <ObjectionBeat p={p} reduced={reduced} />
        <RulingBeat p={p} />
        <AgentsBeat p={p} />
        <RecordBeat p={p} />

        <Lockup p={p} n={2} beat="agree" title="Agreeable.">
          Ask an AI about a big decision and it tends to agree with you. That is not advice. It is an echo.
        </Lockup>
        <Lockup p={p} n={3} beat="evidence" title="Evidence.">
          A trial starts with your evidence: the documents, numbers and notes. The lawyers may quote nothing else.
        </Lockup>
        <Lockup p={p} n={4} beat="argument" title="Argument.">
          Defense says yes, Prosecution says no. Each speaks three times: opening, reply, closing. Every claim points at your evidence.
        </Lockup>
        <Lockup p={p} n={5} beat="objection" title="Caught.">
          The app checks every quote against your evidence. This one is not there, so the other lawyer objects and everything stops.
        </Lockup>
        <Lockup p={p} n={6} beat="ruling" title="Your call.">
          You are the judge. Agree or disagree with each objection, remove evidence, add a surprise, or question either lawyer.
        </Lockup>
        <Lockup p={p} n={7} beat="agents" title="Agents.">
          Everything you can do here, an AI agent can do too. Agents suggest. You approve.
        </Lockup>
        <Lockup p={p} n={8} beat="record" title="Decision." hold>
          Your verdict becomes a short write-up: the best case for and against, and when to look at it again.
        </Lockup>

        {/* Stage counter, like a film reel. */}
        <div
          className="pointer-events-none absolute right-5 top-[86px] font-mono text-[11px] tracking-[0.18em] text-foreground/45 sm:right-10"
          style={{ opacity: ss(0.08, 0.11, p) }}
          aria-hidden="true"
        >
          {String(beatIndex + 1).padStart(2, "0")} / 08
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-px bg-brass/70"
          style={{ transform: `scaleX(${p})`, transformOrigin: "left" }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Background plates                                                         */
/* ------------------------------------------------------------------------- */

function Photo({ src, style, className }: { src: string; style?: CSSProperties; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      decoding="async"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
      className={cn("absolute inset-0 h-full w-full object-cover will-change-transform", className)}
      style={style}
    />
  );
}

function Plates({ p }: { p: number }) {
  const hero = 1 - ss(0.08, 0.12, p);
  const desk = win(p, BEAT.agree.a, BEAT.agree.b, 0.03);
  const felt = win(p, BEAT.evidence.a, BEAT.argument.b, 0.03) + ss(0.885, 0.91, p);
  const warm = ss(0.9, 0.96, p);
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Colour fields: each beat has its own bright ground, cross-dissolved on the clock. */}
      {FIELDS.map((f, i) => (
        <div
          key={f.beat}
          className="absolute inset-0"
          style={{
            background: f.color,
            opacity: i === 0 ? 1 : win(p, BEAT[f.beat].a, BEAT[f.beat].b, 0.03, f.beat === "record"),
          }}
        />
      ))}
      <Photo
        src={IMAGES.columns}
        style={{ opacity: 0.3 * hero, transform: `scale(${1.08 + p * 1.4})`, filter: "grayscale(1) contrast(1.15)", mixBlendMode: "multiply" }}
      />
      <Photo
        src={IMAGES.desk}
        style={{
          opacity: 0.32 * desk,
          transform: `scale(${1.12 - ss(BEAT.agree.a, BEAT.agree.b, p) * 0.08})`,
          filter: "grayscale(1) contrast(1.1)",
          mixBlendMode: "multiply",
        }}
      />
      <div className="film-felt absolute inset-0" style={{ opacity: Math.min(1, felt) }} />
      {/* The anchor scene changes light at the end: the same board, warm lamp light. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: warm,
          background:
            "radial-gradient(60% 55% at 62% 30%, hsl(52 100% 62% / 0.45), transparent 70%)",
        }}
      />
      {/* Cold blue light for the objection. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: win(p, BEAT.objection.a, BEAT.objection.b, 0.03),
          background: "radial-gradient(50% 50% at 50% 45%, hsl(8 82% 55% / 0.10), transparent 70%)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Beat 1: the hero, a depth sandwich                                        */
/* ------------------------------------------------------------------------- */

function Hero({ p, enterHref, sampleHref }: { p: number; enterHref: string; sampleHref: string }) {
  const recede = ss(0, 0.1, p);
  const show = 1 - ss(0.085, 0.115, p);
  const ui = 1 - ss(0.0, 0.035, p);
  return (
    <div className="absolute inset-0" style={{ opacity: show, pointerEvents: show < 0.3 ? "none" : undefined }}>
      {/* Middle layer: the wordmark. It recedes the way Assayer's does. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-4">
        <h1
          className="font-didone select-none whitespace-nowrap text-center font-black leading-[0.8] text-foreground"
          style={{
            fontSize: "clamp(60px, 13.2vw, 250px)",
            letterSpacing: `${lerp(-0.03, 0.05, recede)}em`,
            transform: `scale(${lerp(1, 0.74, recede)})`,
            opacity: lerp(1, 0.2, recede),
          }}
        >
          Objection<span className="text-stamp">!</span>
        </h1>
        <div className="flex flex-col items-center gap-7" style={{ opacity: ui, transform: `translateY(${recede * 40}px)` }}>
          <p className="max-w-[600px] text-center text-[19px] leading-relaxed text-foreground/75">
            Put the decision on trial. Two AI lawyers argue it from your own evidence, every quote is checked, and you are the judge.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={sampleHref}
              className="inline-flex min-h-12 items-center rounded-full bg-foreground px-7 text-[15px] font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Watch a demo trial
            </a>
            <a
              href={enterHref}
              className="inline-flex min-h-12 items-center rounded-full border border-foreground/20 px-7 text-[15px] font-semibold text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              New case
            </a>
          </div>
        </div>
      </div>

      {/* Front layer: exhibits drift over the letters and leave faster than the wordmark. */}
      <FloatingPaper
        className="left-[4%] top-[14%] hidden w-[230px] md:block"
        style={{ transform: `translateY(${-p * 1600}px) rotate(-8deg)` }}
        letter="A"
        title="Current data model"
        line="Orders, users and payments are joined by hand in application code."
      />
      <FloatingPaper
        className="bottom-[12%] right-[5%] hidden w-[250px] md:block"
        style={{ transform: `translateY(${-p * 2400}px) rotate(6deg)` }}
        letter="B"
        title="Launch timeline"
        line="Public launch is 18 November. Code freeze is 11 November."
      />
      <FloatingPaper
        className="right-[16%] top-[9%] hidden w-[190px] lg:block"
        style={{ transform: `translateY(${-p * 1100}px) rotate(-3deg)`, opacity: 0.85 }}
        letter="C"
        title="Team availability"
        line="Our only backend developer is out all of next week."
      />

      <div
        className="absolute inset-x-0 bottom-7 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-foreground/40"
        style={{ opacity: ui }}
      >
        Scroll
      </div>
    </div>
  );
}

function FloatingPaper({
  className,
  style,
  letter,
  title,
  line,
}: {
  className?: string;
  style?: CSSProperties;
  letter: string;
  title: string;
  line: string;
}) {
  return (
    <div aria-hidden="true" className={cn("exhibit-paper absolute rounded-xl p-4", className)} style={style}>
      <span className="font-mono text-[10px] font-semibold tracking-[0.16em]">EVIDENCE {letter}</span>
      <p className="mt-1.5 font-serif text-[21px] leading-tight">{title}</p>
      <p className="mt-1 text-[12px] leading-snug text-paper-muted">{line}</p>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* The lockup: one huge word, a thin rule, a short caption. Same place every */
/* frame.                                                                    */
/* ------------------------------------------------------------------------- */

function Lockup({
  p,
  n,
  beat,
  title,
  hold,
  children,
}: {
  p: number;
  n: number;
  beat: keyof typeof BEAT;
  title: string;
  hold?: boolean;
  children: ReactNode;
}) {
  const { a, b } = BEAT[beat];
  const o = win(p, a + 0.008, b, 0.02, hold);
  if (o <= 0.001) return null;
  const rise = (1 - ss(a, a + 0.035, p)) * 28;
  return (
    <div
      className="pointer-events-none absolute bottom-8 left-4 right-4 sm:bottom-14 sm:left-10 sm:right-auto sm:max-w-[600px]"
      style={{ opacity: o, transform: `translateY(${rise}px)` }}
    >
      <span className="font-mono text-[11px] tracking-[0.2em] text-stamp">{String(n).padStart(2, "0")}</span>
      <h2
        className={cn(
          "mt-1 font-didone font-black leading-[0.86] tracking-[-0.03em] text-foreground",
          title === "Objection!" && "font-serif font-normal italic text-brass",
        )}
        style={{ fontSize: "clamp(54px, 7vw, 118px)" }}
      >
        {title}
      </h2>
      <div className="my-4 h-px w-24 bg-brass/70" />
      <p className="max-w-[460px] text-[16px] leading-relaxed text-foreground/75 sm:text-[17px]">{children}</p>
    </div>
  );
}

/** The area where each beat's picture sits: right of the lockup on wide screens, above it on phones. */
function Visual({ o, children, className }: { o: number; children: ReactNode; className?: string }) {
  if (o <= 0.001) return null;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-4 top-[86px] bottom-[46%] flex items-center justify-center sm:inset-x-10 lg:bottom-[8%] lg:left-[46%] lg:right-[4%] lg:top-[12%]",
        className,
      )}
      style={{ opacity: o }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Beat 2: the agreeable assistant                                           */
/* ------------------------------------------------------------------------- */

const ECHO =
  "Great idea! Postgres is a fantastic choice, and migrating now sets you up for scale. I'd go for it.";

function AgreeBeat({ p }: { p: number }) {
  const o = win(p, BEAT.agree.a, BEAT.agree.b, 0.025);
  const t = ss(BEAT.agree.a + 0.02, BEAT.agree.a + 0.07, p);
  const strike = ss(BEAT.agree.a + 0.075, BEAT.agree.a + 0.095, p);
  const typed = ECHO.slice(0, Math.round(ECHO.length * t));
  return (
    <Visual o={o}>
      <div className="film-glass relative w-full max-w-[560px] rounded-[26px] p-6 sm:p-8">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-foreground/10 px-4 py-3 text-[15px] text-foreground/90">
          Should we migrate to Postgres three weeks before launch?
        </div>
        <div className="relative mt-5 max-w-[92%]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/45">A typical assistant</span>
          <p className="mt-1.5 text-[18px] leading-relaxed text-foreground/85">
            {typed}
            {t < 1 && <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-1 bg-brass" />}
          </p>
          <svg className="pointer-events-none absolute inset-x-0 top-1/2 h-6 w-full overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
            <line x1="0" y1="5" x2={100 * strike} y2="5" stroke="hsl(8 82% 48%)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <span
          className="film-stamp absolute -bottom-5 right-6 rotate-[-8deg] rounded-md px-3 py-1.5 font-mono text-[13px] font-bold text-failed"
          style={{ opacity: strike, transform: `rotate(-8deg) scale(${lerp(1.6, 1, strike)})` }}
        >
          Not evidence
        </span>
      </div>
    </Visual>
  );
}

/* ------------------------------------------------------------------------- */
/* The anchor scene: the evidence board (beats 3, 4, and 8 return to it)     */
/* ------------------------------------------------------------------------- */

const BOARD = [
  { letter: "A", title: "Current data model", line: "Orders, users and payments are joined by hand in application code in three places.", rot: -2.5 },
  { letter: "B", title: "Launch timeline", line: "Public launch is 18 November. That leaves 21 days from today.", rot: 1.8 },
  { letter: "C", title: "Team availability", line: "Our only backend developer, Tola, is out all of next week.", rot: -1.2 },
];

function Board({ p }: { p: number }) {
  const inEvidence = win(p, BEAT.evidence.a, BEAT.argument.b, 0.025);
  const inRecord = ss(BEAT.record.a, BEAT.record.a + 0.025, p);
  const o = Math.max(inEvidence, inRecord);
  // In the argument beat the board shrinks to make room for the benches.
  const shrink = ss(BEAT.argument.a, BEAT.argument.a + 0.04, p) * (1 - inRecord);
  const scale = lerp(1, 0.66, shrink) * lerp(1, 0.86, inRecord);
  return (
    <Visual o={o}>
      <div
        className="grid w-full max-w-[620px] grid-cols-3 gap-3 sm:gap-4"
        style={{ transform: `scale(${scale}) translateY(${inRecord * -40 + shrink * 90}px)`, filter: `brightness(${lerp(1, 0.55, inRecord)})` }}
      >
        {BOARD.map((e, i) => {
          const drop = ss(BEAT.evidence.a + 0.02 + i * 0.022, BEAT.evidence.a + 0.045 + i * 0.022, p);
          const cited = citeGlow(p, e.letter);
          return (
            <div
              key={e.letter}
              className="exhibit-paper relative rounded-xl p-3 sm:p-4"
              style={{
                opacity: Math.max(drop, inRecord),
                transform: `translateY(${(1 - Math.max(drop, inRecord)) * -120}px) rotate(${e.rot * Math.max(drop, inRecord)}deg)`,
                boxShadow: cited
                  ? `0 0 0 3px hsl(52 100% 55% / ${cited}), 0 0 40px hsl(52 100% 55% / ${cited * 0.8})`
                  : undefined,
              }}
            >
              <span className="font-mono text-[9px] font-semibold tracking-[0.16em] sm:text-[10px]">EVIDENCE {e.letter}</span>
              <p className="mt-1 font-serif text-[16px] leading-tight sm:text-[21px]">{e.title}</p>
              <p className="mt-1 hidden text-[12px] leading-snug text-paper-muted sm:block">{e.line}</p>
            </div>
          );
        })}
      </div>
    </Visual>
  );
}

/** How brightly an exhibit glows while counsel cites it in the argument beat. */
function citeGlow(p: number, letter: string) {
  const a = BEAT.argument.a;
  if (letter === "A") return win(p, a + 0.05, a + 0.1, 0.012);
  if (letter === "B") return win(p, a + 0.085, a + 0.135, 0.012);
  return 0;
}

/* ------------------------------------------------------------------------- */
/* Beat 4: counsel argue                                                     */
/* ------------------------------------------------------------------------- */

function ArgumentBeat({ p }: { p: number }) {
  const { a, b } = BEAT.argument;
  const o = win(p, a + 0.01, b, 0.022);
  const d = ss(a + 0.015, a + 0.05, p);
  const pr = ss(a + 0.055, a + 0.09, p);
  const tickA = ss(a + 0.06, a + 0.07, p);
  const tickB = ss(a + 0.095, a + 0.105, p);
  return (
    <Visual o={o}>
      <div className="relative flex h-full w-full items-start justify-between gap-4 pt-2">
        <CounselCard
          side="defense"
          style={{ opacity: d, transform: `translateX(${(1 - d) * -60}px)` }}
          claim="Your data is already relational."
          quote="Orders, users and payments are joined by hand"
          exhibit="A"
          tick={tickA}
        />
        <CounselCard
          side="prosecution"
          style={{ opacity: pr, transform: `translateX(${(1 - pr) * 60}px)` }}
          claim="Twenty-one days is the worst window."
          quote="That leaves 21 days from today"
          exhibit="B"
          tick={tickB}
        />
      </div>
    </Visual>
  );
}

function CounselCard({
  side,
  style,
  claim,
  quote,
  exhibit,
  tick,
}: {
  side: "defense" | "prosecution";
  style: CSSProperties;
  claim: string;
  quote: string;
  exhibit: string;
  tick: number;
}) {
  return (
    <div
      className={cn(
        "film-glass w-[48%] max-w-[300px] rounded-2xl p-4",
        side === "defense" ? "border-defense/40" : "border-prosecution/40",
      )}
      style={style}
    >
      <span className={cn("font-mono text-[10px] uppercase tracking-[0.2em]", side === "defense" ? "text-defense" : "text-prosecution")}>
        {side}
      </span>
      <p className="mt-1.5 font-display text-[15px] font-semibold leading-snug sm:text-[17px]">{claim}</p>
      <p className="mt-2 font-serif text-[14px] italic leading-snug text-foreground/70 sm:text-[15px]">"{quote}"</p>
      <span
        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-paper px-2 py-1 font-mono text-[10.5px] font-medium text-paper-ink ring-1 ring-line"
        style={{ opacity: 0.5 + tick * 0.5 }}
      >
        Evidence {exhibit}
        <IconCheck className="size-3.5 text-verified-ink" strokeWidth={2.6} style={{ opacity: tick, transform: `scale(${lerp(0.4, 1, tick)})` }} />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Beat 5: the one big effect. The false quote dissolves into "Objection!"  */
/* ------------------------------------------------------------------------- */

const FALSE_QUOTE = "“A full migration is a three-week job.”";

interface Particle {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  delay: number;
  swirl: number;
  size: number;
}

function sampleText(
  text: string,
  font: string,
  w: number,
  h: number,
  cx: number,
  cy: number,
  maxWidth: number,
  step: number,
): [number, number][] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (!g) return [];
  g.font = font;
  g.textAlign = "center";
  g.textBaseline = "middle";
  // Shrink to fit.
  let size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? "40");
  while (g.measureText(text).width > maxWidth && size > 10) {
    size *= 0.92;
    g.font = font.replace(/\d+(?:\.\d+)?px/, `${size}px`);
  }
  g.fillStyle = "#fff";
  g.fillText(text, cx, cy);
  const data = g.getImageData(0, 0, w, h).data;
  const pts: [number, number][] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if ((data[(y * w + x) * 4 + 3] ?? 0) > 128) pts.push([x, y]);
    }
  }
  return pts;
}

/** Seeded random so the picture is the same on every visit. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function ObjectionBeat({ p, reduced }: { p: number; reduced: boolean }) {
  const { a, b } = BEAT.objection;
  const o = win(p, a + 0.005, b, 0.025);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const [ready, setReady] = useState(false);
  const pRef = useRef(p);
  pRef.current = p;

  // Build the two shapes once fonts are in.
  useEffect(() => {
    let cancelled = false;
    const build = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        await Promise.all([
          document.fonts.load('italic 200px "Instrument Serif"'),
          document.fonts.load('500 40px "Google Sans Flex Variable"'),
        ]);
      } catch {
        // Fall back to whatever font is available.
      }
      if (cancelled) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const wide = w >= 1024;
      const cx = wide ? w * 0.7 : w * 0.5;
      const cy = wide ? h * 0.42 : h * 0.3;
      const maxW = wide ? w * 0.48 : w * 0.88;
      const step = w < 640 ? 3 : 4;
      const A = sampleText(FALSE_QUOTE, '500 40px "Google Sans Flex Variable", sans-serif', w, h, cx, cy, maxW, step);
      const B = sampleText("Objection!", 'italic 240px "Instrument Serif", serif', w, h, cx, cy, maxW * 1.05, step);
      if (A.length === 0 || B.length === 0) return;
      const r = rng(7);
      const n = Math.min(3600, Math.max(A.length, B.length));
      const list: Particle[] = [];
      for (let i = 0; i < n; i++) {
        const pa = A[Math.floor(r() * A.length)]!;
        const pb = B[i % B.length]!;
        list.push({
          ax: pa[0],
          ay: pa[1],
          bx: pb[0],
          by: pb[1],
          delay: r() * 0.35,
          swirl: (r() - 0.5) * 2,
          size: 1.3 + r() * 1.5,
        });
      }
      particles.current = list;
      setReady(true);
    };
    void build();
    const onResize = () => void build();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Draw every frame while the beat is on screen.
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      const g = canvas?.getContext("2d");
      if (canvas && g) {
        const dpr = canvas.width / Math.max(1, canvas.clientWidth);
        const pp = pRef.current;
        const vis = win(pp, a + 0.005, b, 0.025);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        if (vis > 0.001) {
          g.globalCompositeOperation = "source-over";
          const t = reduced ? (pp > a + 0.07 ? 1 : 0) : ss(a + 0.045, a + 0.11, pp);
          const shake = reduced ? 0 : win(pp, a + 0.03, a + 0.05, 0.006) * 3;
          for (const q of particles.current) {
            const local = clamp01((t - q.delay) / 0.65);
            const e = local < 0.5 ? 4 * local ** 3 : 1 - (-2 * local + 2) ** 3 / 2;
            const arc = Math.sin(Math.PI * e) * 120 * q.swirl;
            const x = lerp(q.ax, q.bx, e) + arc + (Math.random() - 0.5) * shake;
            const y = lerp(q.ay, q.by, e) + Math.sin(Math.PI * e) * 40 * q.swirl;
            // Ink while it is the quote, vermilion as it fails, cobalt as Defense's objection.
            const failing = win(pp, a + 0.028, a + 0.06, 0.008);
            const hue = lerp(lerp(24, 8, failing), 226, e);
            const sat = lerp(lerp(18, 82, failing), 86, e);
            const light = lerp(lerp(10, 48, failing), 46, e);
            g.fillStyle = `hsla(${hue} ${sat}% ${light}% / ${vis})`;
            g.fillRect(x, y, q.size, q.size);
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ready, a, b, reduced]);

  const failing = win(p, a + 0.028, a + 0.075, 0.008);
  return (
    <div className="pointer-events-none absolute inset-0" style={{ opacity: o > 0.001 ? 1 : 0 }} aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* HUD: what the court's code found. */}
      <div
        className="absolute left-4 right-4 top-[52%] sm:left-auto sm:right-10 sm:top-[62%] sm:w-[440px]"
        style={{ opacity: o * ss(a + 0.03, a + 0.045, p) }}
      >
        <div className="film-glass rounded-xl p-4 font-mono text-[11.5px] leading-relaxed">
          <div className="text-foreground/50">verify.ts</div>
          <div className="mt-1 text-foreground/85">quote: "a full migration is a three-week job"</div>
          <div className="text-foreground/85">exhibit: B, Launch timeline</div>
          <div className="mt-1 flex items-center gap-1.5 text-failed" style={{ opacity: 0.4 + failing * 0.6 }}>
            <IconX className="size-3.5" strokeWidth={2.6} /> not found in the exhibit text
          </div>
          <div className="mt-1 font-semibold text-defense" style={{ opacity: ss(a + 0.08, a + 0.1, p) }}>
            objection raised by Defense, court paused
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Beat 6: rulings, as stamped documents                                     */
/* ------------------------------------------------------------------------- */

const RULINGS = [
  {
    stamp: "Sustained",
    tone: "text-failed-ink",
    title: "Thrown out",
    body: "Prosecution's \"three-week job\" was not in Evidence B. It stops counting.",
    rot: -9,
    x: -18,
  },
  {
    stamp: "Overruled",
    tone: "text-defense-ink",
    title: "The statement stands",
    body: "Defense called an estimate a guess. You disagreed, so the statement stays and Defense lost a point.",
    rot: 4,
    x: 6,
  },
  {
    stamp: "Yes, with conditions",
    tone: "text-prosecution-ink",
    title: "The verdict",
    body: "Do not migrate before launch. Move orders and payments in the first sprint after.",
    rot: -2,
    x: 26,
  },
];

function RulingBeat({ p }: { p: number }) {
  const { a, b } = BEAT.ruling;
  const o = win(p, a + 0.008, b, 0.022);
  const [spread, setSpread] = useState(220);
  useEffect(() => {
    const on = () => setSpread(window.innerWidth < 640 ? 0 : Math.min(250, window.innerWidth * 0.17));
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return (
    <Visual o={o}>
      <div className="relative h-[300px] w-full max-w-[760px] sm:h-[360px]">
        {RULINGS.map((r, i) => {
          const t = ss(a + 0.015 + i * 0.025, a + 0.04 + i * 0.025, p);
          const stamp = ss(a + 0.03 + i * 0.025, a + 0.045 + i * 0.025, p);
          return (
            <div
              key={r.stamp}
              className="exhibit-paper absolute left-1/2 top-1/2 w-[min(72vw,270px)] rounded-xl p-4 sm:p-5"
              style={{
                opacity: t,
                transform: `translate(calc(-50% + ${(i - 1) * spread * t}px), calc(-50% + ${(1 - t) * 80 + (i - 1) * (spread === 0 ? 100 : 18)}px)) rotate(${r.rot * t * (spread === 0 ? 0.4 : 1)}deg)`,
                zIndex: i,
              }}
            >
              <span className="font-mono text-[9.5px] tracking-[0.18em] text-paper-muted">OBJECTION! COURT, CASE 74AFF7</span>
              <p className="mt-2 font-serif text-[21px] leading-tight sm:text-[24px]">{r.title}</p>
              <p className="mt-1.5 hidden text-[13px] leading-snug text-paper-muted sm:block">{r.body}</p>
              <span
                className={cn("film-stamp absolute -right-3 -top-4 rounded px-2.5 py-1 font-mono text-[12px] font-bold", r.tone)}
                style={{ opacity: stamp, transform: `rotate(${8 - i * 5}deg) scale(${lerp(1.8, 1, stamp)})` }}
              >
                {r.stamp}
              </span>
            </div>
          );
        })}
      </div>
    </Visual>
  );
}

/* ------------------------------------------------------------------------- */
/* Beat 7: agents, one action on every surface                               */
/* ------------------------------------------------------------------------- */

const CALL_LINES = [
  "submit-argument",
  "{",
  '  "side": "prosecution",',
  '  "claim": "Launch first, migrate after.",',
  '  "citations": [{ "exhibit": "B",',
  '    "quote": "A full migration is a three-week job" }]',
  "}",
];
const REPLY_LINES = [
  "{",
  '  "failedCitations": ["... does not appear in Exhibit B"],',
  '  "objection": { "grounds": "misquotes_the_record",',
  '                 "raisedBy": "defense", "origin": "court" },',
  '  "message": "The court pauses for the judge."',
  "}",
];

function AgentsBeat({ p }: { p: number }) {
  const { a, b } = BEAT.agents;
  const o = win(p, a + 0.008, b, 0.022);
  const callT = ss(a + 0.015, a + 0.055, p);
  const replyT = ss(a + 0.06, a + 0.095, p);
  const surfaces = ["Screen", "Clerk agent", "Claude Code over MCP", "CLI"];
  return (
    <Visual o={o}>
      <div className="flex w-full max-w-[640px] flex-col gap-4">
        <div className="hidden flex-wrap gap-2 sm:flex">
          {surfaces.map((s, i) => (
            <span
              key={s}
              className="rounded-full border border-foreground/15 px-3 py-1.5 font-mono text-[11px] text-foreground/75"
              style={{ opacity: ss(a + 0.005 + i * 0.008, a + 0.02 + i * 0.008, p) }}
            >
              {s}
            </span>
          ))}
          <span className="self-center font-mono text-[11px] text-stamp" style={{ opacity: ss(a + 0.04, a + 0.05, p) }}>
            all call the same action
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <pre className="film-glass hidden whitespace-pre-wrap break-words rounded-xl p-4 sm:min-h-[170px] md:block font-mono text-[12.5px] leading-relaxed text-foreground/85">
            {revealLines(CALL_LINES, callT)}
          </pre>
          <pre className="film-glass whitespace-pre-wrap break-words rounded-xl border-defense/40 p-4 sm:min-h-[170px] font-mono text-[12.5px] leading-relaxed text-brass-strong">
            {revealLines(REPLY_LINES, replyT)}
          </pre>
        </div>
        <p className="font-mono text-[11px] text-foreground/50" style={{ opacity: ss(a + 0.09, a + 0.1, p) }}>
          Real response shape from the court's submit-argument action.
        </p>
      </div>
    </Visual>
  );
}

function revealLines(lines: string[], t: number) {
  const total = lines.join("\n");
  return total.slice(0, Math.round(total.length * t));
}

/* ------------------------------------------------------------------------- */
/* Beat 8: back to the board, now the record                                 */
/* ------------------------------------------------------------------------- */

function RecordBeat({ p }: { p: number }) {
  const { a } = BEAT.record;
  const o = ss(a + 0.01, a + 0.035, p);
  const slide = ss(a + 0.015, a + 0.06, p);
  const bar = ss(a + 0.05, a + 0.09, p);
  return (
    <Visual o={o}>
      <div
        className="exhibit-paper relative w-full max-w-[460px] rounded-2xl p-6 sm:p-7"
        style={{ transform: `translateY(${(1 - slide) * 140}px) rotate(${lerp(4, -1.5, slide)}deg)` }}
      >
        <div className="flex justify-between font-mono text-[9.5px] tracking-[0.16em] text-paper-muted">
          <span>DECISION RECORD</span>
          <span>CASE 74AFF7</span>
        </div>
        <p className="mt-3 font-display text-[19px] font-bold leading-tight tracking-tight">
          Should we migrate from MongoDB to Postgres before launch?
        </p>
        <div className="mt-4 rounded-lg bg-paper-ink p-4 text-paper">
          <span className="font-mono text-[9.5px] tracking-[0.16em] text-highlight">RULING, GRANTED IN PART</span>
          <p className="mt-1 font-serif text-[19px] leading-snug">
            Do not migrate before launch. Move orders and payments in the first sprint after, once Tola is back.
          </p>
        </div>
        <div className="mt-4">
          <div className="flex h-2 overflow-hidden rounded-full bg-paper-dim">
            <div className="h-full bg-defense-ink" style={{ width: `${55 * bar}%` }} />
            <div className="h-full flex-1" />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-paper-muted">
            <span>Defense 55%</span>
            <span>Prosecution 45%</span>
          </div>
        </div>
        <span className="mt-4 inline-flex rounded-md border border-paper-ink/20 px-2 py-1 font-mono text-[10.5px] text-paper-ink">
          decision-should-we-migrate.md
        </span>
      </div>
    </Visual>
  );
}

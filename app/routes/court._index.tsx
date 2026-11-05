import { useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { IconArrowRight, IconPlayerPlay, IconPlus } from "@tabler/icons-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { IMAGES } from "@/components/landing/Film";
import { ghostButton, primaryButton } from "@/components/court/Dialog";
import { Eyebrow, StatusChip, Wordmark } from "@/components/court/primitives";
import { cn } from "@/lib/utils";
import { CASE_TYPE_META, CASE_TYPES, DECISION_LABEL, type Decision } from "@shared/court";

export function meta() {
  return [{ title: "Docket - Objection!" }];
}

/** One bright ground per kind of decision, the same pastels the landing film uses. */
const TILE_COLOR = [
  "hsl(330 100% 87%)",
  "hsl(198 100% 84%)",
  "hsl(152 72% 80%)",
  "hsl(38 100% 78%)",
  "hsl(232 100% 89%)",
];

const STATUS_COLOR: Record<string, string> = {
  filed: "hsl(198 100% 84%)",
  in_session: "hsl(152 72% 80%)",
  deliberation: "hsl(38 100% 78%)",
  ruled: "hsl(232 100% 89%)",
};

export default function DocketRoute() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data, isLoading } = useActionQuery("list-cases");
  const sample = useActionMutation("open-sample-case", {
    onSuccess: (r) => navigate(r.path),
    onError: (e) => toast.error(e.message.replace(/^Action [\w-]+ failed: /, "")),
  });
  const cases = data?.cases ?? [];
  const ruledCount = cases.filter((c) => c.status === "ruled").length;
  const openCount = cases.length - ruledCount;

  // Arriving from the landing page's "Watch a sample trial": open one straight away.
  const opened = useRef(false);
  useEffect(() => {
    if (params.get("sample") === "1" && !opened.current) {
      opened.current = true;
      setParams({}, { replace: true });
      sample.mutate({});
    }
  }, [params, setParams, sample]);

  return (
    <div className="court-room min-h-full">
      <section className="relative isolate overflow-hidden border-b-[1.5px] border-brass bg-highlight">
        <img
          src={IMAGES.columns}
          alt=""
          aria-hidden="true"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 mix-blend-multiply grayscale"
        />
        <div className="mx-auto flex max-w-[1380px] flex-col gap-10 px-4 pb-12 pt-6 sm:px-6 lg:px-10">
          <nav className="flex items-center justify-between gap-4">
            <Link
              to="/"
              aria-label="Objection! home"
              className="rounded-full border-[1.5px] border-brass bg-bench px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-defense"
            >
              <Wordmark className="text-[22px]" />
            </Link>
            {data && !data.counsel.live && (
              <span className="max-w-[300px] text-right text-xs font-medium text-foreground/70">
                Live counsel is off until a free Groq, Gemini or OpenRouter key is set on the server.
              </span>
            )}
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
            <div className="flex min-w-0 flex-col gap-4">
              <Eyebrow className="text-foreground/70">Your docket</Eyebrow>
              <h1 className="font-didone text-[clamp(52px,8.6vw,124px)] font-normal leading-[0.9] tracking-[-0.03em]">
                The court is
                <br />
                <span className="font-serif italic text-defense">in session.</span>
              </h1>
            </div>
            <dl className="flex gap-3">
              {[
                { n: cases.length, label: "cases" },
                { n: openCount, label: "in session" },
                { n: ruledCount, label: "ruled" },
              ].map((s) => (
                <div key={s.label} className="pop-sm flex min-w-[88px] flex-col bg-bench px-4 py-3 sm:min-w-[112px]">
                  <dd className="font-didone text-[44px] leading-none tabular-nums sm:text-[56px]">{s.n}</dd>
                  <dt className="mt-1 text-xs font-semibold text-foreground/70">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/court/new" className={cn(primaryButton, "min-h-14 px-8 text-base")}>
              <IconPlus className="size-5" aria-hidden="true" /> File a case
            </Link>
            <button
              type="button"
              onClick={() => sample.mutate({})}
              disabled={sample.isPending}
              className={cn(ghostButton, "min-h-14 px-8 text-base")}
            >
              <IconPlayerPlay className="size-5" aria-hidden="true" />
              {sample.isPending ? "Opening the court…" : "Watch the sample trial"}
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1380px] flex-col gap-14 px-4 pb-24 pt-10 sm:px-6 lg:px-10">
        {/* The feature: both sides of the sample, head to head. */}
        <button
          type="button"
          onClick={() => sample.mutate({})}
          disabled={sample.isPending}
          className="pop pop-hover group relative grid overflow-hidden text-left text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-defense focus-visible:ring-offset-2 md:grid-cols-2"
          aria-label="Open the sample trial: Defense and Prosecution argue whether to migrate from MongoDB to Postgres before launch"
        >
          <span className="relative flex flex-col gap-4 bg-defense p-6 sm:p-8">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] opacity-80">
              Defense, for the motion
            </span>
            <span className="font-didone text-[clamp(26px,3vw,40px)] leading-[1.05]">
              Your data is already relational, and Mongo is making you pay for it.
            </span>
          </span>
          <span className="relative flex flex-col items-start gap-4 border-t-[1.5px] border-brass bg-prosecution p-6 sm:p-8 md:items-end md:border-l-[1.5px] md:border-t-0 md:text-right">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] opacity-80">
              Prosecution, against it
            </span>
            <span className="font-didone text-[clamp(26px,3vw,40px)] leading-[1.05]">
              Twenty-one days to launch is the worst possible window to move your data.
            </span>
          </span>
          <span className="absolute left-1/2 top-1/2 hidden size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-brass bg-highlight font-didone text-[34px] text-foreground md:flex">
            vs
          </span>
          <span className="flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] border-brass bg-bench px-6 py-4 text-foreground md:col-span-2 sm:px-8">
            <span className="text-[15px] font-medium">
              Should we migrate from MongoDB to Postgres before launch? Watch a misquote get caught.
            </span>
            <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
              Open the sample trial <IconArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </span>
        </button>

        <section className="flex flex-col gap-5" aria-labelledby="docket-heading">
          <h2 id="docket-heading" className="font-didone text-[clamp(34px,4vw,52px)] font-normal leading-none tracking-[-0.01em]">
            Cases
          </h2>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1].map((i) => (
                <span key={i} className="h-20 animate-pulse rounded-2xl bg-bench" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-[22px] border-[1.5px] border-dashed border-brass/50 bg-bench/70 p-8">
              <p className="font-didone text-3xl">The docket is empty.</p>
              <p className="max-w-[520px] text-foreground/70">
                File your first case, or open the sample trial to see how a ruling comes together.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {cases.map((c) => (
                <li key={c.id}>
                  <Link
                    to={c.status === "ruled" ? `/court/${c.id}/record` : `/court/${c.id}`}
                    style={{ "--pop": STATUS_COLOR[c.status] ?? STATUS_COLOR.filed } as CSSProperties}
                    className="pop-sm pop-hover group flex flex-wrap items-center gap-x-6 gap-y-2 bg-bench px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-defense"
                  >
                    <span className="font-mono text-[11px] tracking-[0.14em] text-foreground/60">
                      {c.id.slice(5, 11).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-[1_1_320px] font-didone text-[24px] leading-[1.1]">{c.motion}</span>
                    {c.rehearsed && <span className="text-xs font-semibold text-stamp">Sample</span>}
                    {c.decision ? (
                      <span className="text-sm font-medium">{DECISION_LABEL[c.decision as Decision]}</span>
                    ) : (
                      <span className="text-sm tabular-nums text-foreground/65">Turn {Math.min(c.turn + 1, 6)} of 6</span>
                    )}
                    <StatusChip status={c.status} />
                    <IconArrowRight
                      className="size-5 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-6" aria-labelledby="start-heading">
          <div className="flex flex-col gap-2">
            <Eyebrow>Start a case</Eyebrow>
            <h2 id="start-heading" className="font-didone text-[clamp(34px,4vw,52px)] font-normal leading-none tracking-[-0.01em]">
              What are you deciding?
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {CASE_TYPES.map((t, i) => (
              <Link
                key={t}
                to={`/court/new?type=${t}`}
                style={{ background: TILE_COLOR[i % TILE_COLOR.length] }}
                className="pop pop-hover group flex min-h-[220px] flex-col gap-3 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-defense focus-visible:ring-offset-2"
              >
                <span className="font-didone text-[44px] leading-none text-foreground/90">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-didone text-[26px] leading-[1.05]">{CASE_TYPE_META[t].label}</span>
                <span className="text-sm text-foreground/75">{CASE_TYPE_META[t].prompt}</span>
                <span className="mt-auto font-serif text-[17px] italic leading-snug text-foreground/85">
                  "{CASE_TYPE_META[t].example}"
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

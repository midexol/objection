import { useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { IconArrowRight, IconPlayerPlay, IconPlus } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { ghostButton, primaryButton } from "@/components/court/Dialog";
import { Eyebrow, StatusChip, Wordmark } from "@/components/court/primitives";
import { CASE_TYPE_META, CASE_TYPES, DECISION_LABEL, type Decision } from "@shared/court";

export function meta() {
  return [{ title: "Docket - Objection!" }];
}

export default function DocketRoute() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data, isLoading } = useActionQuery("list-cases");
  const sample = useActionMutation("open-sample-case", {
    onSuccess: (r) => navigate(r.path),
    onError: (e) => toast.error(e.message.replace(/^Action [\w-]+ failed: /, "")),
  });
  const cases = data?.cases ?? [];

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
    <div className="court-spotlight court-grain min-h-full">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-14 px-4 pb-20 pt-6 sm:px-6 lg:px-10">
        <nav className="flex items-center justify-between gap-4">
          <Link to="/" aria-label="Objection! home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">
            <Wordmark className="text-[28px]" />
          </Link>
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <Eyebrow className="text-stamp">Your docket</Eyebrow>
            <h1 className="font-display text-[clamp(40px,5.6vw,72px)] font-extrabold leading-[0.92] tracking-[-0.04em]">
              The court is <span className="highlight font-serif font-normal italic">in session.</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/court/new" className={primaryButton}>
              <IconPlus className="size-4" aria-hidden="true" /> File a case
            </Link>
            <button type="button" onClick={() => sample.mutate({})} disabled={sample.isPending} className={ghostButton}>
              <IconPlayerPlay className="size-4" aria-hidden="true" />
              {sample.isPending ? "Opening the court…" : "Sample trial"}
            </button>
          </div>
        </header>

        <section className="flex flex-col gap-5" aria-labelledby="docket-heading">
          <div className="flex items-end justify-between gap-3">
            <h2 id="docket-heading" className="font-display text-3xl font-semibold tracking-tight">
              Cases
            </h2>
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
                    {c.rehearsed && <span className="text-xs font-medium text-stamp">Sample</span>}
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

        <section className="flex flex-col gap-5" aria-labelledby="start-heading">
          <div className="flex flex-col gap-2">
            <Eyebrow>Start a case</Eyebrow>
            <h2 id="start-heading" className="font-display text-3xl font-semibold tracking-tight">
              What are you deciding?
            </h2>
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
      </div>
    </div>
  );
}

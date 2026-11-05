import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconArrowLeft, IconFileUpload, IconGavel, IconPlus, IconTrash } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { fieldClass, ghostButton, primaryButton } from "@/components/court/Dialog";
import { Eyebrow, Wordmark } from "@/components/court/primitives";
import { cn } from "@/lib/utils";
import { CASE_TYPE_META, CASE_TYPES, type CaseType } from "@shared/court";

export function meta() {
  return [{ title: "File a case - Objection!" }];
}

interface DraftExhibit {
  key: number;
  title: string;
  content: string;
  source: string;
}

let nextKey = 1;

export default function FileCaseRoute() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialType = (CASE_TYPES as readonly string[]).includes(params.get("type") ?? "")
    ? (params.get("type") as CaseType)
    : "architecture";
  const [caseType, setCaseType] = useState<CaseType>(initialType);
  const [motionText, setMotionText] = useState("");
  const [context, setContext] = useState("");
  const [exhibits, setExhibits] = useState<DraftExhibit[]>([
    { key: nextKey++, title: "", content: "", source: "" },
  ]);

  const file = useActionMutation("file-case", {
    onSuccess: (r) => navigate(r.path),
    onError: (e) => toast.error(e.message.replace(/^Action [\w-]+ failed: /, "")),
  });

  const meta = CASE_TYPE_META[caseType];
  const filled = exhibits.filter((e) => e.title.trim() && e.content.trim());
  const motionValid = motionText.trim().length >= 8;

  function update(key: number, patch: Partial<DraftExhibit>) {
    setExhibits((list) => list.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!motionValid) return;
    let motion = motionText.trim();
    if (!/[?]$/.test(motion)) motion = `${motion}?`;
    file.mutate({
      motion,
      context: context.trim(),
      caseType,
      exhibits: filled.map((e) => ({ title: e.title.trim(), content: e.content.trim(), source: e.source.trim() })),
    });
  }

  return (
    <div className="court-room min-h-full">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-10 px-4 pb-20 pt-6 sm:px-6 lg:px-10">
        <nav className="flex items-center justify-between gap-4">
          <Link
            to="/court"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          >
            <IconArrowLeft className="size-4" aria-hidden="true" /> My cases
          </Link>
          <Wordmark className="text-2xl" />
        </nav>

        <header className="flex flex-col gap-3">
          <Eyebrow className="text-stamp">New case</Eyebrow>
          <h1 className="font-display text-[clamp(40px,6vw,76px)] font-extrabold leading-[0.92] tracking-[-0.04em]">
            Ask a yes/no question.
            <br />
            <span className="highlight font-serif font-normal italic">Add what you know.</span>
          </h1>
        </header>

        <form onSubmit={submit} className="flex flex-wrap items-start gap-8">
          <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-10">
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 flex items-baseline gap-3">
                <span className="font-mono text-xs text-stamp">01</span>
                <span className="font-display text-xl font-semibold tracking-tight">What kind of decision?</span>
              </legend>
              <div role="radiogroup" className="flex flex-wrap gap-2">
                {CASE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={caseType === t}
                    onClick={() => setCaseType(t)}
                    className={cn(
                      "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass",
                      caseType === t
                        ? "border-brass bg-brass-deep text-brass-strong"
                        : "border-line-strong text-muted-foreground hover:border-brass/50 hover:text-foreground",
                    )}
                  >
                    {CASE_TYPE_META[t].label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3">
              <label htmlFor="motion" className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-stamp">02</span>
                <span className="font-display text-xl font-semibold tracking-tight">The motion, as a yes or no question</span>
              </label>
              <textarea
                id="motion"
                rows={2}
                value={motionText}
                onChange={(e) => setMotionText(e.target.value)}
                placeholder={meta.example}
                maxLength={240}
                required
                className="w-full resize-none rounded-2xl border border-line-strong bg-ink/70 px-5 py-4 font-display text-[clamp(22px,2.6vw,30px)] font-semibold leading-tight tracking-tight placeholder:font-serif placeholder:font-normal placeholder:italic placeholder:text-muted-foreground/60 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Defense argues yes. Prosecution argues no.</span>
                {!motionText && (
                  <button
                    type="button"
                    onClick={() => setMotionText(meta.example)}
                    className="min-h-8 rounded-md px-2 font-medium text-brass hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                  >
                    Use the example
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label htmlFor="context" className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-stamp">03</span>
                <span className="font-display text-xl font-semibold tracking-tight">Background</span>
                <span className="text-sm text-muted-foreground">optional</span>
              </label>
              <textarea
                id="context"
                rows={3}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Who you are, what is at stake, and any limits to keep in mind."
                maxLength={2000}
                className={cn(fieldClass, "resize-y")}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-stamp">04</span>
                  <span className="font-display text-xl font-semibold tracking-tight">Evidence</span>
                </span>
                <span className="text-sm text-muted-foreground">The lawyers can only quote what you put here.</span>
              </div>
              <AnimatePresence initial={false}>
                {exhibits.map((e, i) => (
                  <ExhibitDraft
                    key={e.key}
                    index={i}
                    exhibit={e}
                    onChange={(patch) => update(e.key, patch)}
                    onRemove={
                      exhibits.length > 1
                        ? () => setExhibits((list) => list.filter((x) => x.key !== e.key))
                        : undefined
                    }
                  />
                ))}
              </AnimatePresence>
              {exhibits.length < 12 && (
                <button
                  type="button"
                  onClick={() => setExhibits((list) => [...list, { key: nextKey++, title: "", content: "", source: "" }])}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-sm font-medium text-muted-foreground transition-colors hover:border-brass/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                >
                  <IconPlus className="size-4" aria-hidden="true" /> Add more evidence
                </button>
              )}
            </div>
          </div>

          <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 lg:sticky lg:top-6">
            <div className="rounded-[24px] border border-line bg-bench/85 p-6">
              <Eyebrow>Your case</Eyebrow>
              <p className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight">
                {motionText.trim() || <span className="font-serif font-normal italic text-muted-foreground">{meta.example}</span>}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium">{meta.label}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Evidence</dt>
                  <dd className="font-medium tabular-nums">{filled.length}</dd>
                </div>
              </dl>
              {filled.length === 0 && (
                <p className="mt-4 rounded-lg bg-brass-deep px-3 py-2 text-xs text-brass-strong">
                  With no evidence, the lawyers can only use general knowledge, and nothing will be backed by a quote.
                </p>
              )}
              <button type="submit" className={cn(primaryButton, "mt-6 w-full")} disabled={!motionValid || file.isPending}>
                <IconGavel className="size-4" aria-hidden="true" />
                {file.isPending ? "Starting…" : "Start the case"}
              </button>
            </div>
            <p className="px-2 text-xs leading-relaxed text-muted-foreground">
              You can add or remove evidence during the trial.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}

function ExhibitDraft({
  index,
  exhibit,
  onChange,
  onRemove,
}: {
  index: number;
  exhibit: DraftExhibit;
  onChange: (patch: Partial<DraftExhibit>) => void;
  onRemove: (() => void) | undefined;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const letter = String.fromCharCode(65 + index);

  async function load(f: File) {
    if (f.size > 200_000) {
      toast.error("That file is too large. Paste the part that matters instead.");
      return;
    }
    const text = await f.text();
    onChange({
      content: text.slice(0, 20000),
      source: f.name,
      title: exhibit.title || f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "),
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="exhibit-paper flex flex-col gap-3 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold tracking-[0.14em]">EVIDENCE {letter}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-paper-ink hover:bg-paper-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-ink/40"
          >
            <IconFileUpload className="size-4" aria-hidden="true" /> Load a text file
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove evidence ${letter}`}
              className="inline-flex size-9 items-center justify-center rounded-md text-paper-ink hover:bg-paper-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-ink/40"
            >
              <IconTrash className="size-4" aria-hidden="true" />
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.csv,.json,.log,.yaml,.yml,.sql,text/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f) void load(f);
              ev.target.value = "";
            }}
          />
        </div>
      </div>
      <label className="sr-only" htmlFor={`ex-${exhibit.key}-title`}>
        Evidence {letter} title
      </label>
      <input
        id={`ex-${exhibit.key}-title`}
        value={exhibit.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Title, e.g. Launch timeline"
        maxLength={140}
        className="w-full bg-transparent font-serif text-[24px] leading-tight text-paper-ink placeholder:text-paper-muted/70 focus:outline-none"
      />
      <label className="sr-only" htmlFor={`ex-${exhibit.key}-content`}>
        Exhibit {letter} text
      </label>
      <textarea
        id={`ex-${exhibit.key}-content`}
        value={exhibit.content}
        onChange={(e) => onChange({ content: e.target.value })}
        rows={4}
        placeholder="Paste the document, numbers or notes counsel may quote."
        maxLength={20000}
        className="w-full resize-y rounded-lg border border-paper-ink/15 bg-paper/60 px-3 py-2.5 text-[14px] leading-relaxed text-paper-ink placeholder:text-paper-muted/80 focus:border-paper-ink/40 focus:outline-none"
      />
      {exhibit.source && <span className="text-xs text-paper-muted">From {exhibit.source}</span>}
    </motion.div>
  );
}

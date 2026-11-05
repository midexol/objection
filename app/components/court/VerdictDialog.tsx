import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconGavel, IconPlus, IconX } from "@tabler/icons-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { DECISION_LABEL, DECISIONS, type Decision } from "@shared/court";

import { CourtDialog, fieldClass, ghostButton, primaryButton } from "./Dialog";
import { strikeGavel } from "./gavel";
import { WeightBar } from "./primitives";
import type { CaseFile } from "./types";

const DECISION_HELP: Record<Decision, string> = {
  granted: "Yes, do it.",
  granted_in_part: "Yes, with conditions or a smaller scope.",
  denied: "No, or not now.",
};

export function VerdictDialog({
  file,
  open,
  onOpenChange,
  sound,
}: {
  file: CaseFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sound: boolean;
}) {
  const navigate = useNavigate();
  const leaning: Decision =
    file.weight.defensePct >= 58 ? "granted" : file.weight.defensePct <= 42 ? "denied" : "granted_in_part";
  const [decision, setDecision] = useState<Decision>(leaning);
  const [ruling, setRuling] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) setDecision(leaning);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const deliver = useActionMutation("deliver-verdict", {
    onError: (e) => toast.error(e.message.replace(/^Action [\w-]+ failed: /, "")),
  });

  function addCondition() {
    const c = draft.trim();
    if (c.length < 3 || conditions.length >= 6) return;
    setConditions((list) => [...list, c]);
    setDraft("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    deliver.mutate(
      { caseId: file.case.id, decision, ruling: ruling.trim(), appealConditions: conditions },
      {
        onSuccess: (r) => {
          if (sound) strikeGavel(3);
          onOpenChange(false);
          navigate(r.path);
        },
      },
    );
  }

  return (
    <CourtDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Give your verdict"
      description="Pick an answer and say why in your own words. Your decision is saved as a short write-up you can share."
      className="w-[min(700px,calc(100vw-32px))]"
    >
      <WeightBar defensePct={file.weight.defensePct} />
      <form onSubmit={submit} className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Your answer to the question</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup">
            {DECISIONS.map((d) => (
              <label
                key={d}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-brass",
                  decision === d ? "border-brass bg-brass-deep" : "border-line-strong hover:border-brass/50",
                )}
              >
                <input
                  type="radio"
                  name="decision"
                  value={d}
                  checked={decision === d}
                  onChange={() => setDecision(d)}
                  className="sr-only"
                />
                <span className="font-semibold">{DECISION_LABEL[d]}</span>
                <span className="text-xs text-muted-foreground">{DECISION_HELP[d]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ruling" className="text-sm font-medium">
            Why, in your words
          </label>
          <textarea
            id="ruling"
            className={cn(fieldClass, "min-h-28 resize-y")}
            value={ruling}
            onChange={(e) => setRuling(e.target.value)}
            placeholder="Do not migrate before launch. Move orders and payments in the first sprint after launch."
            required
            minLength={4}
            maxLength={1200}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="condition" className="text-sm font-medium">
            Look at this again if… <span className="font-normal text-muted-foreground">(optional, up to 6)</span>
          </label>
          {conditions.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {conditions.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-bench-raised px-3 py-2 text-sm">
                  <span>{c}</span>
                  <button
                    type="button"
                    aria-label={`Remove condition: ${c}`}
                    onClick={() => setConditions((list) => list.filter((_, j) => j !== i))}
                    className="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                  >
                    <IconX className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              id="condition"
              className={fieldClass}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCondition();
                }
              }}
              placeholder="Launch moves later than 2 December"
              maxLength={200}
            />
            <button type="button" onClick={addCondition} className={ghostButton} aria-label="Add condition">
              <IconPlus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={ghostButton} onClick={() => onOpenChange(false)}>
            Not yet
          </button>
          <button type="submit" className={primaryButton} disabled={deliver.isPending || ruling.trim().length < 4}>
            <IconGavel className="size-4" aria-hidden="true" />
            {deliver.isPending ? "Saving…" : "Save my verdict"}
          </button>
        </div>
      </form>
    </CourtDialog>
  );
}

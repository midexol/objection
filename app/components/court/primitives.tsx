import { IconCheck, IconX } from "@tabler/icons-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  SCHEDULE,
  SIDE_LABEL,
  type Side,
} from "@shared/court";

/** The Objection! wordmark: a heavy grotesque with a brass serif bang. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-didone inline-flex items-baseline leading-none tracking-[-0.02em] text-foreground",
        className,
      )}
      aria-label="Objection!"
    >
      <span aria-hidden="true">Objection</span>
      <span aria-hidden="true" className="text-stamp">
        !
      </span>
    </span>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

const SIDE_STYLES: Record<Side, { ring: string; text: string; bg: string }> = {
  defense: {
    ring: "ring-defense/40",
    text: "text-defense",
    bg: "bg-defense-deep",
  },
  prosecution: {
    ring: "ring-prosecution/40",
    text: "text-prosecution",
    bg: "bg-prosecution-deep",
  },
};

export function sideText(side: Side) {
  return SIDE_STYLES[side].text;
}

/** Monogram seal for a counsel bench. */
export function CounselSeal({
  side,
  size = "md",
}: {
  side: Side;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg" ? "size-14 text-3xl" : size === "sm" ? "size-7 text-base" : "size-10 text-2xl";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-brass font-didone text-white",
        dims,
        side === "defense" ? "bg-defense" : "bg-prosecution",
      )}
    >
      {side === "defense" ? "D" : "P"}
    </span>
  );
}

export function SideLabel({ side, className }: { side: Side; className?: string }) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-medium uppercase tracking-[0.16em]",
        sideText(side),
        className,
      )}
    >
      {SIDE_LABEL[side]}
    </span>
  );
}

/** A verified citation chip: the exhibit letter plus a check or a cross. */
export function CitationChip({
  exhibit,
  verified,
  onClick,
}: {
  exhibit: string;
  verified: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span>Exhibit {exhibit}</span>
      {verified ? (
        <IconCheck className="size-3.5 text-verified-ink" strokeWidth={2.6} aria-label="verified" />
      ) : (
        <IconX className="size-3.5 text-failed-ink" strokeWidth={2.6} aria-label="not found in exhibit" />
      )}
    </>
  );
  const cls = cn(
    "inline-flex min-h-7 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] font-medium",
    verified
      ? "bg-paper text-paper-ink ring-1 ring-line"
      : "bg-paper-dim text-paper-ink line-through decoration-failed-ink decoration-2",
  );
  if (!onClick) return <span className={cls}>{content}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(cls, "transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass")}
    >
      {content}
    </button>
  );
}

/** Weight of argument as a two-colour bar with a sliding seam. */
export function WeightBar({
  defensePct,
  compact = false,
  caption = true,
}: {
  defensePct: number;
  compact?: boolean;
  caption?: boolean;
}) {
  const prosecutionPct = 100 - defensePct;
  return (
    <div className="flex flex-col gap-2">
      {!compact && (
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow>Weight of argument</Eyebrow>
          {caption && (
            <span className="text-xs text-muted-foreground">Scored by rule from standing, verified arguments</span>
          )}
        </div>
      )}
      <div
        className={cn(
          "relative flex overflow-hidden rounded-full bg-bench-raised",
          compact ? "h-1.5" : "h-3",
        )}
        role="img"
        aria-label={`Defense ${defensePct} percent, Prosecution ${prosecutionPct} percent`}
      >
        <motion.div
          className="h-full bg-defense"
          initial={false}
          animate={{ width: `${defensePct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
        <div className="h-full w-0.5 bg-ink" />
        <div className="h-full flex-1 bg-prosecution" />
      </div>
      {!compact && (
        <div className="flex justify-between text-sm font-medium tabular-nums">
          <span className="text-defense">Defense {defensePct}%</span>
          <span className="text-prosecution">Prosecution {prosecutionPct}%</span>
        </div>
      )}
    </div>
  );
}

/** Six-step trial progress: opening, rebuttal, closing for each side. */
export function TrialProgress({ turn }: { turn: number }) {
  return (
    <ol className="flex items-center gap-1" aria-label={`Turn ${Math.min(turn + 1, 6)} of 6`}>
      {SCHEDULE.map((slot, i) => {
        const done = i < turn;
        const current = i === turn;
        return (
          <li key={i} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "h-2.5 w-8 rounded-full border-[1.5px] transition-colors",
                done
                  ? slot.side === "defense"
                    ? "border-brass bg-defense"
                    : "border-brass bg-prosecution"
                  : current
                    ? "border-brass bg-highlight"
                    : "border-brass/30 bg-transparent",
              )}
            />
            <span className="sr-only">
              {slot.stage}, {SIDE_LABEL[slot.side]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The scoreboard: Defense in cobalt, Prosecution in vermilion, and the seam
 * between them slides as the weight of argument shifts.
 */
export function Scoreboard({ defensePct, className }: { defensePct: number; className?: string }) {
  const prosecutionPct = 100 - defensePct;
  const left = Math.min(78, Math.max(22, defensePct));
  return (
    <div
      className={cn("flex h-[60px] overflow-hidden border-y-[1.5px] border-brass sm:h-[76px]", className)}
      role="img"
      aria-label={`Weight of argument: Defense ${defensePct} percent, Prosecution ${prosecutionPct} percent`}
    >
      <motion.div
        className="flex min-w-0 items-center gap-3 bg-defense px-4 text-white sm:px-8"
        initial={false}
        animate={{ width: `${left}%` }}
        transition={{ type: "spring", stiffness: 110, damping: 20 }}
      >
        <span className="font-didone text-[34px] leading-none tabular-nums sm:text-[52px]">{defensePct}</span>
        <span className="flex flex-col font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.16em] sm:text-[11px]">
          <span>Defense</span>
          <span className="hidden opacity-80 sm:inline">for the motion</span>
        </span>
      </motion.div>
      <div className="w-[1.5px] shrink-0 bg-brass" />
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3 bg-prosecution px-4 text-white sm:px-8">
        <span className="flex flex-col items-end font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.16em] sm:text-[11px]">
          <span>Prosecution</span>
          <span className="hidden opacity-80 sm:inline">against it</span>
        </span>
        <span className="font-didone text-[34px] leading-none tabular-nums sm:text-[52px]">{prosecutionPct}</span>
      </div>
    </div>
  );
}

export function statusLabel(status: string): string {
  switch (status) {
    case "filed":
      return "Filed";
    case "in_session":
      return "In session";
    case "deliberation":
      return "Awaiting ruling";
    case "ruled":
      return "Ruled";
    default:
      return status;
  }
}

export function StatusChip({ status, paused = false }: { status: string; paused?: boolean }) {
  const label = paused ? "Court paused" : statusLabel(status);
  const tone = paused
    ? "bg-[hsl(12_100%_84%)]"
    : status === "ruled"
      ? "bg-[hsl(232_100%_88%)]"
      : status === "deliberation"
        ? "bg-[hsl(38_100%_78%)]"
        : status === "in_session"
          ? "bg-[hsl(152_72%_80%)]"
          : "bg-[hsl(198_100%_84%)]";
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-full border-[1.5px] border-brass px-3 text-xs font-semibold text-foreground",
        tone,
      )}
    >
      {label}
    </span>
  );
}

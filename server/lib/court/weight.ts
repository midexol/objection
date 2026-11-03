import type { Side } from "../../../shared/court.js";

interface WeightArgument {
  side: string;
  status: string;
  basis: string;
  citations: { verified: boolean }[];
}

interface WeightObjection {
  raisedBy: string;
  status: string;
}

/**
 * Weight of argument, computed by rule rather than by a model:
 * a standing argument from the record is worth 3, an inference 2, general
 * knowledge 1; each verified citation adds 1 (up to 3). Struck arguments count
 * for nothing. A sustained objection earns its raiser 1, an overruled one costs 1.
 */
export function computeWeight(
  args: WeightArgument[],
  objs: WeightObjection[],
): { defense: number; prosecution: number; defensePct: number } {
  const score: Record<Side, number> = { defense: 0, prosecution: 0 };
  for (const a of args) {
    if (a.status !== "standing") continue;
    const side = a.side as Side;
    const base = a.basis === "record" ? 3 : a.basis === "inference" ? 2 : 1;
    const cites = Math.min(3, a.citations.filter((c) => c.verified).length);
    score[side] += base + cites;
  }
  for (const o of objs) {
    const side = o.raisedBy as Side;
    if (!(side in score)) continue;
    if (o.status === "sustained") score[side] += 1;
    if (o.status === "overruled") score[side] = Math.max(0, score[side] - 1);
  }
  const total = score.defense + score.prosecution;
  const defensePct = total === 0 ? 50 : Math.round((score.defense / total) * 100);
  return { ...score, defensePct };
}

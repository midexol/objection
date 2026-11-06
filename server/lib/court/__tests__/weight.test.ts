import { describe, expect, it } from "vitest";

import { computeWeight } from "../weight.js";

const arg = (
  side: string,
  basis: string,
  verified: number,
  status = "standing",
) => ({
  side,
  status,
  basis,
  citations: Array.from({ length: verified }, () => ({ verified: true })),
});

describe("computeWeight", () => {
  it("starts level with no arguments", () => {
    expect(computeWeight([], [])).toMatchObject({ defense: 0, prosecution: 0, defensePct: 50 });
  });

  it("scores evidence-based arguments above inference above general knowledge", () => {
    const w = computeWeight(
      [arg("defense", "record", 0), arg("prosecution", "inference", 0), arg("prosecution", "general", 0)],
      [],
    );
    expect(w.defense).toBe(3);
    expect(w.prosecution).toBe(3);
  });

  it("adds a point per verified quote, up to three", () => {
    const w = computeWeight([arg("defense", "record", 5)], []);
    expect(w.defense).toBe(6);
  });

  it("gives thrown-out arguments no weight", () => {
    const w = computeWeight([arg("defense", "record", 2, "struck")], []);
    expect(w.defense).toBe(0);
  });

  it("rewards sustained objections and charges overruled ones", () => {
    const w = computeWeight(
      [arg("defense", "record", 0), arg("prosecution", "record", 0)],
      [
        { raisedBy: "defense", status: "sustained" },
        { raisedBy: "prosecution", status: "overruled" },
      ],
    );
    expect(w.defense).toBe(4);
    expect(w.prosecution).toBe(2);
    expect(w.defensePct).toBe(67);
  });

  it("never goes below zero", () => {
    const w = computeWeight([], [{ raisedBy: "defense", status: "overruled" }]);
    expect(w.defense).toBe(0);
  });
});

import { describe, expect, it } from "vitest";

import { quoteAppearsIn } from "../verify.js";

const EXHIBIT =
  "Public launch is 18 November. Code freeze is 11 November. That leaves 21 days, and the invoice job runs 14 queries per customer.";

describe("quoteAppearsIn", () => {
  it("accepts an exact quote", () => {
    expect(quoteAppearsIn("Code freeze is 11 November", EXHIBIT)).toBe(true);
  });

  it("ignores casing, quotes and punctuation", () => {
    expect(quoteAppearsIn('"code freeze is 11 november"', EXHIBIT)).toBe(true);
    expect(quoteAppearsIn("Public launch is 18 November!", EXHIBIT)).toBe(true);
  });

  it("tolerates one slipped word in a long quote", () => {
    expect(
      quoteAppearsIn("Public launch is 18 November. Code freeze is 12 November. That leaves 21 days", EXHIBIT),
    ).toBe(true);
  });

  it("rejects an invented quote", () => {
    expect(quoteAppearsIn("a full migration is a three-week job", EXHIBIT)).toBe(false);
  });

  it("rejects a short quote with a changed number", () => {
    expect(quoteAppearsIn("Code freeze is 25 November", EXHIBIT)).toBe(false);
  });

  it("rejects empty and very short quotes", () => {
    expect(quoteAppearsIn("", EXHIBIT)).toBe(false);
    expect(quoteAppearsIn("is", EXHIBIT)).toBe(false);
  });
});

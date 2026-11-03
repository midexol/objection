import type { Basis, Grounds } from "../../../shared/court.js";

/**
 * The rehearsed sample trial. It runs with no model key, so anyone can watch a
 * complete trial, and the recorded demo never depends on a rate limit. Its
 * citations go through the same verification as live counsel.
 */

export const REHEARSAL = {
  motion: "Should we migrate from MongoDB to Postgres before launch?",
  caseType: "architecture" as const,
  context:
    "We are a five-person team launching a B2B invoicing app. Our data started in MongoDB. Some of it now behaves like relational data.",
  exhibits: [
    {
      title: "Current data model",
      source: "schema-notes.md",
      content:
        "Seven collections: users, orgs, orders, payments, invoices, products, events. Orders, users and payments are joined by hand in application code in three places: checkout, refunds and the monthly invoice job. The invoice job runs 14 queries per customer because Mongo has no joins. Only two collections, orders and payments, hold relational data that needs foreign keys. The other five are document-shaped and work fine in Mongo.",
    },
    {
      title: "Launch timeline",
      source: "launch-plan.md",
      content:
        "Public launch is 18 November. Code freeze is 11 November. That leaves 21 days from today. The launch checklist still has 9 open items, including load testing and the payments provider review. No time is set aside for data migration.",
    },
    {
      title: "Blog post: Postgres is always faster",
      source: "https://example.com/postgres-always-wins",
      content:
        "A widely shared blog post claims Postgres is always faster than MongoDB for every workload. The post includes no benchmark of an app like ours.",
    },
  ],
} as const;

/** Suggested surprise witness for the demo; adding it changes later statements. */
export const SURPRISE_WITNESS = {
  title: "Team availability",
  source: "Judge's note",
  content:
    "Our only backend developer, Tola, is out all of next week for a family wedding. No one else on the team has written a database migration before.",
};

export interface CounselTurn {
  claim: string;
  body: string;
  reasoning: string;
  basis: Basis;
  citations: { exhibit: string; quote: string }[];
  objection?: { grounds: Grounds; explanation: string } | null | undefined;
}

interface ScriptContext {
  /** Letter of the team-availability exhibit, when the judge has admitted it. */
  witness: string | null;
  /** The judge's open question for this side, if any. */
  question: string | null;
}

export function rehearsedTurn(turn: number, ctx: ScriptContext): CounselTurn {
  const w = ctx.witness;
  const side = turn % 2 === 0 ? "defense" : "prosecution";
  const q = ctx.question ? ctx.question.replace(/\?*$/, "?") : "";
  const answer = !q
    ? ""
    : side === "defense"
      ? w
        ? `To the court's question, "${q}": we start the week Tola is back. Two collections fit before the freeze. `
        : `To the court's question, "${q}": the two collections are small enough for one engineer to move in a week. `
      : w
        ? `To the court's question, "${q}": no one. That is the prosecution's whole point. `
        : `To the court's question, "${q}": the same engineers who are closing nine launch items. `;
  switch (turn) {
    case 0:
      return {
        claim: "Your data is already relational, and Mongo is making you pay for it.",
        body: `${answer}Look at Exhibit A. Orders, users and payments are stitched together by hand in three separate places, and the invoice job fires 14 queries per customer just to do what one join would do. Every month you stay, that code grows.`,
        reasoning:
          "Exhibit A shows hand-written joins in checkout, refunds and invoicing. Hand-written joins are the cost a relational database removes.",
        basis: "record",
        citations: [
          {
            exhibit: "A",
            quote: "Orders, users and payments are joined by hand in application code in three places",
          },
          { exhibit: "A", quote: "The invoice job runs 14 queries per customer" },
        ],
      };
    case 1:
      return {
        claim: "Twenty-one days to launch is the worst possible window to move your data.",
        body: `${answer}Exhibit B: 21 days, nine open launch items, and not one hour set aside for migration. A full migration is a three-week job, so the defense is asking you to bet the launch on it.`,
        reasoning:
          "Migration risk is highest right before a freeze. The timeline has no slack, so any slip lands on launch day.",
        basis: "record",
        citations: [
          { exhibit: "B", quote: "That leaves 21 days from today" },
          { exhibit: "B", quote: "No time is set aside for data migration" },
          { exhibit: "B", quote: "A full migration is a three-week job" },
        ],
      };
    case 2:
      if (w) {
        return {
          claim: "Exhibit " + w + " changes the schedule, not the logic.",
          body: `${answer}Only two collections need to move. Exhibit ${w} tells us our developer is away next week, so we move orders and payments the week Tola is back, before the freeze, and leave the other five where they are.`,
          reasoning:
            "Exhibit A limits the scope to two collections. Exhibit " +
            w +
            " moves the start date but leaves time before the 11 November freeze in Exhibit B.",
          basis: "inference",
          citations: [
            { exhibit: "A", quote: "Only two collections, orders and payments, hold relational data" },
            { exhibit: w, quote: "is out all of next week" },
            { exhibit: "B", quote: "Code freeze is 11 November" },
          ],
        };
      }
      return {
        claim: "Only two collections move. That is days of work, not weeks.",
        body: `${answer}The prosecution talks as if the whole database moves. It does not. Exhibit A says only orders and payments are relational. Moving two collections usually takes a couple of days.`,
        reasoning:
          "Scope drives effort. Two collections out of seven is a small, bounded migration.",
        basis: "inference",
        citations: [
          { exhibit: "A", quote: "Only two collections, orders and payments, hold relational data" },
        ],
      };
    case 3:
      if (w) {
        return {
          claim: "The one person who could run this is away, and no one else has done it.",
          body: `${answer}Exhibit ${w} is decisive. No one else on this team has ever written a database migration, and the launch checklist in Exhibit B still has nine open items, including load testing. The defense's plan has no one to carry it out.`,
          reasoning:
            "A plan needs an owner. Exhibit " +
            w +
            " removes the only owner while Exhibit B shows the team is already at capacity.",
          basis: "record",
          citations: [
            {
              exhibit: w,
              quote: "No one else on the team has written a database migration before",
            },
            { exhibit: "B", quote: "The launch checklist still has 9 open items" },
          ],
          objection: null,
        };
      }
      return {
        claim: "A small migration is still a migration, three weeks before launch.",
        body: `${answer}Even two collections touch checkout and refunds, the two flows a launch cannot break. With nine items still open, including load testing, every hour spent on data is an hour not spent on launch.`,
        reasoning:
          "Exhibit A ties the two collections to checkout and refunds; Exhibit B shows the launch list is not done.",
        basis: "record",
        citations: [
          { exhibit: "A", quote: "checkout, refunds and the monthly invoice job" },
          { exhibit: "B", quote: "The launch checklist still has 9 open items, including load testing" },
        ],
        objection: {
          grounds: "speculation",
          explanation:
            "Defense says moving two collections 'usually takes a couple of days'. Nothing on the board supports that estimate.",
        },
      };
    case 4:
      return {
        claim: "Waiting is not free. Every month adds more hand-written joins to unwind.",
        body: `${answer}If launch goes well, traffic grows and the invoice job's 14 queries per customer grows with it. Migrating two collections under load is harder than migrating them now, while the data is small.`,
        reasoning:
          "Exhibit A's per-customer query cost scales with customers. The cheapest time to fix a scaling cost is before the scale arrives.",
        basis: "inference",
        citations: [{ exhibit: "A", quote: "The invoice job runs 14 queries per customer" }],
      };
    default:
      return {
        claim: "Launch first, then move two collections with the full team.",
        body: `${answer}The defense has proved Mongo is the wrong home for orders and payments. It has not proved the move must happen in the next 21 days. Five of seven collections work fine. Ship, then migrate.`,
        reasoning:
          "Exhibit A shows most of the data is fine where it is; Exhibit B shows the freeze is close. Sequencing the work removes the launch risk without giving up the migration.",
        basis: "record",
        citations: [
          { exhibit: "A", quote: "The other five are document-shaped and work fine in Mongo" },
          { exhibit: "B", quote: "Code freeze is 11 November" },
        ],
      };
  }
}

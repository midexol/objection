# Visual Design Contract

Objection! is a bright, loud-on-purpose decision court. The ground changes colour with the state of the trial, and everything sits on a graph-paper grid with hard outlines and hard shadows, like pieces of paper on a desk.

## Product mode

- Mode: `operate`
- Audience: engineering teams and individuals deciding something with real stakes.
- Primary workflow: add evidence, hear both lawyers, rule on objections, give a verdict.

## Visual direction

- **Palette:** bone ground, ink black, highlighter yellow, cobalt for Defense, vermilion for Prosecution. Each stage of the landing film and the courtroom has its own pastel ground (coral while an objection is pending, periwinkle once ruled, apricot when finished).
- **Type:** Gloock for display titles, Schibsted Grotesk for interface text, Newsreader italic for quotes, Geist Mono for small labels.
- **Shape language:** 1.5px ink outlines with hard offset shadows (`.pop`, `.pop-sm`), taped evidence cards (`.tape`), graph paper (`.grid-paper`).
- **Motion:** one scroll-driven film on the landing page; a gavel-strike takeover for objections; a split bar that shows who is ahead.
- **Wording:** plain language only. Say "evidence", "lawyers", "thrown out", "agree/disagree". No legal or developer jargon in the interface.
- **Anti-references:** dark themes, gold accents, decorative dots, icon-only navigation, legal-cosplay vocabulary.

## Accessibility

- Every colour pairing keeps text at AA contrast or better.
- Dialogs trap focus and put it on the first action; the objection takeover announces itself as a dialog.
- No horizontal scroll at 390px wide; tap targets are at least 40px.

# Objection!

**Put the decision on trial.** Two AI counsel argue your decision from your own evidence, one for and one against. Every quote they use is checked in code. You hold the gavel.

Built on [Agent-Native](https://github.com/BuilderIO/agent-native) for the Builder.io Agent-Native Hackathon.

## How a trial runs

1. **File a case.** State a yes/no motion ("Should we migrate to Postgres before launch?") and enter exhibits: docs, numbers, notes.
2. **Counsel argue.** Defense (for) and Prosecution (against) each give an opening, a rebuttal and a closing, citing exhibits word for word.
3. **Quotes are verified in code.** A quote that is not in the cited exhibit draws an automatic objection, and the court pauses until you sustain or overrule it.
4. **You intervene.** Strike exhibits, call a surprise witness, cross-examine either side. Both counsel rework their arguments around the new record.
5. **You rule.** The verdict becomes a decision record (ADR): the strongest case for and against, the dissent, and when to reopen the case. Export it as Markdown.

## Why it is agent-native

- **One action, every surface.** `submit-argument`, `add-exhibit`, `file-case` and the rest are `defineAction`s. The UI, the in-app Clerk agent, the CLI and external agents over MCP all call the same code.
- **Bring your own counsel.** Any agent, including Claude Code over MCP, can argue a side with `submit-argument`. It gets the same citation check as the built-in counsel, so no agent can sneak a fabricated quote into the record.
- **The judge stays in charge.** `add-exhibit`, `rule-objection` and `deliver-verdict` use `needsApproval` when an agent calls them. An agent can propose evidence or draft a verdict; a person approves it.
- **Shared state.** The courtroom and the Clerk read the same SQL record. The transcript shows who did each act and from which surface (ui, agent, mcp).
- **Rules, not vibes.** Citation checks, objections and the weight of argument are plain code. The model only writes the arguments.

## Run it

```bash
pnpm install
pnpm dev
```

Open the landing page and choose **Watch a sample trial**. No sign-up: visitors enter as a guest (`app/routes/guest.tsx` creates a private throwaway account), and the rehearsed sample needs no API key.

For live counsel on your own cases, set one free key in `.env`:

| Variable | Provider |
| --- | --- |
| `GROQ_API_KEY` | Groq (tried first) |
| `GEMINI_API_KEY` | Google AI Studio |
| `OPENROUTER_API_KEY` | OpenRouter free models |

Optional model overrides: `COUNSEL_GROQ_MODEL`, `COUNSEL_GEMINI_MODEL`, `COUNSEL_OPENROUTER_MODEL`.

## Deploy (Vercel)

1. Import the repo in Vercel. `vercel.json` sets everything else; leave the framework preset alone.
2. Add a Postgres database (Neon from the Vercel Marketplace sets `DATABASE_URL` for you).
3. Set `BETTER_AUTH_SECRET` (`openssl rand -hex 32`) and one counsel key (`GROQ_API_KEY`) for Production.
4. Deploy. `scripts/vercel-build.sh` builds with `NITRO_PRESET=vercel` and, on production only, runs the database migrations.

Keep Fluid Compute on (the default), so counsel turns that wait on a model are not cut off at 10 seconds. `netlify.toml` is still there if you prefer Netlify.

## Where things live

- `actions/` — the court's actions (shared by UI, agent, MCP, CLI)
- `server/lib/court/` — citation verification, weight of argument, counsel engine, rehearsed sample
- `app/routes/court.*` — docket, filing, courtroom and decision record screens

Hero photo by Tim Mus on Unsplash.

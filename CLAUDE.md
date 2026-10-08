# CLAUDE.md

Guidance for coding agents working in this repository. This file loads into every session, so it holds only what you need before touching anything.

## What this is

**Hire an Agent**, a free public tool by Varahion. A visitor writes a one-line job ad for a repetitive task and pastes one real example. An eve agent works on that example while they watch, answers up to three interview questions, and produces a shareable CV card with a "Hire this agent for real" button into Varahion's assessment.

Defining rules:

1. **Your job, not a demo script.** It always works on the visitor's own pasted example.
2. **It shows, then asks.** The agent does the work first; questions come after.
3. **It never pretends.** No connection to real systems, nothing is sent.
4. **The human hires.** The agent drafts; the person decides.

## Architecture

```
Browser (Next.js page, React, Motion)
   │  same-origin fetch, NDJSON stream back
   ▼
Next.js route handlers  (/api/work, /api/ask, /api/card)
   │  validate input · rate-limit · read signed session cookie
   │  eve Client with server-only service token
   ▼
eve agent  (agent/, mounted by withEve at /eve/v1/*)
   │  model via Vercel AI Gateway, per-session spend cap
   ▼
Model provider

Redis (Upstash; in-memory in dev): rate-limit and daily counters only
/c/[token]: shareable card page + Open Graph image from a signed token (no database)
```

## Commands

Use Node 24 (`nvm use 24`).

```bash
npm install
npm run dev                 # set EVE_ENABLED=true in .env.local to mount the agent
npm run test                # unit tests (node:test via tsx)
npm run lint && npm run typecheck
npm run build
set -a; . ./.env.local; set +a; npm run eval   # eve evals; needs AI_GATEWAY_API_KEY with credits
```

## Invariants

- **Never log or store input or output text.** Logs are JSON lines `{ ts, type, name, ok, durationMs }` only. — Pasted examples can contain customers' personal data.
- **The browser never sees `EVE_SERVICE_TOKEN` or an eve session ID.** Sessions travel in a signed httpOnly cookie. — Otherwise anyone could drive the agent without limits.
- **Limits:** job ≤ 200 chars, example ≤ 3,000, body ≤ 16 KB, 3 questions per session, 3 sessions per visitor per day, `HIRE_DAILY_SESSION_CAP` (default 300) per day, $0.05 per session, 1-hour session, 45 s turn timeout. — These cap the worst-case daily spend at about $15.
- **Share cards carry no pasted personal data** (`stripPiiFromCard` runs before signing). — Cards are public links.
- **No fake output.** If the agent is unavailable, say so and link to the Varahion assessment.
- **Vermilion `oklch(0.62 0.22 25)` only for live or agent moments.** Everything else is ink on off-white.

## Where the detail lives

| Working on | Read |
| --- | --- |
| Product decisions | [docs/brief.md](docs/brief.md) |
| Design and behaviour | [docs/superpowers/specs/2026-10-08-hire-an-agent-design.md](docs/superpowers/specs/2026-10-08-hire-an-agent-design.md) |
| Build plan | [docs/superpowers/plans/2026-10-08-hire-an-agent.md](docs/superpowers/plans/2026-10-08-hire-an-agent.md) |
| eve APIs | `node_modules/eve/docs/` (installed version is authoritative) |
| Next.js APIs | `node_modules/next/dist/docs/` |

## How we work

- One issue → one branch → one PR → one behaviour.
- Conventional commits: `feat(scope):`, `fix(scope):`, `perf:`, `refactor:`, `docs:`, `chore:`. Release notes are built from them.
- Tests first for behaviour changes. Verify in an isolated worktree, never against the live deployment.
- Agents draft, humans approve anything customer-facing, commercial or destructive.

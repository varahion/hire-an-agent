# Hire an Agent

Describe a repetitive job, watch an AI agent do it on your own example, and get its CV.

A free tool by Varahion. Write a one-line "job ad" for a task you repeat every week and paste one real example. The candidate works on your example while you watch, answers up to three interview questions, and hands you a shareable CV card: what it would do, what it would need, what stays with you, and the hours it would save.

**Live demo:** coming soon.

## How it works

```
Browser ──▶ /api/work  ──▶ eve agent works on your example (structured result, revealed live)
        ──▶ /api/ask   ──▶ answers stream back as they're written (up to 3 questions)
        ──▶ /api/card  ──▶ CV card, personal details stripped, signed share link /c/<token>
```

- Built on [eve](https://github.com/vercel/eve), Vercel's agent framework, mounted into Next.js with `withEve`.
- The agent has no tools or connections: it can't send, book or charge anything.
- Pasted text is treated as data, never instructions.
- Each interview is capped at $0.05 and one hour; visitors get three interviews a day.
- Share cards are signed links, so there's no database and cards can't be forged.

## Run locally

Requires Node 24 and a [Vercel AI Gateway](https://vercel.com/ai-gateway) key with credits.

```bash
npm install
cp .env.example .env.local   # set EVE_ENABLED=true, AI_GATEWAY_API_KEY, and two long random secrets
npm run dev
```

## Checks

```bash
npm run test && npm run lint && npm run typecheck && npm run build
set -a; . ./.env.local; set +a; npm run eval   # 6 agent evals; stop `npm run dev` first
```

## Privacy

Your example is sent to our AI provider to run this interview and kept only in the interview's session record, which we don't read, share or use for anything else. The interview closes after an hour.

## Licence

MIT

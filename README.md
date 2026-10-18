# Vara (Hire an Agent)

Teach Vara a chore. Watch it hatch a helper.

A free tool by Varahion. Tell Vara a job you repeat every week and paste one real example. Vara does the job on your example while you watch, answers up to three questions, reads back what it learned so you can fix anything (up to two changes), then hatches into your own helper with a shareable card: what it would do, what it would need, what stays with you, and the hours it would save.

**Live:** https://hire-an-agent-two.vercel.app/tools/hire-an-agent (will move to varahion.com/tools/hire-an-agent). The approved design mockup is in `docs/mockups/vara.html`.

## How it works

```
Browser ──▶ /api/work  ──▶ eve agent works on your example (structured result, revealed live)
        ──▶ /api/ask   ──▶ answers stream back as they're written (up to 3 questions)
        ──▶ /api/card  ──▶ Vara's read-back and card (optional { correction }), personal details stripped, short share link /c/<id>
```

- Built on [eve](https://github.com/vercel/eve), Vercel's agent framework, mounted into Next.js with `withEve`.
- The agent has no tools or connections: it can't send, book or charge anything.
- Pasted text is treated as data, never instructions.
- Each interview is capped at $0.05 and one hour; visitors get three interviews a day.
- Share cards are stored in Upstash under short ids (old signed links still work). Without Upstash, local dev keeps cards in memory per bundle, so the share page may not find cards made by the API.

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

# Hire an Agent: brief

Written from the founder interview on 2026-10-08. "Agreed" is decided; "Open decisions" is not.

## The problem

- **Who has it:** owners of small service businesses (a bakery, a plumbing firm, a salon) who lose hours every week to one repetitive task.
- **What it costs them today:** the hours themselves, and not being able to picture what an "AI agent" would actually do for *their* business, so they never start.
- **Why now:** agents can now do real work on messy text in seconds, but most explanations are jargon. Showing beats explaining.

## Defining rules

1. **Your job, not a demo script.** It always works on the visitor's own pasted example, never a canned one.
2. **It shows, then asks.** The agent does the work first; the questions come after.
3. **It never pretends.** No connection to real systems, nothing is sent, and it says plainly what a real agent would need.
4. **The human hires.** The agent drafts; the person decides, in the tool and in the real product.

## Version one

1. **Describe** the job: a one-line "job ad" for the task, plus one real example pasted in (an email, a message, a note).
2. **Interview** the AI candidate: it works on the example live, showing its steps, then answers questions (suggested or typed): what it needs access to, what it won't do, how it handles a tricky case.
3. **Get** the CV card: role, what it does, what it needs, what stays human, estimated time saved, shareable as an image or link, with a "Hire this agent for real" button into Varahion's free assessment.

## Feel

Live and magical: the visitor watches the agent think and work in real time on their own job. The reaction to aim for is "it just did my job."

## Not for

- Developers looking for an agent framework or API.
- Anyone who wants it connected to their real inbox or systems today (that's the paid Varahion project).

## How it makes money

- Free to use, no sign-up. It doesn't charge anything itself.
- It earns through leads: "Hire this agent for real" → Varahion's free assessment → a fixed-price pilot → a monthly service.
- Running costs are capped: a cheap, fast model, a per-visitor limit (e.g. 3 interviews a day), and a daily spend ceiling.

## Agreed

- Its own **public** repo, `varahion/hire-an-agent`, with its own deployment, linked from the Varahion site's Tools page. Each future tool follows the same pattern.
- Stack follows the playbook: Next.js, TypeScript, Tailwind/shadcn, Vercel AI SDK with swappable providers, Vercel hosting.
- Visual style matches Varahion: monochrome with the vermilion accent for "live" and "agent" moments.
- No real integrations, no sending, no accounts in v1.

## Open decisions

- **Domain:** a subdomain (e.g. `hire.varahion.com`) or a path on the main site. Varahion's domain isn't set up yet.
- **Model and provider** for v1: choose the cheapest model that passes the hard cases (benchmark with the `llm-bench` skill).
- **Privacy wording:** pasted examples may contain customer details. Decide retention (proposal: don't store pasted text; keep only anonymous usage counts) and what the page says about it.
- **Exact limits:** interviews per visitor per day and the daily spend ceiling.
- **Card sharing format:** image download, a shareable link, or both.
- **What the assessment receives:** pass the job ad (not the pasted example) into Varahion's assessment form, and how.

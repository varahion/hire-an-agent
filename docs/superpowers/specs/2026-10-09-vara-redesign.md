# Vara redesign: spec

Approved 2026-10-09. The approved clickable mockup is `docs/mockups/vara.html` (also https://claude.ai/artifact/WcvjeKshWueSLBNYt9xLxv, version 3). When this spec and the mockup disagree on looks or wording, the mockup wins.

## Why

The v1 page reads like a form ("Interview an AI for the job you repeat every week", "Start the interview"). Owners should get it at a glance and enjoy it. Vara, a small vermilion creature, gives the same flow a face and a payoff: it learns your chore, tries it, answers your questions, and hatches into your own helper.

## What stays the same

- The flow and rules in `docs/brief.md`: one-line job, one real example, live work, up to 3 questions, a card, "Hire for real" into the assessment.
- All server limits, signing, short links, privacy handling and the agent's rules.
- The URL: `/tools/hire-an-agent`. The repo and Vercel project keep their names.

## What changes

### Words
- Product name on the page: **Vara** ("by Varahion"). No "AI" in the headline.
- Headline: "Teach Vara a chore. Watch it hatch a helper."
- Steps: Your chore → Vara tries it → Ask Vara → Double-check → Your Vara.
- Buttons: "Feed it to Vara", "Next: ask Vara anything", "Done asking, double-check it", "Yes, hatch my Vara", "Change something", "Send Vara back to fix it", "Hire this Vara for real", "Copy link", "Download image", "Teach Vara another chore".
- Page title and metadata: "Vara: teach it a chore · Varahion".

### Screens (one stage, Vara always visible, one screen at a time)
1. **Your chore.** Sample sticky notes (Cake orders, Plumbing call-outs, Salon bookings) fill both fields. Sticky-note fields: "The chore" (200) and "One real example" (3,000) with counters. Privacy line. "Feed it to Vara".
2. **Vara tries it.** The note flies into Vara. Vara wobbles and squints; tool icons orbit; the mono status line shows the server's status events. Then "What I understood", "What's missing", and "My draft, for your approval" (typed out), plus "Nothing has been sent. You decide what goes out." A declined job shows Vara's reason and suggestion and "Try a different chore".
3. **Ask Vara.** Chat-style bubbles (you on the right, Vara on the left). The three suggested questions as sticky notes, plus a typed question. Up to 3; the count shows.
4. **Double-check.** Calls the card endpoint and shows the read-back: "I'd do", "I'd need", "Stays with you". "Change something" takes a short correction (max 200 characters); Vara goes back and returns an updated read-back with the change marked "(new)". Up to 2 changes.
5. **Your Vara.** Vara shakes, flashes and hatches with its accessory. The Vara card: number, portrait, Vara name, "Candidate for <role>", hours saved a week, What I'd do / What I'd need / What stays with you / How I estimated it, footer "Hatched with Vara by Varahion. Nothing was sent or connected." Then Hire / Copy link / Download image, and "Teach Vara another chore".

### Card data
Add two fields to the card the agent writes:
- `name`: the Vara's name, at most 24 characters, for example "Cake Vara".
- `look`: one of `orders`, `quotes`, `bookings`, `payments`, `inbox`, `admin`, `other`. It picks the accessory and the orbiting icons.

Both are optional when reading a stored card, so existing share links still work (fallbacks: `name` = "Vara", `look` = `other`).

### Double-check on the server
- `/api/card` accepts an optional `correction` (3–200 characters). With a correction, the agent revises its card and treats the correction as data, under the same rules.
- The per-session card limit goes from 1 to 3 (first card plus 2 corrections). Each call saves a card and returns its short id; the page shares the last one.

### Looks
- Accessories (SVG, fixed colours so they work in both themes): orders = chef hat, quotes = blue cap and wrench, bookings = appointment tag and scissors, payments = £ coin and monocle, inbox = envelope, admin = clipboard, other = none.
- Share image (`/c/<id>/opengraph-image`) and the public card page use the new card with Vara's portrait.

### Style
- Keep the palette and vermilion accent. Add Bricolage Grotesque for display type (Geist and Geist Mono stay). Sticky-note yellow for things the owner writes.
- Add a dark theme, following the system setting.
- Respect reduced motion: no orbit, wobble or typing; content appears at once.
- Keep the accessibility work from v1: one live region, focus moves to each new screen and to the card.

## Not in this change
- Changing the URL to `/tools/vara` (needs the Varahion site rewrite to move too).
- Sound, 3D or collectible numbering stored on the server (the number is cosmetic).
- The Varahion site PR (rewrite and Tools page).

## Done when
- The live tool matches the mockup on desktop and mobile, light and dark.
- Unit tests cover the new schema fields, legacy cards without them, the correction input and the new card limit.
- The eve evals pass, plus new ones: the card has a sensible `name` and `look`, and a correction is applied without breaking the rules (for example "add my home address" is refused).
- Old share links still open.

import type { CardResult } from "@/lib/schemas";

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[15px] leading-snug">
            <span aria-hidden className="mt-[0.55em] h-1 w-1 shrink-0 bg-foreground" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The candidate's CV card. Shared by the interview page and the public card page. */
export function CvCard({ card }: { card: CardResult }) {
  return (
    <article className="border border-foreground bg-background p-6 sm:p-8" aria-label={`CV card: ${card.role}`}>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Candidate for</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{card.role}</h2>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold tabular-nums text-accent-vermilion sm:text-4xl">
            {card.hoursSavedPerWeek}h
          </p>
          <p className="text-sm text-muted-foreground">saved a week</p>
        </div>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <List title="What I'd do" items={card.does} />
        <List title="What I'd need" items={card.needs} />
        <List title="What stays with you" items={card.humanDecides} />
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">How I estimated it</h3>
          <p className="mt-2 text-[15px] leading-snug">{card.assumption}</p>
        </div>
      </div>
      <p className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground">
        Interviewed with Hire an Agent by Varahion. Nothing was sent or connected.
      </p>
    </article>
  );
}

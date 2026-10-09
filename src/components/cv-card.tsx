import { cardNumber, withCardDefaults } from "@/lib/card-display";
import type { CardResult } from "@/lib/schemas";
import { Vara } from "./vara/vara";

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-1 text-[13px] font-medium text-muted-foreground">
        {title}
      </h3>
      <ul className="list-disc space-y-0.5 pl-4 text-sm leading-snug">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** The hatched Vara's card. Shared by the page and the public card page. */
export function CvCard({ card, id }: { card: CardResult; id: string }) {
  const vara = withCardDefaults(card);
  return (
    <article
      className="vara-pop mx-auto max-w-[460px] rounded-[18px] border-[2.5px] border-accent-vermilion bg-card p-4"
      aria-label={`Vara card: ${vara.name}, ${vara.role}`}
    >
      <div className="flex justify-between font-mono text-xs text-muted-foreground">
        <span>Vara card</span>
        <span>No. {cardNumber(id)}</span>
      </div>
      <div className="mt-2.5 flex items-center gap-3.5">
        <div className="flex-none rounded-xl bg-vara-soft p-2">
          <Vara look={vara.look} className="h-[100px] w-[84px]" label="" />
        </div>
        <div>
          <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight">
            {vara.name}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Candidate for {vara.role.toLowerCase()}
          </p>
        </div>
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <b className="font-display text-[40px] leading-none text-accent-vermilion">
          {vara.hoursSavedPerWeek}h
        </b>
        <span className="text-sm text-muted-foreground">saved a week</span>
      </p>
      <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
        <Section title="What I'd do" items={vara.does} />
        <Section title="What I'd need" items={vara.needs} />
        <Section title="What stays with you" items={vara.humanDecides} />
        <div>
          <h3 className="mb-1 text-[13px] font-medium text-muted-foreground">
            How I estimated it
          </h3>
          <p className="text-sm leading-snug">{vara.assumption}</p>
        </div>
      </div>
      <p className="mt-3.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
        Hatched with Vara by Varahion. Nothing was sent or connected.
      </p>
    </article>
  );
}

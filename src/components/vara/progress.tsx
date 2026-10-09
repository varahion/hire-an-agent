export type Stage = "chore" | "trying" | "ask" | "check" | "hatched";

const STEPS: { stages: Stage[]; label: string }[] = [
  { stages: ["chore"], label: "Your chore" },
  { stages: ["trying"], label: "Vara tries it" },
  { stages: ["ask"], label: "Ask Vara" },
  { stages: ["check"], label: "Double-check" },
  { stages: ["hatched"], label: "Your Vara" },
];

export function VaraProgress({ stage }: { stage: Stage }) {
  return (
    <ol
      className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
      aria-label="Progress"
    >
      {STEPS.map((step) => {
        const current = step.stages.includes(stage);
        return (
          <li
            key={step.label}
            aria-current={current ? "step" : undefined}
            className={current ? "font-medium text-foreground" : undefined}
          >
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { CvCard } from "@/components/cv-card";
import { HireButton } from "@/components/hire-button";
import { loadCard } from "@/lib/card";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await loadCard((await params).token);
  if (!card) return { title: "Card not found · Hire an Agent" };
  const description = `${card.does[0]} Saves about ${card.hoursSavedPerWeek} hours a week.`;
  return {
    title: `${card.role} · Hire an Agent`,
    description,
    openGraph: { title: `${card.role}: an AI candidate's CV`, description },
  };
}

export default async function CardPage({ params }: Props) {
  const card = await loadCard((await params).token);

  return (
    <main className="mx-auto max-w-[680px] px-4 pb-24 pt-10 sm:pt-16">
      <header className="flex items-baseline justify-between gap-4">
        <Link href="/" className="font-semibold tracking-tight">
          Hire an Agent
        </Link>
        <p className="text-sm text-muted-foreground">A free tool by Varahion</p>
      </header>

      {card ? (
        <div className="mt-14 space-y-8">
          <CvCard card={card} />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <HireButton role={card.role} />
            <Link href="/" className="text-sm underline underline-offset-4">
              Interview a candidate for your own job
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-14 space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            This card isn&apos;t valid.
          </h1>
          <p className="text-muted-foreground">
            The link may be incomplete or changed. You can run your own
            interview instead.
          </p>
          <Link
            href="/"
            className="inline-block bg-foreground px-5 py-3 font-medium text-background"
          >
            Start an interview
          </Link>
        </div>
      )}
    </main>
  );
}

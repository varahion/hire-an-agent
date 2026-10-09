import type { Metadata } from "next";
import Link from "next/link";
import { CvCard } from "@/components/cv-card";
import { HireButton } from "@/components/hire-button";
import { Vara } from "@/components/vara/vara";
import { loadCard } from "@/lib/card";
import { cardMeta } from "@/lib/card-display";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await loadCard((await params).token);
  if (!card) return { title: "Card not found · Vara by Varahion" };
  const meta = cardMeta(card);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.ogTitle, description: meta.description },
  };
}

export default async function CardPage({ params }: Props) {
  const { token } = await params;
  const card = await loadCard(token);

  return (
    <main className="mx-auto max-w-[720px] px-4 pb-24">
      <header className="flex items-baseline justify-between gap-3 py-5">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          Vara
        </Link>
        <p className="text-sm text-muted-foreground">by Varahion</p>
      </header>

      {card ? (
        <div className="mt-8 space-y-6">
          <CvCard card={card} id={token} />
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <HireButton role={card.role} />
            <Link
              href="/"
              className="rounded-full border-[1.5px] border-foreground px-6 py-3 font-medium"
            >
              Teach Vara your own chore
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid justify-items-center gap-4 text-center">
          <Vara className="h-[120px] w-[100px]" label="" />
          <h1 className="font-display text-3xl font-bold tracking-tight">
            This card isn&apos;t valid.
          </h1>
          <p className="text-muted-foreground">
            The link may be incomplete or changed. You can teach Vara your own
            chore instead.
          </p>
          <Link
            href="/"
            className="rounded-full bg-foreground px-6 py-3 font-medium text-background"
          >
            Teach Vara a chore
          </Link>
        </div>
      )}
    </main>
  );
}

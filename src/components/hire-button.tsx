const ASSESSMENT_URL = process.env.NEXT_PUBLIC_VARAHION_ASSESSMENT_URL;

/** "Hire this Vara for real": into Varahion's assessment, carrying only the role. */
export function HireButton({ role }: { role: string }) {
  if (!ASSESSMENT_URL) return null;
  const href = `${ASSESSMENT_URL}${ASSESSMENT_URL.includes("?") ? "&" : "?"}role=${encodeURIComponent(role)}`;
  return (
    <a
      href={href}
      className="inline-block rounded-full bg-foreground px-6 py-3 font-medium text-background"
    >
      Hire this Vara for real
    </a>
  );
}

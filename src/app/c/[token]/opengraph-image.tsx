import { ImageResponse } from "next/og";
import { ACCESSORIES } from "@/components/vara/looks";
import { loadCard } from "@/lib/card";
import { cardNumber, withCardDefaults } from "@/lib/card-display";

export const alt = "A Vara card from Vara by Varahion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f7f7f2";
const INK = "#20211f";
const MUTED = "#62635c";
// Hex equivalents of the accent oklch(0.62 0.22 25) and its soft tint; next/og doesn't parse oklch.
const VERMILION = "#e0402f";
const SOFT = "#f6dfd9";

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const raw = await loadCard(token);
  const card = raw ? withCardDefaults(raw) : null;

  return new ImageResponse(
    card ? (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: PAPER,
          color: INK,
          padding: 56,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            border: `6px solid ${VERMILION}`,
            borderRadius: 36,
            background: "#ffffff",
            padding: 44,
            gap: 44,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 300,
              background: SOFT,
              borderRadius: 24,
            }}
          >
            <svg width="225" height="270" viewBox="0 0 150 180">
              <path
                d="M75 8 C118 8 142 62 142 108 C142 150 112 172 75 172 C38 172 8 150 8 108 C8 62 32 8 75 8 Z"
                fill={VERMILION}
              />
              <ellipse cx="42" cy="122" rx="12" ry="7" fill="#b3261e" opacity="0.25" />
              <ellipse cx="108" cy="122" rx="12" ry="7" fill="#b3261e" opacity="0.25" />
              <ellipse cx="56" cy="98" rx="9" ry="11" fill={PAPER} />
              <ellipse cx="94" cy="98" rx="9" ry="11" fill={PAPER} />
              {ACCESSORIES[card.look]}
            </svg>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 24,
                color: MUTED,
              }}
            >
              <span>Vara card</span>
              <span>{`No. ${cardNumber(token)}`}</span>
            </div>
            <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -2, lineHeight: 1.1, marginTop: 6 }}>
              {card.name}
            </div>
            <div style={{ fontSize: 26, color: MUTED, lineHeight: 1.3, marginTop: 4 }}>
              {`Candidate for ${card.role.toLowerCase()}`}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 18 }}>
              <span style={{ fontSize: 68, fontWeight: 700, color: VERMILION, lineHeight: 1 }}>
                {`${card.hoursSavedPerWeek}h`}
              </span>
              <span style={{ fontSize: 28, color: MUTED }}>saved a week</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
              {card.does.slice(0, 2).map((item) => (
                <div key={item} style={{ display: "flex", gap: 14, fontSize: 24, lineHeight: 1.3 }}>
                  <span>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto", paddingTop: 16, fontSize: 20, color: MUTED }}>
              Hatched with Vara by Varahion. Nothing was sent or connected.
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PAPER,
          color: INK,
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        Vara by Varahion
      </div>
    ),
    size,
  );
}

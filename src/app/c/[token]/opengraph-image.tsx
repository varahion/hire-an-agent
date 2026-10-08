import { ImageResponse } from "next/og";
import { loadCard } from "@/lib/card";

export const alt = "An AI candidate's CV card from Hire an Agent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f7f7f2";
const INK = "#20211f";
const MUTED = "#62635c";
// Hex equivalent of the accent oklch(0.62 0.22 25); next/og doesn't parse oklch.
const VERMILION = "#e0402f";

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const card = await loadCard((await params).token);

  return new ImageResponse(
    card ? (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          color: INK,
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 26,
            color: MUTED,
          }}
        >
          <span>Candidate for</span>
          <span>Hire an Agent · Varahion</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: 12,
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 820,
            }}
          >
            {card.role}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <span
              style={{
                fontSize: 84,
                fontWeight: 700,
                color: VERMILION,
                lineHeight: 1,
              }}
            >{`${card.hoursSavedPerWeek}h`}</span>
            <span style={{ fontSize: 24, color: MUTED }}>saved a week</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 48,
            gap: 14,
          }}
        >
          {card.does.slice(0, 3).map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                fontSize: 32,
              }}
            >
              <div style={{ width: 10, height: 10, background: INK }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", fontSize: 24, color: MUTED }}>
          Nothing was sent or connected. The owner decides.
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
        Hire an Agent
      </div>
    ),
    size,
  );
}

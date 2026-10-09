import type { VaraLook } from "@/lib/schemas";
import { ACCESSORIES } from "./looks";

export type VaraMood = "hungry" | "working" | "cracking";

/** Vara: a small vermilion creature. Its mood sets the animation; its look adds an accessory. */
export function Vara({
  mood = "hungry",
  look,
  className = "",
  label = "Vara, a small round creature",
}: {
  mood?: VaraMood;
  look?: VaraLook;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 150 180"
      role="img"
      aria-label={label}
      className={`vara vara-${mood} ${className}`}
    >
      <path
        className="vara-body"
        d="M75 8 C118 8 142 62 142 108 C142 150 112 172 75 172 C38 172 8 150 8 108 C8 62 32 8 75 8 Z"
      />
      <ellipse className="vara-cheek" cx="42" cy="122" rx="12" ry="7" />
      <ellipse className="vara-cheek" cx="108" cy="122" rx="12" ry="7" />
      <ellipse className="vara-eye" cx="56" cy="98" rx="9" ry="11" />
      <ellipse className="vara-eye" cx="94" cy="98" rx="9" ry="11" />
      {look ? ACCESSORIES[look] : null}
    </svg>
  );
}

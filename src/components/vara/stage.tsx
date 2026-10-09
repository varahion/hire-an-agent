import type { LucideIcon } from "lucide-react";
import type { VaraLook } from "@/lib/schemas";
import { Vara, type VaraMood } from "./vara";

/** Vara in the middle of the page, its orbiting tools, the hatch flash and its status line. */
export function VaraStage({
  mood,
  look,
  orbit,
  status,
  flashKey,
}: {
  mood: VaraMood;
  look?: VaraLook;
  orbit: LucideIcon[] | null;
  status: string;
  /** Change it to play the hatch flash once. 0 = no flash. */
  flashKey: number;
}) {
  return (
    <div>
      <div className="relative grid min-h-[300px] place-items-center">
        {orbit && (
          <div className="vara-orbit" aria-hidden>
            {orbit.map((Icon, i) => (
              <span key={i} className="vara-tool">
                <Icon size={22} strokeWidth={1.8} />
              </span>
            ))}
          </div>
        )}
        {flashKey > 0 && <div key={flashKey} className="vara-flash" aria-hidden />}
        <Vara mood={mood} look={look} className="h-[180px] w-[150px]" />
      </div>
      <p
        className="mt-1.5 min-h-[22px] text-center font-mono text-sm text-accent-ink"
        role="status"
      >
        {status}
      </p>
    </div>
  );
}

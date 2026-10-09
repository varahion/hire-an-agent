import {
  Bell,
  Calendar,
  ClipboardList,
  Clock,
  Coins,
  Droplet,
  FileText,
  Folder,
  Inbox,
  KeyRound,
  Mail,
  MessageSquare,
  Sparkles,
  User,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { VaraLook } from "@/lib/schemas";

// Accessories are drawn inside Vara's 150×180 viewBox. Fixed colours, never
// theme tokens, so they read the same in light, dark and the share image.
const INK = "#20211f";
const WHITE = "#ffffff";
const VERMILION = "#e0402f";

export const ACCESSORIES: Record<VaraLook, ReactNode | null> = {
  // Chef hat with a cherry.
  orders: (
    <g>
      <path d="M44 40 Q75 -2 106 40 Z" fill={WHITE} stroke={INK} strokeWidth="2.5" />
      <rect x="40" y="36" width="70" height="10" rx="3" fill={WHITE} stroke={INK} strokeWidth="2.5" />
      <circle cx="75" cy="12" r="6" fill="#e05a7a" stroke={INK} strokeWidth="2" />
    </g>
  ),
  // Blue cap and a wrench.
  quotes: (
    <g>
      <path d="M32 44 Q75 6 118 44 Z" fill="#2f6fd6" stroke={INK} strokeWidth="2.5" />
      <rect x="104" y="38" width="34" height="9" rx="4" fill="#2f6fd6" stroke={INK} strokeWidth="2" />
      <g transform="translate(112 118) rotate(35)">
        <rect x="-4" y="0" width="8" height="40" rx="3" fill={WHITE} stroke={INK} strokeWidth="2.5" />
        <circle cx="0" cy="-2" r="10" fill={WHITE} stroke={INK} strokeWidth="2.5" />
        <rect x="-4" y="-14" width="8" height="10" fill={VERMILION} />
      </g>
    </g>
  ),
  // Appointment tag (clock and lines) and scissors.
  bookings: (
    <g>
      <g transform="translate(46 26) rotate(-8)">
        <rect width="58" height="22" rx="4" fill={WHITE} stroke={INK} strokeWidth="2.5" />
        {/* A tiny clock and two lines, drawn as shapes so the share image can render them. */}
        <circle cx="12" cy="11" r="6" fill="none" stroke={INK} strokeWidth="2" />
        <path d="M12 8v3l2 1.5M24 8h26M24 14h18" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(18 120) rotate(-30)" fill="none" stroke={INK} strokeWidth="2.5">
        <circle cx="0" cy="0" r="6" />
        <circle cx="14" cy="0" r="6" />
        <path d="M4 -4 L22 -26 M10 -4 L-8 -26" />
      </g>
    </g>
  ),
  // Gold £ coin and a monocle.
  payments: (
    <g>
      <g transform="translate(118 46)">
        <circle r="20" fill="#e8b93b" stroke={INK} strokeWidth="2.5" />
        {/* A £ sign as a stroke, so the share image can render it. */}
        <path d="M5 -6 Q3 -10 -1 -10 Q-5 -10 -5 -5 L-5 8 M-9 1 H3 M-9 8 H7" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx="94" cy="98" r="15" fill="none" stroke={INK} strokeWidth="2.5" />
    </g>
  ),
  // Envelope held at the side.
  inbox: (
    <g transform="translate(96 120) rotate(-12)">
      <rect width="46" height="32" rx="3" fill={WHITE} stroke={INK} strokeWidth="2.5" />
      <path d="M2 3l21 15 21-15" fill="none" stroke={INK} strokeWidth="2.5" />
    </g>
  ),
  // Clipboard held at the side.
  admin: (
    <g transform="translate(100 112) rotate(-10)">
      <rect width="34" height="42" rx="3" fill={WHITE} stroke={INK} strokeWidth="2.5" />
      <rect x="9" y="-4" width="16" height="8" rx="2" fill={INK} />
      <path d="M8 16h18M8 24h18M8 32h12" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  other: null,
};

/** The four tools that orbit Vara while it works. */
export const ORBIT_ICONS: Record<VaraLook, LucideIcon[]> = {
  orders: [Mail, User, FileText, Clock],
  quotes: [Wrench, Droplet, Calendar, FileText],
  bookings: [Calendar, User, Clock, Bell],
  payments: [Coins, FileText, Mail, Bell],
  inbox: [Mail, Inbox, User, Clock],
  admin: [ClipboardList, FileText, KeyRound, Folder],
  other: [Sparkles, FileText, Clock, MessageSquare],
};

import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type ChipTone =
  | "neutral"
  | "purple"
  | "coral"
  | "yellow"
  | "mint"
  | "blue"
  | "pink"
  | "orange";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
}

// Fundo claro + texto ink (ou purple-text) para manter contraste >= 4.5:1.
const tones: Record<ChipTone, string> = {
  neutral: "border border-line bg-white text-muted",
  purple: "bg-purple-light text-purple-text",
  coral: "bg-coral-light text-ink",
  yellow: "bg-yellow-light text-ink",
  mint: "bg-mint-light text-ink",
  blue: "bg-blue-light text-ink",
  pink: "bg-pink-light text-ink",
  orange: "bg-orange-light text-ink",
};

export function Chip({ tone = "neutral", className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-bold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

import Link from "next/link";
import { cn } from "./cn";

/** Marca Aprumo: ícone de formas coloridas (como no protótipo) e nome. */
export function Brand({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="Aprumo, página inicial"
      className={cn(
        "inline-flex items-center gap-2 rounded-sm font-display text-xl font-bold text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark",
        className,
      )}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="9" cy="9" r="7" fill="#ffc93c" />
        <circle cx="19" cy="9" r="7" fill="#ff6b5b" />
        <circle cx="9" cy="19" r="7" fill="#2ed3a0" />
        <circle cx="19" cy="19" r="7" fill="#7b5cff" />
      </svg>
      Aprumo
    </Link>
  );
}

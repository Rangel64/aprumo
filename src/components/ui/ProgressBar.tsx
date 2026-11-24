import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export interface ProgressBarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Valor atual (0 a max). */
  value: number;
  max?: number;
  /** Nome acessível, obrigatório. */
  label: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
  ...props
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = (clamped / safeMax) * 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      className={cn("h-2 w-full overflow-hidden rounded-pill bg-purple-light", className)}
      {...props}
    >
      <div
        className="h-full rounded-pill bg-purple transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

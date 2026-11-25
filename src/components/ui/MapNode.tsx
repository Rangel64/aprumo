import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type MapNodeStatus = "not_started" | "studying" | "mastered";

export interface MapNodeProps extends HTMLAttributes<HTMLDivElement> {
  status: MapNodeStatus;
  label: string;
  /** Destaque: o conteúdo foi revisado hoje. */
  reviewedToday?: boolean;
}

const statusText: Record<MapNodeStatus, string> = {
  not_started: "não iniciado",
  studying: "em estudo",
  mastered: "dominado",
};

const circle: Record<MapNodeStatus, string> = {
  not_started: "border-2 border-purple bg-white",
  studying: "border-4 border-purple bg-white",
  mastered: "border-2 border-purple bg-purple",
};

export function MapNode({
  status,
  label,
  reviewedToday = false,
  className,
  ...props
}: MapNodeProps) {
  return (
    <div
      className={cn("inline-flex flex-col items-center gap-2", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative flex size-12 items-center justify-center rounded-pill",
          circle[status],
          reviewedToday && "ring-4 ring-yellow shadow-purple",
        )}
      >
        {status === "studying" && (
          <span className="size-3 rounded-pill bg-purple" />
        )}
        {status === "mastered" && (
          <svg
            viewBox="0 0 24 24"
            className="size-6 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
      <span className="max-w-32 text-center text-sm font-bold text-ink">
        {label}
        <span className="sr-only">
          {`, ${statusText[status]}${reviewedToday ? ", revisado hoje" : ""}`}
        </span>
      </span>
    </div>
  );
}

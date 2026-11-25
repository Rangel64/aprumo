import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-lg bg-white p-6 shadow-card", className)}
      {...props}
    />
  );
}

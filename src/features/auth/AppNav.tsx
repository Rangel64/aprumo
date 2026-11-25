"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";

// "Redação" não consta no menu do protótipo; entra por pedido da T3 (RF da faixa D).
const ITEMS = [
  { href: ROUTES.dashboard, label: "Início" },
  { href: ROUTES.schedule, label: "Cronograma" },
  { href: ROUTES.journey, label: "Jornadas" },
  { href: ROUTES.map(), label: "Mapa" },
  { href: ROUTES.review, label: "Revisões" },
  { href: ROUTES.essay, label: "Redação" },
] as const;

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";

/** Menu lateral (desktop) e barra inferior (celular), no mesmo `<nav>`. */
export function AppNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white",
        "md:static md:z-auto md:border-t-0 md:bg-transparent",
      )}
    >
      <ul className="grid grid-cols-6 gap-0.5 p-1 md:flex md:flex-col md:gap-1 md:p-0">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-md px-0.5 py-3 text-center text-[11px] font-bold",
                  "md:px-4 md:py-3 md:text-left md:text-base",
                  active ? "bg-purple-light text-purple-text" : "text-muted hover:bg-purple-light",
                  focus,
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

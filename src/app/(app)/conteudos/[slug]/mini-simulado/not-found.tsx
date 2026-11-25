import Link from "next/link";
import { ROUTES } from "@/contracts/routes";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="font-display text-3xl font-bold text-ink">Mini-simulado não encontrado</h1>
      <p className="text-muted">Este mini-simulado não existe ou foi removido.</p>
      <Link
        href={ROUTES.map()}
        className="font-bold text-purple-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark"
      >
        Voltar ao Mapa
      </Link>
    </div>
  );
}

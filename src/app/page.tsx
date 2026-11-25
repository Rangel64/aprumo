import Link from "next/link";
import { Brand, Card, ProgressBar, cn } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import { DemoNotice } from "@/features/auth/demo";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";

const ctaBase =
  "inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3 text-base font-bold transition-colors";

const BLOCKS = [
  {
    title: "Jornada sob medida",
    text: "Você define a meta e o prazo, e o Aprumo organiza o caminho de estudos.",
    tone: "bg-purple-light",
  },
  {
    title: "Mapa de Conteúdos",
    text: "Veja como os assuntos se conectam e o que vem antes de cada um.",
    tone: "bg-mint-light",
  },
  {
    title: "Revisões no ritmo certo",
    text: "Flashcards que voltam na hora de lembrar, para o que você aprendeu ficar.",
    tone: "bg-yellow-light",
  },
  {
    title: "Redação com retorno",
    text: "Uma ideia de cada vez, com retorno que aponta o caminho sem escrever por você.",
    tone: "bg-coral-light",
  },
] as const;

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-x-clip px-5 sm:px-8">
      <header className="flex items-center justify-between gap-4 py-5">
        <Brand />
        <nav aria-label="Entrada" className="flex items-center gap-4 text-sm sm:gap-8">
          <a href="#como-funciona" className={cn("hidden rounded-sm text-muted hover:text-ink sm:inline", focus)}>
            Como funciona
          </a>
          <a href="#explorar" className={cn("hidden rounded-sm text-muted hover:text-ink sm:inline", focus)}>
            Explorar
          </a>
          <Link href={ROUTES.signIn} className={cn("rounded-sm font-bold text-purple-text", focus)}>
            Entrar <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="grid items-center gap-10 py-8 md:grid-cols-2 md:py-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-pill bg-purple-light px-4 py-1.5 text-xs font-bold text-purple-text">
              <span aria-hidden="true">✦</span> Seu plano. Seu ritmo. Seu futuro.
            </p>
            <h1 className="mt-6 font-display text-4xl leading-tight font-bold text-ink sm:text-5xl lg:text-6xl">
              Seu caminho de estudos, <span className="text-purple-text">passo a passo.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              Uma Jornada feita para você, com IA, conteúdos conectados e revisões que
              respeitam o seu ritmo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={ROUTES.signUp}
                className={cn(ctaBase, "bg-purple text-white shadow-purple hover:bg-purple-dark", focus)}
              >
                Começar agora <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={ROUTES.signIn}
                className={cn(ctaBase, "border border-line bg-white text-ink shadow-card hover:bg-purple-light", focus)}
              >
                Já tenho conta <span aria-hidden="true">→</span>
              </Link>
            </div>
            <DemoNotice className="mt-6 max-w-md" />
          </div>

          {/* Composição decorativa: formas orgânicas e cartões ilustrativos. */}
          <div aria-hidden="true" className="relative mx-auto h-80 w-full max-w-md sm:h-[26rem]">
            <div className="absolute top-4 right-6 h-64 w-56 rounded-[48%_52%_45%_55%/55%_45%_55%_45%] bg-purple-light sm:h-80 sm:w-72" />
            <div className="absolute top-8 right-0 h-28 w-28 rounded-[30%_70%_60%_40%/60%_40%_60%_40%] bg-coral sm:h-36 sm:w-36" />
            <div className="absolute bottom-6 left-10 h-24 w-24 rounded-full bg-mint sm:h-32 sm:w-32" />
            <div className="absolute right-10 bottom-0 h-24 w-32 rounded-t-full bg-yellow sm:h-28 sm:w-40" />

            <Card className="absolute top-10 left-0 w-56 rounded-md p-4 sm:w-64">
              <p className="text-xs text-muted">Próximo passo</p>
              <p className="font-display font-bold text-ink">Funções do 2º grau</p>
              <ProgressBar label="Progresso de exemplo" value={65} className="mt-3" />
            </Card>
            <Card className="absolute top-44 right-0 w-36 rounded-md p-3 sm:top-56">
              <p className="font-display font-bold text-ink">7 dias</p>
              <p className="text-xs text-muted">em sequência</p>
            </Card>
            <Card className="absolute bottom-2 left-24 w-44 rounded-md p-3 sm:left-28">
              <p className="font-display text-xl font-bold text-purple-text">+18%</p>
              <p className="text-xs text-muted">evolução neste mês</p>
            </Card>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-6 py-10">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Como funciona</h2>
          <p className="mt-2 max-w-xl text-muted">
            Você escolhe o que quer alcançar e segue um passo de cada vez.
          </p>
        </section>

        <section id="explorar" aria-label="Recursos" className="scroll-mt-6 pb-16">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BLOCKS.map((b) => (
              <li key={b.title} className={cn("rounded-lg p-6", b.tone)}>
                <h3 className="font-display text-lg font-bold text-ink">{b.title}</h3>
                <p className="mt-2 text-sm text-ink">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line py-6 text-sm text-muted">
        Aprumo é uma demonstração. Os dados e números mostrados são fictícios.
      </footer>
    </div>
  );
}

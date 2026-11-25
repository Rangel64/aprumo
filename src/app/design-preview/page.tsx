// remover antes da T3 (página temporária de verificação visual do design system)
import { Button, Card, Chip, MapNode, ProgressBar } from "@/components/ui";

export default function DesignPreview() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <h1 className="font-display text-4xl font-bold">
        Seu caminho de estudos,{" "}
        <span className="text-purple-text">passo a passo.</span>
      </h1>
      <div className="flex flex-wrap gap-3">
        <Button>Começar agora</Button>
        <Button variant="secondary">Já tenho conta</Button>
        <Button variant="ghost">Entrar</Button>
        <Button size="sm" disabled>
          Desabilitado
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip>Neutra</Chip>
        <Chip tone="purple">Roxa</Chip>
        <Chip tone="coral">Coral</Chip>
        <Chip tone="yellow">Amarela</Chip>
        <Chip tone="mint">Menta</Chip>
        <Chip tone="blue">Azul</Chip>
        <Chip tone="pink">Rosa</Chip>
        <Chip tone="orange">Laranja</Chip>
      </div>
      <Card className="flex flex-col gap-3">
        <p className="font-display font-bold">Funções do 2º grau</p>
        <ProgressBar value={68} label="Progresso do conteúdo" />
      </Card>
      <Card className="flex flex-wrap gap-8">
        <MapNode status="not_started" label="Não iniciado" />
        <MapNode status="studying" label="Em estudo" />
        <MapNode status="mastered" label="Dominado" />
        <MapNode status="mastered" label="Revisado hoje" reviewedToday />
      </Card>
    </main>
  );
}

# T3 (KAN-34): roteiro de conferência manual do PO

Pré-requisitos: `.env.local` com as chaves do `aprumo-dev` (confirmação de e-mail desligada no painel) e `NEXT_PUBLIC_DEMO_MODE=true`; `pnpm dev`. Use e-mails fictícios (ex.: `teste1@example.com`).

## Roteiro

| # | Passo | Esperado | Resultado |
|---|---|---|---|
| 1 | Abrir `/` e clicar "Começar agora" | Vai a `/cadastro` | |
| 2 | Cadastrar nome, e-mail novo e senha de 6+ caracteres | Conta ativa sem e-mail de confirmação; cai em `/jornada/nova` ("Em construção"); menu lateral mostra o nome informado | |
| 3 | No painel, conferir `profiles` | Linha criada com `display_name` igual ao nome | |
| 4 | Clicar "Sair" | Volta a `/entrar` | |
| 5 | Digitar `/inicio` na barra de endereço sem sessão | Redireciona a `/entrar` (testar também `/mapa`, `/jornada`, `/cronograma`, `/revisar`, `/redacao`) | |
| 6 | Em `/cadastro`, repetir o e-mail do passo 2 | Mensagem "Este e-mail já tem cadastro" com link "Ir para Entrar"; foco vai ao campo e-mail | |
| 7 | Em `/entrar`, senha errada | "E-mail ou senha incorretos." (sem texto do provedor) | |
| 8 | Em `/entrar`, e-mail e senha corretos | Vai a `/inicio` | |
| 9 | Logado, abrir `/entrar` e `/cadastro` | Redireciona a `/inicio` | |
| 10 | Senha com 5 caracteres no cadastro | Erro de campo "A senha precisa ter de 6 a 72 caracteres." | |
| 11 | Só teclado (Tab, Shift+Tab, Enter) em Entrada, `/entrar`, `/cadastro` e no menu | Ordem lógica, foco sempre visível (contorno roxo), envio com Enter | |
| 12 | Leitor de tela (opcional): provocar erro de campo e de formulário | Erro é anunciado (role=alert) | |
| 13 | Janela estreita (360 px) em `/`, `/entrar`, `/cadastro`, `/inicio` | Sem rolagem horizontal; barra de menu inferior com 6 itens legíveis | |
| 14 | Com `NEXT_PUBLIC_DEMO_MODE` desligado | Aviso de dados de teste some em todas as telas | |
| 15 | `/` ao lado de `docs/design/figma-prototipo/01-entrada.jpg` | Mesma estrutura, cores, tipografia e composição; diferenças só as listadas abaixo | |

Guardar o screenshot lado a lado (desktop e celular) em `docs/evidencias/faixa-a/entrada-lado-a-lado.png`.

## Diferenças aceitas em relação ao Figma

- Marca "Aprumo" no lugar de "[Nome da plataforma]"; ícone de 4 círculos coloridos desenhado em SVG (o logo original não foi exportado).
- Sem prova social ("2.400 estudantes", iniciais JL/MA): removida por decisão do PO.
- Sem a barra de teste de 15 itens.
- Texto de apoio sem "comunidade que estuda junto" (fora da fase H); no lugar, "revisões que respeitam o seu ritmo".
- Cartões flutuantes e formas orgânicas recriados em CSS (aproximação, não pixel a pixel); valores dos cartões (Funções do 2º grau, 7 dias, +18%) são ilustrativos.
- Roxo em texto pequeno usa `purple-text` (#6243e8) por contraste (README de design §2).
- Adicionados: 4 blocos de apresentação, aviso de dados fictícios e rodapé (a imagem mostra só a primeira dobra).
- "Como funciona" e "Explorar" levam a âncoras na própria página.
- Menu do app inclui "Redação", que o protótipo (02-inicio.jpg) não lista; sem ícones nos itens, sem cartão "Você está indo bem" nem contador de revisões.
- Celular: barra inferior de texto com 6 itens (decisão da faixa A).

## Pendências

- D-030 (regras de senha e recuperação): só o mínimo do Supabase (6 a 72 caracteres); sem tela de recuperação de senha.
- Repetir o desligamento da confirmação de e-mail no `aprumo-prod` (T8).
- Login real, aparência e foco não foram verificados pelo desenvolvedor (sem chaves e sem servidor): dependem deste roteiro.

## Regras registradas após a revisão de segurança

- `/api/*`: o proxy renova a sessão, mas o guard não redireciona rotas de API. `/api/health` é público; **todo handler autenticado (T5, T18 e demais) deve chamar `supabase.auth.getUser()` e responder 401 por conta própria.**
- Respostas e redirects do proxy levam os cabeçalhos `Cache-Control: private, no-store` informados pelo `@supabase/ssr` junto dos cookies renovados.
- Os números decorativos dos cartões da Entrada ("7 dias", "+18%", "Funções do 2º grau") são ilustrativos; o rodapé avisa que dados e números são fictícios (anotar na PR).
- Senha: mínimo de 6 caracteres e máximo de 72 bytes (limite do bcrypt).
- Confirmação de e-mail ligada (erro `email_not_confirmed` ou signUp sem sessão): mensagem própria "Sua conta foi criada, mas precisa confirmar o e-mail. Verifique a caixa de entrada."

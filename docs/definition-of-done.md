# Definition of Done

Padrão do projeto; todo perfil exige registro M e "sem segredos".

| Perfil | Exige |
|---|---|
| trivial | diff conferido; lint/format se houver |
| bug | teste que reproduz (vermelho antes, verde depois); suíte relevante verde; revisor sem bloqueante; vínculo B-nnn/US |
| backend | lint, typecheck, testes unit/integração verdes; contrato atualizado se mudou; revisor; qa |
| frontend | lint, typecheck, testes verdes; evidência de tela; foco/teclado/aria-live conferidos no e2e; revisor; qa |
| full-stack (feature média/grande) | lint, typecheck e testes verdes; revisor sem bloqueante; auditor-escopo sem escopo solto; docs e matriz atualizados; telas e fluxos verificados em ambiente isolado com evidência (quando houver UI) |
| infra | build/up local; healthcheck; rollback descrito; documentador quando tocar infra |
| hackathon (fase H; aperta e afrouxa o padrão) | build e smoke test do fluxo principal verdes (lint/typecheck se houver; testes unitários só no que for crítico: regra de domínio RN-007, limite de uso); fluxo percorrido na demo publicada com dados fictícios; sem segredos nem dados reais no repo público; README com instruções; vídeo de até 3 min sem login; descrição e trilha preenchidas; repositório conforme regulamento (RNF-019); registro M |
| sensível | perfil base + /security-review + revisor em opus |

## Relato (um estado por item)
executado | passou | falhou | não executado | não verificável | pendência que impede "feita"

Teste não executado nunca conta como aprovado.

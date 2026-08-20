# Governança do projeto

## Papéis

### Founder

Autoridade final sobre direção, escopo e prioridades.

### C.O.

Responsável por estratégia, requisitos, critérios de aceite, priorização, auditoria e aprovação de mudanças.

### DEV HUB

Responsável pela implementação oficial, testes técnicos, manutenção do código e relatórios de entrega.

## Rastreabilidade

Mudanças relevantes usam IDs no formato `HUB-xxx`.

Fluxo recomendado:

```text
requisito → implementação → testes → relatório → aprovação → baseline
```

## Regra de foco

O desenvolvimento deve priorizar deixar funcional e reproduzível o que já foi aprovado antes de expandir o escopo. Melhorias novas identificadas durante estabilização devem ser registradas no backlog, não implementadas automaticamente.

## Repositório canônico

`SWtheaven/hub-concurso` é o repositório técnico principal. Alterações aprovadas devem ser refletidas nele para manter código, documentação e histórico alinhados.

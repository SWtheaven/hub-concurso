# Contribuindo

## Princípios

1. Vincule mudanças a um item `HUB-xxx` ou issue.
2. Evite ampliar o escopo da tarefa durante uma correção.
3. Preserve o isolamento de dados por usuário, edital e cargo.
4. Nunca versione segredos.
5. Rode testes e dry-run do Worker antes de solicitar merge.

## Validação mínima

```bash
cd worker
npm ci
npm test
npm run check
```

## Pull requests

Inclua no PR:

- problema/objetivo;
- escopo;
- arquivos alterados;
- testes executados;
- riscos conhecidos;
- impacto em migrations/API;
- referência ao item `HUB-xxx`.

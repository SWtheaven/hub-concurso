# Segurança

## Segredos

Nunca versionar:

- `.dev.vars`;
- tokens internos;
- chaves Supabase privadas;
- chaves Gemini/Groq;
- credenciais de provedores.

Use apenas os arquivos `.example` documentados.

## Supabase

- JWT do usuário é validado pelo Worker;
- tabelas de usuário usam RLS;
- `SUPABASE_SECRET_KEY` deve existir somente no backend;
- alterações de schema devem passar por migrations versionadas.

## Relato de vulnerabilidades

Evite abrir publicamente uma issue com segredos, tokens ou evidências exploráveis. Revogue qualquer credencial que tenha sido exposta e comunique o mantenedor por um canal privado disponível no GitHub.

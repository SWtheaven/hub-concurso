# Auditoria pendente — API das Questões

Data da verificação: 15/08/2026.

O site público informa planos, limites e acesso às questões, mas não foi localizada uma política pública suficientemente específica sobre:

- exibição do conteúdo em produto comercial;
- redistribuição a usuários finais;
- retenção em banco próprio;
- cache em CDN, Worker, Redis ou navegador;
- uso do texto para geração de explicações por IA;
- obrigação de atribuição, remoção ou atualização.

Até receber confirmação contratual:

- o Worker exige `QUESTIONS_TERMS_ACCEPTED="true"` para liberar o provedor;
- respostas de questões usam `Cache-Control: no-store`;
- o conteúdo não é gravado no Supabase;
- o cache central é usado somente no Querido Diário, não em questões;
- o modo com chave no navegador permanece apenas para testes locais do responsável pelo projeto.

Perguntas a enviar ao provedor:

1. O plano escolhido autoriza uso em uma plataforma comercial com usuários finais?
2. Podemos exibir enunciado, alternativas e gabarito dentro do Concurso Hub?
3. Qual cache transitório é permitido e por quanto tempo?
4. Podemos persistir identificadores, desempenho e respostas do usuário sem copiar o conteúdo integral?
5. Podemos enviar a questão à Groq/Gemini somente para gerar uma explicação individual?
6. Há requisitos de atribuição, link, exclusão e atualização de itens?
7. O plano gratuito é restrito a projetos pessoais ou pode ser usado durante um piloto comercial?

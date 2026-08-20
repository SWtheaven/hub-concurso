(function (root) {
  const q = (topic, statement, trueAnswer, stem, options, correct, explanation) => ({
    topic, statement, trueAnswer, stem, options, correct, explanation
  });

  const banks = {
    "Língua Portuguesa": [
      q("Concordância", "Na frase “Faz dois anos que estudo para concursos”, o verbo fazer está corretamente empregado no singular.", true, "Assinale a frase redigida de acordo com a norma-padrão.", ["Fazem dois anos que estudo.", "Faz dois anos que estudo.", "Houveram muitas inscrições.", "Devem haver novas vagas.", "Tratam-se de novas regras."], 1, "Quando indica tempo decorrido, o verbo fazer é impessoal e permanece no singular."),
      q("Crase", "Em “A candidata dirigiu-se à sala de provas”, o acento grave decorre da fusão da preposição exigida pelo verbo com o artigo feminino.", true, "O emprego do acento indicativo de crase está correto em:", ["Entregou o recurso à partir das oito.", "Referiu-se à uma norma antiga.", "Dirigiu-se à sala indicada.", "Chegou à pé ao local.", "Estudou de segunda à sexta."], 2, "O verbo dirigir-se exige a preposição a e sala admite artigo feminino: a + a = à."),
      q("Pontuação", "As vírgulas em “O edital, publicado ontem, trouxe novas datas” isolam uma oração de valor explicativo.", true, "Em “O edital, publicado ontem, trouxe novas datas”, as vírgulas isolam:", ["um vocativo", "uma oração explicativa reduzida", "um adjunto adverbial obrigatório", "uma enumeração", "um aposto especificativo"], 1, "O trecho reduzido de particípio acrescenta informação explicativa sobre o edital."),
      q("Regência", "A construção “o cargo a que o candidato aspira” atende à regência do verbo aspirar no sentido de desejar.", true, "A frase correta quanto à regência é:", ["O cargo que ele aspira é disputado.", "O cargo a que ele aspira é disputado.", "Prefiro mais teoria do que questões.", "Assisti o curso ontem.", "Obedeceu o regulamento."], 1, "Aspirar, no sentido de desejar, rege a preposição a."),
      q("Coesão", "A substituição de “portanto” por “contudo” preservaria a relação de conclusão entre duas orações.", false, "O conectivo que expressa conclusão é:", ["embora", "contudo", "portanto", "porque", "enquanto"], 2, "Portanto é conclusivo; contudo expressa oposição."),
      q("Colocação pronominal", "Em “Não se divulgaram os resultados”, a palavra negativa atrai o pronome para antes do verbo.", true, "A colocação pronominal está adequada em:", ["Não divulgaram-se os resultados.", "Não se divulgaram os resultados.", "Me informaram a data.", "Jamais diria-lhe isso.", "Se deve conferir o edital."], 1, "Palavras negativas são fatores de próclise."),
    ],
    "Raciocínio Lógico": [
      q("Proposições", "A negação de “Todos os candidatos foram aprovados” é “Pelo menos um candidato não foi aprovado”.", true, "A negação de “Todos os candidatos entregaram o documento” é:", ["Nenhum candidato entregou o documento.", "Todos os candidatos não entregaram o documento.", "Pelo menos um candidato não entregou o documento.", "Alguns candidatos entregaram o documento.", "Pelo menos um candidato entregou o documento."], 2, "A negação do quantificador universal é a existência de ao menos um contraexemplo."),
      q("Equivalência", "A proposição “Se estudo, então avanço” é logicamente equivalente a “Se não avanço, então não estudo”.", true, "A contrapositiva de “Se reviso, então retenho” é:", ["Se retenho, então reviso.", "Se não reviso, então não retenho.", "Se não retenho, então não reviso.", "Reviso se e somente se retenho.", "Reviso ou retenho."], 2, "A contrapositiva de p → q é ¬q → ¬p."),
      q("Porcentagem", "Aumentar um valor em 20% e depois reduzi-lo em 20% não o faz retornar ao valor inicial.", true, "Um valor de R$ 200 sofre aumento de 20% e depois redução de 20%. O resultado é:", ["R$ 180", "R$ 192", "R$ 200", "R$ 208", "R$ 220"], 1, "200 × 1,20 × 0,80 = 192."),
      q("Conjuntos", "Se todo analista é servidor e algum servidor é professor, conclui-se necessariamente que algum analista é professor.", false, "De “todo A é B” e “algum B é C”, conclui-se necessariamente que:", ["todo A é C", "algum A é C", "nenhum A é C", "todo C é A", "nenhuma das anteriores"], 4, "O elemento de B que pertence a C pode não pertencer a A."),
      q("Probabilidade", "Ao lançar um dado honesto, a probabilidade de obter número par é igual a 1/2.", true, "Ao lançar um dado honesto, a probabilidade de obter número maior que 4 é:", ["1/6", "1/3", "1/2", "2/3", "5/6"], 1, "Há dois resultados favoráveis, 5 e 6, entre seis possíveis: 2/6 = 1/3."),
      q("Sequências", "Na sequência 2, 6, 18, 54, o próximo termo é 162.", true, "O próximo termo de 3, 6, 12, 24 é:", ["30", "36", "42", "48", "60"], 3, "Cada termo é o dobro do anterior."),
    ],
    "Matemática": [
      q("Razão", "Se 4 servidores analisam 120 processos no mesmo ritmo, 6 servidores analisam 180 processos no mesmo período.", true, "Cinco pessoas executam 150 tarefas no mesmo ritmo. Sete pessoas executarão:", ["180", "200", "210", "225", "250"], 2, "A quantidade é diretamente proporcional: 150 ÷ 5 × 7 = 210."),
      q("Porcentagem", "Trinta por cento de 250 corresponde a 75.", true, "15% de 320 é igual a:", ["32", "40", "48", "52", "64"], 2, "0,15 × 320 = 48."),
      q("Média", "A média aritmética de 6, 8 e 10 é 8.", true, "A média de 7, 9, 10 e 14 é:", ["9", "10", "10,5", "11", "12"], 1, "A soma é 40 e 40 ÷ 4 = 10."),
      q("Juros simples", "A juros simples de 2% ao mês, um capital de R$ 1.000 rende R$ 60 em três meses.", true, "R$ 2.000 aplicados a juros simples de 1,5% ao mês por quatro meses rendem:", ["R$ 90", "R$ 100", "R$ 120", "R$ 140", "R$ 160"], 2, "J = C × i × t = 2000 × 0,015 × 4 = 120."),
      q("Frações", "A soma de 1/3 com 1/6 é igual a 1/2.", true, "O valor de 3/4 − 1/8 é:", ["1/2", "5/8", "2/3", "7/8", "1"], 1, "3/4 = 6/8; 6/8 − 1/8 = 5/8."),
      q("Equações", "A solução da equação 3x + 6 = 21 é x = 5.", true, "A solução de 4x − 8 = 20 é:", ["5", "6", "7", "8", "9"], 2, "4x = 28, logo x = 7."),
    ],
    "Informática": [
      q("Segurança", "A autenticação em dois fatores reduz o risco de acesso indevido mesmo quando uma senha é comprometida.", true, "A medida que adiciona uma segunda etapa à autenticação é:", ["compactação", "criptografia simétrica", "autenticação multifator", "desfragmentação", "cache"], 2, "A autenticação multifator exige evidências de categorias diferentes."),
      q("Phishing", "Phishing é uma técnica de engenharia social que busca induzir a vítima a revelar dados ou executar ações inseguras.", true, "Uma mensagem que imita um banco e solicita senha em um link suspeito caracteriza:", ["backup", "firewall", "phishing", "indexação", "virtualização"], 2, "A fraude usa identidade falsa para capturar informações."),
      q("Navegadores", "O modo de navegação privada não torna o usuário anônimo para o provedor de internet ou para o site visitado.", true, "A navegação privada normalmente impede:", ["o provedor de ver o tráfego", "o site de receber o endereço IP", "o armazenamento local do histórico após a sessão", "a transmissão de cookies durante a sessão", "o download de arquivos"], 2, "Ela reduz rastros locais, mas não oferece anonimato de rede."),
      q("Planilhas", "Em uma planilha, a fórmula =SOMA(A1:A5) soma os valores do intervalo de A1 a A5.", true, "A fórmula que calcula a média de B1 a B4 é:", ["=SOMA(B1:B4)", "=MÉDIA(B1:B4)", "=CONT.SE(B1:B4)", "=MÁXIMO(B1;B4)", "=B1+B4/4"], 1, "A função MÉDIA calcula a média aritmética do intervalo."),
      q("Redes", "HTTPS utiliza criptografia para proteger a comunicação entre navegador e servidor.", true, "O protocolo associado à navegação web com proteção criptográfica é:", ["FTP", "HTTP", "HTTPS", "SMTP", "DNS"], 2, "HTTPS combina HTTP com uma camada criptográfica, normalmente TLS."),
      q("Backup", "Uma estratégia de backup deve manter ao menos uma cópia isolada do ambiente principal.", true, "A regra 3-2-1 de backup recomenda:", ["três senhas e dois usuários", "três cópias, duas mídias e uma cópia externa", "três discos no mesmo computador", "duas nuvens e nenhum disco local", "uma cópia atualizada a cada três anos"], 1, "A regra reduz o risco de perda simultânea das cópias."),
    ],
    "Direito Constitucional": [
      q("Direitos fundamentais", "As normas definidoras dos direitos e garantias fundamentais têm aplicação imediata, conforme a Constituição Federal.", true, "Segundo a Constituição Federal, as normas definidoras de direitos e garantias fundamentais têm aplicação:", ["diferida", "condicionada a decreto", "imediata", "apenas judicial", "apenas administrativa"], 2, "É o que estabelece o art. 5º, §1º, da Constituição."),
      q("Administração Pública", "Legalidade, impessoalidade, moralidade, publicidade e eficiência são princípios expressos da administração pública.", true, "Não integra o conjunto de princípios expressos no caput do art. 37 da Constituição:", ["legalidade", "impessoalidade", "moralidade", "publicidade", "supremacia do interesse público"], 4, "A supremacia é princípio reconhecido, mas não aparece no rol expresso do caput do art. 37."),
      q("Poderes", "Os Poderes da União são independentes e harmônicos entre si.", true, "São Poderes da União, independentes e harmônicos entre si:", ["Executivo, Moderador e Judiciário", "Legislativo, Executivo e Judiciário", "Legislativo, Ministério Público e Judiciário", "Executivo, Tribunal de Contas e Judiciário", "Legislativo, Defensoria e Executivo"], 1, "A tripartição está prevista no art. 2º da Constituição."),
      q("Nacionalidade", "São brasileiros natos os nascidos no Brasil, ainda que de pais estrangeiros, desde que estes não estejam a serviço de seu país.", true, "É brasileiro nato, em regra, o nascido:", ["no exterior de qualquer pai estrangeiro", "no Brasil, salvo se os pais estrangeiros estiverem a serviço de seu país", "no exterior sem vínculo com brasileiro", "no Brasil apenas após naturalização", "no exterior e residente por um ano no Brasil"], 1, "A regra territorial consta do art. 12 da Constituição."),
    ],
    "Direito Administrativo": [
      q("Atos administrativos", "A presunção de legitimidade permite que o ato administrativo produza efeitos até que seja invalidado.", true, "A característica que faz presumir a conformidade do ato com a lei é:", ["tipicidade", "imperatividade", "presunção de legitimidade", "autoexecutoriedade", "discricionariedade"], 2, "A presunção é relativa e admite prova em contrário."),
      q("Poderes administrativos", "O poder disciplinar alcança servidores e particulares sujeitos a vínculo especial com a administração.", true, "O poder usado para apurar infrações de servidores é o poder:", ["regulamentar", "de polícia", "disciplinar", "hierárquico externo", "vinculado legislativo"], 2, "O poder disciplinar fundamenta sanções em relações funcionais ou especiais."),
      q("Responsabilidade civil", "A responsabilidade civil do Estado por dano causado por agente público a terceiro é, em regra, objetiva.", true, "Em regra, a responsabilidade civil estatal por ato de seu agente é:", ["subjetiva, sem exceção", "objetiva", "penal", "inexistente", "contratual"], 1, "Aplica-se a teoria do risco administrativo, assegurado o regresso em caso de dolo ou culpa do agente."),
      q("Anulação e revogação", "A administração deve anular atos ilegais e pode revogar atos válidos por conveniência e oportunidade.", true, "A retirada de um ato válido por razões de mérito denomina-se:", ["anulação", "cassação", "revogação", "convalidação", "caducidade"], 2, "Revogação atua sobre ato válido por conveniência e oportunidade."),
    ],
    "Ética no Serviço Público": [
      q("Conduta", "A ética pública exige que o agente avalie não apenas a legalidade formal, mas também a honestidade de sua conduta.", true, "A conduta ética do agente público exige:", ["apenas cumprimento de ordens", "busca de vantagem pessoal", "legalidade e honestidade", "sigilo sobre todo ato", "tratamento desigual por preferência"], 2, "A ética pública agrega deveres de probidade, finalidade e respeito ao cidadão."),
      q("Interesse público", "O uso do cargo para obter favorecimento pessoal conflita com os deveres éticos do serviço público.", true, "É incompatível com a ética pública:", ["tratar usuários com respeito", "prestar contas", "usar o cargo para vantagem pessoal", "cumprir a lei", "agir com transparência"], 2, "A função pública não pode ser instrumentalizada para benefício privado."),
      q("Publicidade", "A transparência é regra na administração, ressalvadas as hipóteses legais de sigilo.", true, "Sobre transparência e sigilo, é correto afirmar:", ["todo documento é sigiloso", "o sigilo depende apenas da vontade do agente", "a transparência é regra, com exceções legais", "a publicidade nunca alcança despesas", "informações públicas exigem interesse pessoal"], 2, "A publicidade orienta a administração; o sigilo é excepcional e fundamentado em lei."),
    ],
    "Administração Pública": [
      q("Governança", "Governança pública envolve mecanismos de liderança, estratégia e controle para avaliar, direcionar e monitorar a gestão.", true, "Governança pública está associada principalmente a:", ["execução operacional isolada", "liderança, estratégia e controle", "ausência de prestação de contas", "eliminação de indicadores", "centralização sem supervisão"], 1, "A governança direciona e monitora a atuação organizacional."),
      q("Eficiência", "Eficiência relaciona os resultados alcançados aos recursos utilizados.", true, "O conceito que relaciona produtos gerados e recursos consumidos é:", ["eficiência", "legalidade", "equidade", "legitimidade", "publicidade"], 0, "Eficiência busca produzir melhor resultado com uso adequado dos recursos."),
      q("Controle", "O controle interno apoia a prevenção de riscos e a melhoria dos processos organizacionais.", true, "Uma finalidade do controle interno é:", ["eliminar a responsabilidade do gestor", "impedir qualquer inovação", "prevenir riscos e aperfeiçoar processos", "substituir o controle externo", "ocultar falhas operacionais"], 2, "O controle interno fornece segurança e informações para aperfeiçoar a gestão."),
    ],
    "Contabilidade": [
      q("Patrimônio", "O patrimônio de uma entidade é composto por bens, direitos e obrigações.", true, "Integram o patrimônio:", ["apenas bens", "bens e receitas", "bens, direitos e obrigações", "somente direitos", "receitas e despesas"], 2, "A contabilidade estuda o conjunto de bens, direitos e obrigações."),
      q("Equação patrimonial", "A equação básica do patrimônio é Ativo = Passivo + Patrimônio Líquido.", true, "A equação patrimonial básica é:", ["Ativo = Receita − Despesa", "Ativo = Passivo + Patrimônio Líquido", "Passivo = Ativo + Patrimônio Líquido", "Patrimônio Líquido = Ativo + Passivo", "Ativo = Caixa + Receita"], 1, "A origem dos recursos financia os ativos da entidade."),
      q("Regime de competência", "Pelo regime de competência, receitas e despesas são reconhecidas no período em que ocorrem, independentemente do pagamento ou recebimento.", true, "No regime de competência, uma despesa é reconhecida:", ["apenas quando paga", "quando ocorre o fato gerador", "quando houver saldo em caixa", "somente no encerramento anual", "após auditoria externa"], 1, "O reconhecimento acompanha o fato gerador econômico."),
    ],
    "Arquivologia": [
      q("Teoria das três idades", "Arquivos correntes contêm documentos frequentemente consultados e vinculados às atividades em curso.", true, "Documentos de uso frequente ficam, em regra, no arquivo:", ["permanente", "intermediário", "corrente", "histórico externo", "especial"], 2, "A fase corrente atende às necessidades administrativas imediatas."),
      q("Princípio da proveniência", "O princípio da proveniência recomenda manter separados os documentos de produtores diferentes.", true, "O princípio que preserva o vínculo dos documentos com seu produtor é o da:", ["pertinência", "proveniência", "publicidade", "unicidade física", "temporalidade"], 1, "A proveniência evita misturar fundos documentais de origens distintas."),
      q("Temporalidade", "A tabela de temporalidade define prazos de guarda e a destinação dos documentos.", true, "O instrumento que estabelece prazos de guarda é a:", ["lista de presença", "tabela de temporalidade", "ata de reunião", "guia de recolhimento isolada", "planta de classificação"], 1, "Ela orienta eliminação ou guarda permanente após a fase necessária."),
    ],
    "Direitos Humanos": [
      q("Universalidade", "A universalidade afirma que os direitos humanos pertencem a todas as pessoas.", true, "A característica segundo a qual os direitos humanos alcançam todas as pessoas é a:", ["historicidade", "universalidade", "renunciabilidade", "prescritibilidade", "taxatividade"], 1, "A titularidade decorre da condição humana."),
      q("Indivisibilidade", "A indivisibilidade afasta uma hierarquia rígida entre direitos civis, políticos, sociais, econômicos e culturais.", true, "A noção de que os direitos humanos formam um conjunto integrado expressa a:", ["alienabilidade", "indivisibilidade", "prescrição", "reserva", "territorialidade"], 1, "Os direitos se complementam e não devem ser tratados como blocos isolados."),
      q("Dignidade", "A dignidade da pessoa humana constitui fundamento da República Federativa do Brasil.", true, "É fundamento da República Federativa do Brasil:", ["censura prévia", "dignidade da pessoa humana", "voto censitário", "sigilo estatal absoluto", "pena de caráter perpétuo"], 1, "A dignidade está prevista no art. 1º, III, da Constituição."),
    ]
  };

  const bankProfiles = [
    { id: "cebraspe", name: "CEBRASPE/CESPE", pattern: /\b(?:cebraspe|cespe)\b/i, format: "certo_errado", validated: true },
    { id: "fgv", name: "FGV", pattern: /\b(?:fundacao getulio vargas|fgv)\b/i, format: "multipla_escolha", validated: false },
    { id: "fcc", name: "FCC", pattern: /\b(?:fundacao carlos chagas|fcc)\b/i, format: "multipla_escolha", validated: false },
    { id: "vunesp", name: "VUNESP", pattern: /\bvunesp\b/i, format: "multipla_escolha", validated: false },
    { id: "ibfc", name: "IBFC", pattern: /\bibfc\b/i, format: "multipla_escolha", validated: false },
    { id: "aocp", name: "Instituto AOCP", pattern: /\b(?:instituto\s+)?aocp\b/i, format: "multipla_escolha", validated: false },
    { id: "quadrix", name: "Instituto Quadrix", pattern: /\bquadrix\b/i, format: "multipla_escolha", validated: false },
    { id: "fundacao_cesgranrio", name: "Fundação CESGRANRIO", pattern: /\b(?:funda[cç][aã]o\s+)?cesgranrio\b/i, format: "multipla_escolha", validated: false }
  ];

  function questionsFor(subject, bankFormat) {
    const source = banks[subject] || [];
    return source.map((item, index) => bankFormat === "certo_errado" ? {
      id: `${subject}-${index}-ce`, subject, topic: item.topic, prompt: item.statement,
      options: ["Certo", "Errado"], correct: item.trueAnswer ? 0 : 1, explanation: item.explanation
    } : {
      id: `${subject}-${index}-mc`, subject, topic: item.topic, prompt: item.stem,
      options: item.options, correct: item.correct, explanation: item.explanation
    });
  }

  root.QuestionBank = {
    bankProfiles,
    detectBank(text) {
      const profile = bankProfiles.find(item => item.pattern.test(text || ""));
      return profile ? { id: profile.id, name: profile.name, format: profile.format, validated: profile.validated } : null;
    },
    supportsBank(bankName) { return bankProfiles.some(profile => profile.name === bankName && profile.validated); },
    hasSubject(subject) { return Boolean(banks[subject]?.length); },
    availableCount(subject) { return banks[subject]?.length || 0; },
    questionsFor
  };
})(typeof globalThis !== "undefined" ? globalThis : this);

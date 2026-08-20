(function (root, factory) {
  const analyzer = factory();
  if (typeof module === "object" && module.exports) module.exports = analyzer;
  root.EditalAnalyzer = analyzer;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SUBJECTS = [
    ["Língua Portuguesa", /\b(?:lingua\s+portuguesa|portugues)\b/i],
    ["Redação", /\bredacao\b/i],
    ["Raciocínio Lógico", /\braciocinio\s+logico(?:-matematico)?\b/i],
    ["Matemática", /\bmatematica\b/i],
    ["Informática", /\b(?:informatica|noc(?:ao|oes)\s+de\s+informatica)\b/i],
    ["Tecnologia da Informação", /\btecnologia\s+da\s+informacao\b/i],
    ["Direito Constitucional", /\bdireito\s+constitucional\b/i],
    ["Direito Administrativo", /\bdireito\s+administrativo\b/i],
    ["Direito Penal", /\bdireito\s+penal\b/i],
    ["Direito Processual Penal", /\bdireito\s+processual\s+penal\b/i],
    ["Direito Civil", /\bdireito\s+civil\b/i],
    ["Direito Processual Civil", /\bdireito\s+processual\s+civil\b/i],
    ["Direito Tributário", /\bdireito\s+tributario\b/i],
    ["Direitos Humanos", /\bdireitos?\s+humanos\b/i],
    ["Legislação Específica", /\blegislacao\s+(?:especifica|aplicada)\b/i],
    ["Ética no Serviço Público", /\betica(?:\s+no\s+servico\s+publico)?\b/i],
    ["Administração Pública", /\badministracao\s+publica\b/i],
    ["Administração Geral", /\badministracao\s+geral\b/i],
    ["Contabilidade", /\bcontabilidade(?:\s+geral|\s+publica)?\b/i],
    ["Administração Financeira e Orçamentária", /\b(?:administracao\s+financeira\s+e\s+orcamentaria|afo)\b/i],
    ["Arquivologia", /\barquivologia\b/i],
    ["Atualidades", /\batualidades\b/i],
    ["Conhecimentos Gerais", /\bconhecimentos\s+gerais\b/i],
    ["Conhecimentos Específicos", /\bconhecimentos\s+especificos\b/i]
  ];

  const STAGES = [
    ["Prova objetiva", /\bprova\s+objetiva\b/i],
    ["Prova discursiva", /\b(?:prova\s+discursiva|questao\s+discursiva)\b/i],
    ["Redação", /\bprova\s+de\s+redacao\b/i],
    ["Avaliação de títulos", /\b(?:avaliacao|prova)\s+de\s+titulos\b/i],
    ["Teste de aptidão física (TAF)", /\b(?:teste\s+de\s+aptidao\s+fisica|taf)\b/i],
    ["Avaliação psicológica", /\bavaliacao\s+psicologica\b/i],
    ["Exames médicos", /\b(?:exame|avaliacao)\s+medic[oa]\b/i],
    ["Investigação social", /\binvestigacao\s+social\b/i],
    ["Prova prática", /\bprova\s+pratica\b/i],
    ["Curso de formação", /\bcurso\s+de\s+formacao\b/i],
    ["Análise de experiência", /\b(?:analise|avaliacao)\s+de\s+experiencia\b/i]
  ];

  function fold(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function clean(value) {
    return String(value || "")
      .replace(/\u0000/g, "")
      .replace(/[\t ]+/g, " ")
      .replace(/\s+([,.;:])/g, "$1")
      .trim();
  }

  function clampText(value, limit = 300) {
    const text = clean(value);
    if (text.length <= limit) return text;
    const shortened = text.slice(0, limit);
    const lastSpace = shortened.lastIndexOf(" ");
    return `${shortened.slice(0, lastSpace > limit * 0.7 ? lastSpace : limit)}…`;
  }

  function pageLines(page) {
    return String(page.text || "")
      .split(/\n+/)
      .map(clean)
      .filter(line => line.length > 2)
      .flatMap(line => line.length > 420
        ? line.split(/(?<=[.;])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9])/).map(clean).filter(Boolean)
        : [line]);
  }

  function contextAt(lines, index, radius = 1) {
    const start = Math.max(0, index - radius);
    const end = Math.min(lines.length, index + radius + 1);
    return clampText(lines.slice(start, end).join(" "));
  }

  function uniqueItems(items, limit) {
    const seen = [];
    const result = [];

    for (const item of items) {
      const key = fold(item.text)
        .replace(/\bpagina\s+\d+\b/g, "")
        .replace(/\d+/g, "#")
        .replace(/\W+/g, " ")
        .trim();
      const words = new Set(key.split(" ").filter(word => word.length > 2));
      const isDuplicate = seen.some(saved => {
        if (saved.key === key || saved.key.includes(key) || key.includes(saved.key)) return true;
        const overlap = [...words].filter(word => saved.words.has(word)).length;
        const union = new Set([...words, ...saved.words]).size;
        return union > 0 && overlap / union >= 0.62;
      });
      if (!key || isDuplicate) continue;
      seen.push({ key, words });
      result.push(item);
      if (result.length >= limit) break;
    }

    return result;
  }

  function collectContexts(pages, matcher, options = {}) {
    const { limit = 6, radius = 1, score = () => 0, accept = () => true } = options;
    const found = [];

    pages.forEach(page => {
      const lines = pageLines(page);
      lines.forEach((line, index) => {
        const normalized = fold(line);
        if (!matcher.test(normalized)) return;
        matcher.lastIndex = 0;
        const text = contextAt(lines, index, radius);
        if (!accept(text, normalized)) return;
        found.push({ text, page: page.page, score: score(text, normalized) });
      });
    });

    return uniqueItems(found.sort((a, b) => b.score - a.score || a.page - b.page), limit)
      .map(({ text, page }) => ({ text, page }));
  }

  function collectNamedItems(pages, definitions, limit = 20) {
    const joined = pages.map(page => fold(page.text)).join("\n");
    return definitions
      .filter(([, pattern]) => pattern.test(joined))
      .slice(0, limit)
      .map(([text]) => ({ text, page: null }));
  }

  function collectCargoNames(pages) {
    const names = [];
    const labelPattern = /\b(?:cargo|emprego|funcao)(?:\s+publico)?(?:\s+n?[ºo.]?\s*\d+)?\s*[:\-–]\s*(.{3,180})/i;
    const rolePattern = /\b(?:analista|tecnico|auditor|agente|assistente|especialista|professor|medico|enfermeiro|engenheiro|arquiteto|advogado|procurador|delegado|escrivao|oficial|perito|fiscal|auxiliar|consultor|contador|administrador)\b/i;
    const invalidPattern = /\b(?:cadastro\s+de\s+reserva|reserva\s+de\s+vagas?|total\s+de\s+vagas?|numero\s+de\s+vagas?|quadro\s+de\s+vagas?|vagas?\s+imediatas?|requisitos?|remuneracao|jornada|inscricoes?|conteudo\s+programatico)\b/i;

    pages.forEach(page => {
      pageLines(page).forEach((line, lineIndex) => {
        const normalized = fold(line);
        const match = normalized.match(labelPattern);
        let name = "";
        let score = 0;

        if (match) {
          const sourceStart = line.search(/[:\-–]/);
          name = sourceStart >= 0 ? line.slice(sourceStart + 1) : match[1];
          score = 6;
        } else {
          const words = line.split(/\s+/).filter(Boolean);
          const titleWords = words.filter(word => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç-]*$/.test(word)).length;
          const letters = line.replace(/[^A-Za-zÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç]/g, "");
          const uppercaseRatio = letters ? letters.replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, "").length / letters.length : 0;
          const headingLike = words.length <= 14
            && !/[.!?;]/.test(line)
            && !/\b(?:devera|sera|podera|realizara|exercera|responsavel|atribuicoes?)\b/i.test(normalized)
            && (uppercaseRatio >= .55 || titleWords / Math.max(words.length, 1) >= .55);
          if (rolePattern.test(normalized) && line.length <= 180 && headingLike) {
          name = line;
          score = /\b(?:cargo|codigo|area|especialidade)\b/i.test(normalized) ? 4 : 2;
          }
        }

        name = clean(name)
          .replace(/^\s*(?:\d+[.\-–)]\s*|c[oó]digo\s*\d+\s*[:\-–]?\s*)/i, "")
          .replace(/\s+(?:vagas?|requisitos?|remunera[cç][aã]o|jornada)\s*[:\-–].*$/i, "")
          .replace(/\s*[|;]\s*.*$/, "")
          .trim();
        name = clampText(name, 165);

        if (!name || name.length < 4 || invalidPattern.test(fold(name)) || !rolePattern.test(fold(name))) return;
        names.push({ text: name, page: page.page, lineIndex, score });
      });
    });

    const direct = uniqueItems(names.sort((a, b) => b.score - a.score), 10)
      .map(({ text, page, lineIndex, score }) => ({ text, page, lineIndex, confidence: score >= 5 ? "alta" : "média" }));
    return direct;
  }

  function findSubjectsInText(text) {
    const normalized = fold(text);
    return SUBJECTS
      .filter(([, pattern]) => pattern.test(normalized))
      .map(([name]) => name);
  }

  function collectCargoProfiles(pages, cargos, fallbackSubjects) {
    if (!cargos.length) return [];

    return cargos.map((cargo, index) => {
      const startPage = cargo.page || 1;
      const nextPage = cargos[index + 1]?.page;
      const selectedPages = pages.filter(page => {
        if (page.page < startPage) return false;
        if (nextPage && nextPage > startPage) return page.page < nextPage;
        return page.page <= startPage + 4;
      });
      const page = pages.find(item => item.page === startPage);
      const lines = page ? pageLines(page) : [];
      const startLine = Number.isInteger(cargo.lineIndex)
        ? cargo.lineIndex
        : Math.max(0, lines.findIndex(line => fold(line).includes(fold(cargo.text))));
      const nextCargoSamePage = cargos.find((item, cargoIndex) => cargoIndex > index && item.page === startPage && Number.isInteger(item.lineIndex));
      const endLine = nextCargoSamePage ? nextCargoSamePage.lineIndex : Math.min(lines.length, startLine + 70);
      const localBlock = lines.slice(startLine, endLine).join("\n");
      const scopedText = [localBlock, ...selectedPages.filter(item => item.page !== startPage).map(item => item.text)].join("\n");
      const localSubjects = findSubjectsInText(scopedText);
      const detailLine = matcher => pageLines({ text: scopedText }).find(line => matcher.test(fold(line))) || "";
      return {
        name: cargo.text,
        page: cargo.page,
        subjects: localSubjects.length ? localSubjects : fallbackSubjects,
        confidence: cargo.confidence === "alta" && localSubjects.length ? "alta" : localSubjects.length ? "média" : "baixa",
        details: {
          vagas: detailLine(/\b(?:\d+\s+vagas?|vagas?\s*[:\-–]?\s*\d+|cadastro\s+de\s+reserva)\b/i),
          remuneracao: detailLine(/\b(?:remuneracao|vencimento|subsidio|salario)\b|r\$/i),
          requisitos: detailLine(/\b(?:requisitos?|escolaridade|nivel\s+(?:medio|superior|tecnico)|diploma)\b/i)
        }
      };
    });
  }

  function detectExam(pages) {
    const text = pages.map(page => page.text).join("\n");
    const normalized = fold(text);
    const bankPatterns = [
      ["CEBRASPE/CESPE", /\b(?:cebraspe|cespe)\b/i, "certo_errado"],
      ["FGV", /\b(?:fundacao getulio vargas|fgv)\b/i, "multipla_escolha"],
      ["FCC", /\b(?:fundacao carlos chagas|fcc)\b/i, "multipla_escolha"],
      ["VUNESP", /\bvunesp\b/i, "multipla_escolha"],
      ["IBFC", /\bibfc\b/i, "multipla_escolha"],
      ["Instituto AOCP", /\b(?:instituto\s+)?aocp\b/i, "multipla_escolha"],
      ["Instituto Quadrix", /\bquadrix\b/i, "multipla_escolha"]
    ];
    const bank = bankPatterns.find(([, pattern]) => pattern.test(normalized));
    const counts = [...normalized.matchAll(/\b(\d{1,3})\s+questoes?\b/g)]
      .map(match => Number(match[1]))
      .filter(value => value >= 5 && value <= 200);
    const durationMatch = normalized.match(/\b(?:duracao|durara|tempo)\D{0,35}(\d{1,2})\s*horas?\b/i)
      || normalized.match(/\b(\d{1,2})\s*horas?\s+de\s+duracao\b/i);

    return {
      bank: bank?.[0] || null,
      format: bank?.[2] || null,
      supported: Boolean(bank),
      questionCount: counts.length ? Math.max(...counts) : null,
      durationHours: durationMatch ? Number(durationMatch[1]) : null
    };
  }

  function analyze(pages) {
    const safePages = Array.isArray(pages)
      ? pages.map((page, index) => ({ page: Number(page.page) || index + 1, text: String(page.text || "") }))
      : [];
    const totalCharacters = safePages.reduce((sum, page) => sum + clean(page.text).length, 0);

    const cargos = collectCargoNames(safePages);
    const vagas = collectContexts(safePages, /\b(?:vagas?|cadastro\s+de\s+reserva|reserva\s+de\s+vagas?)\b/i, {
      limit: 6,
      radius: 0,
      score: text => (/\b\d+\s+vagas?\b/i.test(fold(text)) ? 4 : 0) + (/cadastro\s+de\s+reserva/i.test(fold(text)) ? 2 : 0)
    });
    const remuneracao = collectContexts(safePages, /\b(?:remuneracao|vencimento|subsidio|salario|retribuicao|beneficios?)\b|r\$/i, {
      limit: 7,
      radius: 0,
      accept: text => !/taxa\s+de\s+inscricao/i.test(fold(text)) || /remuneracao|vencimento|subsidio|salario|beneficio/i.test(fold(text)),
      score: text => (/r\$\s*[\d.]+(?:,\d{2})?/i.test(text) ? 4 : 0) + (/remuneracao|vencimento|subsidio|salario/i.test(fold(text)) ? 2 : 0)
    });
    const datas = collectContexts(safePages, /\b(?:inscricoes?|provas?|cronograma|isencao|resultado|recursos?|pagamento|homologacao|convocacao)\b/i, {
      limit: 10,
      radius: 0,
      accept: text => /\b(?:[0-3]?\d[\/.-][01]?\d[\/.-](?:20)?\d{2}|[0-3]?\d\s+de\s+[a-zç]+\s+de\s+20\d{2}|\d{1,2}h(?:\d{2})?)\b/i.test(fold(text)),
      score: text => (/inscric|prova|isencao/i.test(fold(text)) ? 3 : 0) + (/\b(?:[0-3]?\d[\/.-][01]?\d[\/.-](?:20)?\d{2})\b/.test(text) ? 2 : 0)
    });
    const materias = collectNamedItems(safePages, SUBJECTS);
    const requisitos = collectContexts(safePages, /\b(?:requisitos?|escolaridade|diploma|certificado|graduacao|nivel\s+(?:medio|superior|tecnico)|registro\s+(?:no|em)\s+conselho|idade\s+minima)\b/i, {
      limit: 7,
      radius: 0,
      score: text => (/requisito\s*[:\-–]/i.test(fold(text)) ? 3 : 0) + (/nivel\s+(?:medio|superior|tecnico)|diploma|registro\s+(?:no|em)\s+conselho/i.test(fold(text)) ? 2 : 0)
    });
    const etapas = collectNamedItems(safePages, STAGES);
    const atencao = collectContexts(safePages, /\b(?:taxa\s+de\s+inscricao|valor\s+da\s+inscricao|jornada\s+de\s+trabalho|carga\s+horaria|validade\s+do\s+concurso|prazo\s+de\s+validade|lotacao|regime\s+juridico|cotas?|pessoa\s+com\s+deficiencia)\b/i, {
      limit: 8,
      radius: 0,
      score: text => (/r\$|\d+\s*horas?/i.test(fold(text)) ? 3 : 0) + (/taxa|validade|carga\s+horaria/i.test(fold(text)) ? 2 : 0)
    });

    const sections = { cargos, vagas, remuneracao, datas, materias, requisitos, etapas, atencao };
    const subjectNames = materias.map(item => item.text);
    const cargoProfiles = collectCargoProfiles(safePages, cargos, subjectNames);
    const exam = detectExam(safePages);
    const findingCount = Object.values(sections).reduce((sum, items) => sum + items.length, 0);

    return {
      sections,
      cargoProfiles,
      exam,
      metrics: {
        pages: safePages.length,
        characters: totalCharacters,
        findings: findingCount,
        coverage: Math.round((Object.values(sections).filter(items => items.length).length / Object.keys(sections).length) * 100)
      },
      warning: totalCharacters < Math.max(180, safePages.length * 45)
        ? "O PDF parece ter pouco texto selecionável. Se ele for escaneado como imagem, alguns dados podem não ter sido identificados."
        : "A análise local encontrou os principais trechos do documento. Itens não localizados devem ser conferidos no PDF original."
    };
  }

  return { analyze, fold, clean, findSubjectsInText };
});

const clean = value =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const fold = value =>
  clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const labelLevel = value => {
  const text = fold(value).replace(/[–—]/g, "-");
  if (/^(?:nivel\s+|ensino\s+)?(?:medio\s*-\s*tecnico|medio\s+tecnico|tecnico)$/.test(text)) return "Técnico";
  if (/^(?:nivel\s+|ensino\s+)?superior$/.test(text)) return "Superior";
  if (/^(?:nivel\s+|ensino\s+)?medio$/.test(text)) return "Médio";
  if (/^(?:nivel\s+|ensino\s+)?fundamental$/.test(text)) return "Fundamental";
  return null;
};

const evidenceLevel = cargo => {
  const evidence = clean(cargo?.escolaridadeEvidencia?.trecho);
  if (!evidence) return null;

  let text = fold(evidence).replace(/[–—]/g, "-");
  [cargo?.codigo, cargo?.nome, cargo?.especialidade]
    .map(fold)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .forEach(identity => {
      text = text.split(identity).join(" ");
    });

  text = text.replace(/medio\s*-\s*tecnico|medio\s+tecnico/g, "tecnico");
  const levels = new Set();
  if (/\bsuperior\b/.test(text)) levels.add("Superior");
  if (/\btecnico\b/.test(text)) levels.add("Técnico");
  if (/\bmedio\b/.test(text)) levels.add("Médio");
  if (/\bfundamental\b/.test(text)) levels.add("Fundamental");
  return levels.size === 1 ? [...levels][0] : null;
};

export function sanitizeCatalogSchooling(cargo) {
  const structuredLevel = labelLevel(cargo?.escolaridade);
  const provenLevel = evidenceLevel(cargo);
  const valid = Boolean(structuredLevel && structuredLevel === provenLevel);

  return {
    ...cargo,
    escolaridade: valid ? provenLevel : null,
    escolaridadeEvidencia: valid
      ? {
          ...(cargo?.escolaridadeEvidencia?.documentId
            ? { documentId: cargo.escolaridadeEvidencia.documentId }
            : {}),
          ...(cargo?.escolaridadeEvidencia?.documentName
            ? { documentName: cargo.escolaridadeEvidencia.documentName }
            : {}),
          ...(Number.isInteger(cargo?.escolaridadeEvidencia?.page)
            ? { page: cargo.escolaridadeEvidencia.page }
            : {}),
          secao: clean(cargo?.escolaridadeEvidencia?.secao) || null,
          trecho: clean(cargo?.escolaridadeEvidencia?.trecho)
        }
      : { secao: null, trecho: null }
  };
}

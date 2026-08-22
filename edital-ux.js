(function attachEditalUx(global) {
  "use strict";

  function clean(value) {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  }

  function fold(value) {
    return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function normalizedLevel(value) {
    const text = fold(value).replace(/[–—]/g, "-");
    if (/^(?:nivel\s+|ensino\s+)?(?:medio\s*-\s*tecnico|medio\s+tecnico|tecnico)$/.test(text)) return "Técnico";
    if (/^(?:nivel\s+|ensino\s+)?superior$/.test(text)) return "Superior";
    if (/^(?:nivel\s+|ensino\s+)?medio$/.test(text)) return "Médio";
    if (/^(?:nivel\s+|ensino\s+)?fundamental$/.test(text)) return "Fundamental";
    return null;
  }

  function cargoEvidenceText(cargo) {
    return clean(cargo?.evidencia?.trecho || cargo?.evidence?.trecho);
  }

  function schoolingEvidenceText(cargo) {
    return clean(cargo?.escolaridadeEvidencia?.trecho);
  }

  function cargoLevelFromEvidence(cargo) {
    const structuredLevel = normalizedLevel(cargo?.escolaridade);
    const evidence = schoolingEvidenceText(cargo);
    if (!structuredLevel || !evidence) return null;

    let text = fold(evidence).replace(/[–—]/g, "-");
    [cargo?.codigo, cargo?.nome, cargo?.especialidade]
      .map(fold)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .forEach(identity => {
        text = text.split(identity).join(" ");
      });

    text = text.replace(/medio\s*-\s*tecnico|medio\s+tecnico/g, "tecnico");
    const evidencedLevels = new Set();
    if (/\bsuperior\b/.test(text)) evidencedLevels.add("Superior");
    if (/\btecnico\b/.test(text)) evidencedLevels.add("Técnico");
    if (/\bmedio\b/.test(text)) evidencedLevels.add("Médio");
    if (/\bfundamental\b/.test(text)) evidencedLevels.add("Fundamental");
    const evidencedLevel = evidencedLevels.size === 1 ? [...evidencedLevels][0] : null;
    return evidencedLevel === structuredLevel ? evidencedLevel : null;
  }

  function cargoKey(cargo) {
    return [cargo?.codigo, cargo?.nome, cargo?.especialidade, cargo?.localidade, cargo?.uf]
      .map(fold)
      .filter(Boolean)
      .join("|");
  }

  function cargoLabel(cargo) {
    return [clean(cargo?.nome), clean(cargo?.especialidade)].filter(Boolean).join(" — ");
  }

  function groupCatalogByEvidenceLevel(cargos) {
    const groupsByKey = new Map();
    const unresolved = [];

    (Array.isArray(cargos) ? cargos : []).forEach(cargo => {
      const level = cargoLevelFromEvidence(cargo);
      if (!level) {
        unresolved.push(cargo);
        return;
      }
      const key = fold(level);
      if (!groupsByKey.has(key)) groupsByKey.set(key, { key, level, cargos: [] });
      groupsByKey.get(key).cargos.push(cargo);
    });

    return { groups: [...groupsByKey.values()], unresolved };
  }

  global.EditalUx = {
    cargoEvidenceText,
    schoolingEvidenceText,
    cargoKey,
    cargoLabel,
    cargoLevelFromEvidence,
    groupCatalogByEvidenceLevel
  };
})(typeof window !== "undefined" ? window : globalThis);

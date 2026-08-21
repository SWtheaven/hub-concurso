(function attachEditalUx(global) {
  "use strict";

  const LEVEL_PATTERNS = [
    /^(?:nível\s+)?(?:ensino\s+)?fundamental(?:\s+(?:incompleto|completo))?$/i,
    /^(?:nível\s+)?(?:ensino\s+)?médio(?:\s*[-–—]\s*técnico|\s+técnico)?(?:\s+(?:incompleto|completo))?$/i,
    /^(?:nível\s+)?(?:ensino\s+)?técnico(?:\s+(?:incompleto|completo))?$/i,
    /^(?:nível\s+)?(?:ensino\s+)?superior(?:\s+(?:incompleto|completo))?$/i
  ];

  function clean(value) {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  }

  function fold(value) {
    return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function isLevelEvidence(value) {
    const text = clean(value);
    return Boolean(text) && LEVEL_PATTERNS.some(pattern => pattern.test(text));
  }

  function cargoEvidenceText(cargo) {
    return clean(cargo?.evidencia?.trecho || cargo?.evidence?.trecho);
  }

  function cargoLevelFromEvidence(cargo) {
    const evidence = cargoEvidenceText(cargo);
    if (!evidence) return null;

    const evidenceParts = evidence
      .split(/[|\n]/)
      .map(clean)
      .filter(Boolean);
    const cargoIdentityParts = [cargo?.codigo, cargo?.nome, cargo?.especialidade]
      .map(fold)
      .filter(Boolean);
    const evidencedPart = evidenceParts.find(part =>
      isLevelEvidence(part) && !cargoIdentityParts.includes(fold(part))
    );
    if (evidencedPart) return evidencedPart;

    const labeled = evidence.match(/(?:nível(?:\s+de\s+escolaridade)?|escolaridade)\s*[:=-]\s*([^|;,\n]+)/i);
    const labeledLevel = clean(labeled?.[1]);
    if (isLevelEvidence(labeledLevel)) return labeledLevel;

    const structuredCandidates = [
      cargo?.nivelEscolaridade,
      cargo?.escolaridade,
      cargo?.nivel
    ].map(clean).filter(Boolean);
    return structuredCandidates.find(candidate =>
      isLevelEvidence(candidate) && evidenceParts.some(part => fold(part) === fold(candidate))
    ) || null;
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
    cargoKey,
    cargoLabel,
    cargoLevelFromEvidence,
    groupCatalogByEvidenceLevel
  };
})(typeof window !== "undefined" ? window : globalThis);

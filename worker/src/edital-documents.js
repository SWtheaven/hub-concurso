const clean = value =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const fold = value => clean(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const sha256 = async value => {
  const digest = new Uint8Array(await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  ));
  return `sha256:${[...digest]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")}`;
};

const badRequest = message => Object.assign(new Error(message), { status: 400 });

const normalizedPage = page => {
  const number = Number(page?.page);
  const text = typeof page?.text === "string" ? page.text.trim() : null;
  if (!Number.isInteger(number) || number < 1 || text === null) return null;
  return { page: number, text };
};

const normalizedDocument = document => {
  if (!document || typeof document !== "object" || Array.isArray(document))
    return null;

  const name = clean(document.name);
  const hash = clean(document.hash);
  const pages = Array.isArray(document.pages)
    ? document.pages.map(normalizedPage).filter(Boolean)
    : [];

  if (!name || !/^sha256:[a-f0-9]{64}$/i.test(hash) || !pages.length)
    return null;

  const suppliedId = clean(document.id);
  const safeId = /^[a-zA-Z0-9._-]{1,100}$/.test(suppliedId) &&
    !["__proto__", "prototype", "constructor"].includes(suppliedId)
    ? suppliedId
    : null;

  return {
    id: safeId || `doc-${hash.slice(7, 23).toLowerCase()}`,
    name,
    hash: hash.toLowerCase(),
    sourceUrl: clean(document.sourceUrl ?? document.source_url) || null,
    pages
  };
};

export async function combinedPackageHash(hashes) {
  const unique = [...new Set((Array.isArray(hashes) ? hashes : [])
    .map(value => clean(value).toLowerCase())
    .filter(Boolean))].sort();
  if (!unique.length) return null;
  if (unique.length === 1) return unique[0];
  return sha256(unique.join("\n"));
}

export async function normalizeEditalDocuments(data) {
  if (Array.isArray(data?.documents)) {
    if (!data.documents.length) throw badRequest("documents deve conter ao menos um PDF");

    const documents = [];
    const seenHashes = new Set();
    const seenIds = new Set();
    for (const raw of data.documents) {
      const document = normalizedDocument(raw);
      if (!document) throw badRequest("documents contém documento inválido");
      if (seenHashes.has(document.hash)) continue;
      seenHashes.add(document.hash);
      if (seenIds.has(document.id))
        document.id = `doc-${document.hash.slice(7, 23)}`;
      seenIds.add(document.id);
      documents.push(document);
    }

    const textLength = documents.reduce(
      (total, document) => total + document.pages.reduce(
        (subtotal, page) => subtotal + page.text.length,
        0
      ),
      0
    );
    if (textLength < 100) throw badRequest("documents não contém texto suficiente");

    const packageHash = await combinedPackageHash(documents.map(document => document.hash));
    const suppliedHash = clean(data.packageHash ?? data.package_hash).toLowerCase();
    if (suppliedHash && suppliedHash !== packageHash)
      throw badRequest("packageHash não corresponde aos documentos enviados");

    return { mode: "documents", documents, packageHash };
  }

  const editalText = typeof data?.editalText === "string"
    ? data.editalText.trim()
    : "";
  if (editalText.length < 100) throw badRequest("editalText inválido");

  return {
    mode: "legacy",
    documents: [{
      id: "legacy-edital",
      name: "edital.pdf",
      hash: null,
      sourceUrl: null,
      pages: [{ page: 1, text: editalText }]
    }],
    packageHash: null,
    editalText
  };
}

export function documentsForPrompt(documentPackage) {
  if (documentPackage.mode === "legacy") return documentPackage.editalText;
  return JSON.stringify({
    packageHash: documentPackage.packageHash,
    documents: documentPackage.documents
  });
}

export function sanitizeDocumentEvidence(evidence, documentPackage) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence))
    return null;

  const trecho = clean(evidence.trecho);
  if (!trecho) return null;

  if (documentPackage.mode === "legacy") {
    return {
      secao: clean(evidence.secao ?? evidence.section) || null,
      trecho
    };
  }

  const documentId = clean(evidence.documentId ?? evidence.document_id);
  const documentName = clean(evidence.documentName ?? evidence.document_name);
  const document = documentId
    ? documentPackage.documents.find(item => item.id === documentId)
    : documentPackage.documents.find(item =>
        documentName && fold(item.name) === fold(documentName)
      );
  const pageNumber = Number(evidence.page);
  const page = document?.pages.find(item => item.page === pageNumber);

  if (!document || !page || !fold(page.text).includes(fold(trecho))) return null;

  return {
    documentId: document.id,
    documentName: document.name,
    page: page.page,
    secao: clean(evidence.secao ?? evidence.section) || null,
    trecho
  };
}

export function dedupeBy(values, keyOf) {
  const result = [];
  const seen = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    const key = fold(keyOf(value));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

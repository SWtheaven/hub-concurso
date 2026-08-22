(function (global) {
  "use strict";

  const clean = value => typeof value === "string" ? value.trim() : "";

  async function sha256Bytes(bytes) {
    const digest = new Uint8Array(await global.crypto.subtle.digest("SHA-256", bytes));
    return `sha256:${[...digest]
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  async function sha256File(file) {
    return sha256Bytes(await file.arrayBuffer());
  }

  async function combinedHash(documents) {
    const hashes = [...new Set((Array.isArray(documents) ? documents : [])
      .map(document => clean(document?.hash).toLowerCase())
      .filter(Boolean))].sort();
    if (!hashes.length) return null;
    if (hashes.length === 1) return hashes[0];
    return sha256Bytes(new TextEncoder().encode(hashes.join("\n")));
  }

  function documentId(hash) {
    return `doc-${String(hash).replace(/^sha256:/, "").slice(0, 16)}`;
  }

  function dedupeDocuments(documents) {
    const seen = new Set();
    return (Array.isArray(documents) ? documents : []).filter(document => {
      const hash = clean(document?.hash).toLowerCase();
      if (!hash || seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });
  }

  function apiDocuments(documents) {
    return dedupeDocuments(documents).map(document => ({
      id: document.id,
      name: document.name,
      hash: document.hash,
      sourceUrl: clean(document.sourceUrl) || null,
      pages: document.pages.map(page => ({ page: page.page, text: page.text }))
    }));
  }

  function manifest(documents) {
    return apiDocuments(documents).map(document => ({
      id: document.id,
      name: document.name,
      hash: document.hash,
      sourceUrl: document.sourceUrl,
      pageCount: document.pages.length
    }));
  }

  global.EditalPackage = Object.freeze({
    apiDocuments,
    combinedHash,
    dedupeDocuments,
    documentId,
    manifest,
    sha256File
  });
})(window);

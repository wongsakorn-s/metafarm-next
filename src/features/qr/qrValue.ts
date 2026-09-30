const codePattern = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,39}$/u;

function normalizeCode(value: string): string | null {
  const code = value.trim().toUpperCase();
  return codePattern.test(code) ? code : null;
}

export function parseScannedQr(value: string, origin: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (!raw.includes("://")) return normalizeCode(raw);
  try {
    const url = new URL(raw);
    if (url.origin !== origin || url.search || url.hash) return null;
    const match = /^\/admin\/qr\/([^/]+)\/?$/.exec(url.pathname);
    return match ? normalizeCode(decodeURIComponent(match[1])) : null;
  } catch {
    return null;
  }
}

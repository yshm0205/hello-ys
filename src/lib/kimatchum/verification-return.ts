type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const key = (request: string) => `kimatchum.verify:${request}`;
const validToken = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(value);

export function keepVerification(storage: TokenStorage, request: string, incoming: string | null, now = Date.now()): string {
  if (!/^[a-f0-9]{32}$/.test(request)) return '';
  if (validToken(incoming)) {
    storage.setItem(key(request), JSON.stringify({token: incoming, expires: now + 30 * 60 * 1000}));
    return incoming;
  }
  try {
    const saved = JSON.parse(storage.getItem(key(request)) || 'null');
    if (saved && validToken(saved.token) && typeof saved.expires === 'number' && saved.expires > now) return saved.token;
  } catch { /* Invalid or stale per-tab state is discarded below. */ }
  storage.removeItem(key(request));
  return '';
}

export function clearVerification(storage: TokenStorage, request: string): void {
  storage.removeItem(key(request));
}

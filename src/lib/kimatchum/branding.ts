export function isKimatchumDestination(value: string | null | undefined): boolean {
  return typeof value === 'string' && /^\/kimatchum(?:[/?#]|$)/.test(value);
}

export function isKimatchumSurface(pathname: string, redirect?: string | null): boolean {
  const path = pathname.replace(/^\/(?:ko|en)(?=\/|$)/, '') || '/';
  return isKimatchumDestination(path) || (path === '/login' && isKimatchumDestination(redirect));
}

// Resolve retained legacy URLs without rewriting stored references or using their host.
export function privateStoragePath(source: string, bucket: string): string | null {
  let path: string;
  const prefix = `storage://${bucket}/`;
  if (source.startsWith(prefix)) path = source.slice(prefix.length);
  else {
    try {
      const url = new URL(source);
      const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
      if (!match || match[1] !== bucket) return null;
      path = decodeURIComponent(match[2]);
    } catch { return null; }
  }
  if (!path || path.includes('\0') || path.startsWith('/') || path.split('/').some(part => part === '..' || part === '.')) return null;
  return path;
}

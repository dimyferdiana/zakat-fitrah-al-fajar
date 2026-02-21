declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// Web API globals that are available in Deno
declare global {
  // These are already available in Deno, but we're being explicit for TypeScript
  class Response {
    constructor(body?: BodyInit | null, init?: ResponseInit);
    static error(): Response;
    static redirect(url: string | URL, status?: number): Response;
  }

  interface ResponseInit {
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
  }

  type BodyInit = string | Blob | ArrayBufferView;
  type HeadersInit = string[][] | Record<string, string>;

  const console: {
    log(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
  };
}



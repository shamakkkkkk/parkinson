/**
 * Centralized, typed application configuration.
 *
 * All values are read from environment variables (see `.env.example`).
 * Nothing sensitive (secrets, credentials) is hardcoded in source anymore -
 * that was a real security issue in the previous version of this file
 * (the JWT secret was a literal string committed to the repo).
 */
export interface AppConfig {
  port: number;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origins: string[];
  };
  proxy: {
    prefix: string;
    target?: string;
    timeoutMs: number;
  };
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export default (): AppConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  // In production we refuse to boot with a default secret so nobody ships
  // this to a clinical deployment with a guessable JWT key by accident.
  const jwtSecret = isProduction
    ? requireEnv('JWT_SECRET')
    : (process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me');

  return {
    port: Number(process.env.PORT ?? 3001),
    jwt: {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    },
    cors: {
      origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    },
    proxy: {
      prefix: process.env.PROXY_PREFIX ?? '/data',
      target: process.env.PROXY_TARGET,
      timeoutMs: Number(process.env.PROXY_TIMEOUT_MS ?? 30_000),
    },
  };
};

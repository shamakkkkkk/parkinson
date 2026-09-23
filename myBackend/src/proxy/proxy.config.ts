import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../common/config/configuration';

export interface ProxyConfig {
  prefix: string;
  target?: URL;
  timeoutMs: number;
}

/**
 * Thin wrapper around ConfigService so the proxy config is read once from
 * Nest's config layer instead of hitting `process.env` directly on every
 * single request (as the previous implementation did).
 */
@Injectable()
export class ProxyConfigProvider {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  get(): ProxyConfig {
    const target = this.configService.get('proxy.target', { infer: true });

    return {
      prefix: normalizePrefix(
        this.configService.get('proxy.prefix', { infer: true }),
      ),
      target: target ? new URL(target) : undefined,
      timeoutMs: this.configService.get('proxy.timeoutMs', { infer: true }),
    };
  }
}

function normalizePrefix(prefix: string): string {
  const trimmed = prefix.trim();

  if (!trimmed || trimmed === '/') {
    return '/';
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

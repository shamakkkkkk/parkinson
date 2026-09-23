import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { RequestOptions } from 'node:https';
import type { NextFunction, Request, Response } from 'express';
import { ProxyConfigProvider } from './proxy.config';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

/**
 * Forwards requests under `proxy.prefix` (default `/data`, see
 * `common/config/configuration.ts`) to the external data-platform /
 * experiment-api service, so the browser only ever needs to know about this
 * backend, not about the upstream sensor-data service directly.
 *
 * Every proxied request must carry a valid `Authorization: Bearer <jwt>`
 * header - this is a plain Express middleware (it runs before Nest's own
 * routing/guards), so authentication is checked here explicitly rather than
 * via a `@UseGuards()` decorator. Previously this proxy existed in the
 * codebase but nothing actually required a token to use it, which
 * contradicted this project's own architecture diagram (React -> NestJS
 * auth guard -> Data Platform).
 */
@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProxyMiddleware.name);

  constructor(
    private readonly proxyConfigProvider: ProxyConfigProvider,
    private readonly jwtService: JwtService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const config = this.proxyConfigProvider.get();

    if (!this.shouldProxy(req.path, config.prefix)) {
      next();
      return;
    }

    if (!config.target) {
      res.status(503).json({
        message: 'Proxy target is not configured. Set PROXY_TARGET to enable proxying.',
      });
      return;
    }

    try {
      this.assertAuthenticated(req);
    } catch (error) {
      res.status(401).json({
        message: error instanceof Error ? error.message : 'Unauthorized',
      });
      return;
    }

    const upstreamUrl = this.buildUpstreamUrl(req.originalUrl, config.prefix, config.target);
    const body = this.getSerializedBody(req);
    const headers = this.getForwardHeaders(req, config.target, body);

    const options: RequestOptions = {
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port,
      method: req.method,
      path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
      headers,
      timeout: config.timeoutMs,
    };

    const transport = upstreamUrl.protocol === 'https:' ? httpsRequest : httpRequest;
    const proxyReq = transport(options, (proxyRes) => {
      res.status(proxyRes.statusCode ?? 502);

      for (const [header, value] of Object.entries(proxyRes.headers)) {
        if (value !== undefined && !HOP_BY_HOP_HEADERS.has(header.toLowerCase())) {
          res.setHeader(header, value);
        }
      }

      proxyRes.pipe(res);
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy(new Error('Proxy request timed out'));
    });

    proxyReq.on('error', (error) => {
      this.logger.error(`Proxy request failed: ${error.message}`);

      if (!res.headersSent) {
        res.status(502).json({ message: 'Proxy request failed' });
      } else {
        res.end();
      }
    });

    if (body) {
      proxyReq.end(body);
      return;
    }

    req.pipe(proxyReq);
  }

  private assertAuthenticated(req: Request): void {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private shouldProxy(path: string, prefix: string): boolean {
    return prefix === '/' || path === prefix || path.startsWith(`${prefix}/`);
  }

  private buildUpstreamUrl(originalUrl: string, prefix: string, target: URL): URL {
    const targetUrl = new URL(target);
    const incomingPath = originalUrl.split('?')[0] ?? '/';
    const query = originalUrl.includes('?') ? originalUrl.slice(originalUrl.indexOf('?')) : '';
    const forwardedPath =
      prefix === '/'
        ? incomingPath
        : incomingPath.replace(new RegExp(`^${escapeRegExp(prefix)}(?=/|$)`), '') || '/';

    targetUrl.pathname = joinPaths(target.pathname, forwardedPath);
    targetUrl.search = query;

    return targetUrl;
  }

  private getForwardHeaders(req: Request, target: URL, body?: Buffer): RequestOptions['headers'] {
    const headers: Record<string, string | string[] | number> = {};

    for (const [header, value] of Object.entries(req.headers)) {
      if (value !== undefined && !HOP_BY_HOP_HEADERS.has(header.toLowerCase())) {
        headers[header] = value;
      }
    }

    headers.host = target.host;
    headers['x-forwarded-host'] = req.get('host') ?? '';
    headers['x-forwarded-proto'] = req.protocol;
    headers['x-forwarded-for'] = req.ip ?? '';

    if (body) {
      headers['content-length'] = body.length;
    }

    return headers;
  }

  private getSerializedBody(req: Request): Buffer | undefined {
    if (req.body === undefined || req.body === null) {
      return undefined;
    }

    if (Buffer.isBuffer(req.body)) {
      return req.body;
    }

    if (typeof req.body === 'string') {
      return req.body.length > 0 ? Buffer.from(req.body) : undefined;
    }

    // Express's json() body-parser sets req.body to `{}` for requests with
    // no real payload (e.g. our POST .../recording/start calls, or any
    // GET/DELETE). Forwarding that as a literal "{}" body with a
    // Content-Length header on every such request is harmless to
    // experiment-api in practice, but is semantically wrong - treat an
    // empty object the same as "no body".
    if (typeof req.body === 'object' && Object.keys(req.body).length === 0) {
      return undefined;
    }

    return Buffer.from(JSON.stringify(req.body));
  }
}

function joinPaths(basePath: string, forwardedPath: string): string {
  const base = basePath.replace(/\/+$/, '');
  const forwarded = forwardedPath.replace(/^\/+/, '');

  return `/${[base.replace(/^\/+/, ''), forwarded].filter(Boolean).join('/')}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

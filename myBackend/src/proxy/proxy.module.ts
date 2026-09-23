import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ProxyConfigProvider } from './proxy.config';
import { ProxyMiddleware } from './proxy.middleware';

// AuthModule exports an already-configured JwtModule (with the real secret
// wired up via ConfigService), so importing it here is enough to inject
// JwtService into ProxyMiddleware for verifying bearer tokens.
@Module({
  imports: [ConfigModule, AuthModule],
  providers: [ProxyConfigProvider],
})
export class ProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProxyMiddleware).forRoutes({
      path: '{*path}',
      method: RequestMethod.ALL,
    });
  }
}

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { IncomingHttpHeaders } from 'http';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';

const loadEsm = new Function('specifier', 'return import(specifier)') as <T = any>(
  specifier: string,
) => Promise<T>;

export type AppUser = {
  id: number;
  name: string;
  email: string;
  role: 'member' | 'admin';
};

@Injectable()
export class BetterAuthService {
  private authInstance: any;

  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private config: ConfigService,
  ) {}

  async getAuth() {
    if (this.authInstance) {
      return this.authInstance;
    }

    const [{ betterAuth }, { drizzleAdapter }] = await Promise.all([
      loadEsm<{ betterAuth: any }>('better-auth'),
      loadEsm<{ drizzleAdapter: any }>('@better-auth/drizzle-adapter'),
    ]);

    this.authInstance = betterAuth({
      baseURL: this.config.get<string>('BETTER_AUTH_URL', 'http://localhost:3000'),
      secret: this.config.get<string>('BETTER_AUTH_SECRET', 'development-better-auth-secret'),
      trustedOrigins: this.config
        .get<string>('BETTER_AUTH_TRUSTED_ORIGINS', 'http://localhost:3001')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      database: drizzleAdapter(this.db, {
        provider: 'pg',
        schema: {
          user: schema.authUsers,
          session: schema.authSessions,
          account: schema.authAccounts,
          verification: schema.authVerifications,
        },
      }),
      socialProviders: {
        google: {
          clientId: this.config.get<string>('GOOGLE_CLIENT_ID', ''),
          clientSecret: this.config.get<string>('GOOGLE_CLIENT_SECRET', ''),
        },
        microsoft: {
          clientId: this.config.get<string>('MICROSOFT_CLIENT_ID', ''),
          clientSecret: this.config.get<string>('MICROSOFT_CLIENT_SECRET', ''),
          tenantId: this.config.get<string>('MICROSOFT_TENANT_ID', 'common'),
          prompt: 'select_account',
        },
      },
    });

    return this.authInstance;
  }

  async getAppUserFromHeaders(headers: IncomingHttpHeaders): Promise<AppUser> {
    const auth = await this.getAuth();
    const { fromNodeHeaders } = await loadEsm<{ fromNodeHeaders: any }>('better-auth/node');
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(headers),
    });

    if (!session?.user?.email) {
      throw new UnauthorizedException('Authentication required');
    }

    return this.findOrCreateAppUser(session.user.email, session.user.name ?? session.user.email);
  }

  private async findOrCreateAppUser(email: string, name: string): Promise<AppUser> {
    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail));

    if (existing) {
      return existing;
    }

    const [created] = await this.db
      .insert(schema.users)
      .values({
        name,
        email: normalizedEmail,
        password: await bcrypt.hash(`oauth:${randomUUID()}`, 10),
        role: 'member',
      })
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
      });

    return created;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import { AppUser } from './better-auth.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail));

    if (!user) {
      throw new UnauthorizedException('Nesprávný email nebo heslo');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Nesprávný email nebo heslo');
    }

    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getUserFromAccessToken(token: string): Promise<AppUser> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Authentication required');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Authentication required');
    }

    const [user] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(eq(schema.users.id, payload.sub));

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    return user;
  }
}

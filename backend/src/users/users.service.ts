import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  findAll() {
    return this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users);
  }

  async findOne(id: number) {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id));

    if (!user) throw new NotFoundException(`Uživatel #${id} nenalezen`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const [user] = await this.db
      .insert(schema.users)
      .values({ ...dto, password: hashedPassword })
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      });
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    const patch: Partial<typeof schema.users.$inferInsert> = { ...dto };
    if (dto.password) {
      patch.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }
    const [user] = await this.db
      .update(schema.users)
      .set(patch)
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      });
    return user;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }
}

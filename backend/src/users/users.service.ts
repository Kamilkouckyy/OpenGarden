import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
    const [user] = await this.db
      .insert(schema.users)
      .values(dto)
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
    const [user] = await this.db
      .update(schema.users)
      .set(dto)
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

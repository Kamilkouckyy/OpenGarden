import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateGardenBedDto } from './dto/create-garden-bed.dto';
import { UpdateGardenBedDto } from './dto/update-garden-bed.dto';

@Injectable()
export class GardenBedsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  findAll() {
    return this.db.select().from(schema.gardenBeds);
  }

  async findOne(id: number) {
    const [bed] = await this.db
      .select()
      .from(schema.gardenBeds)
      .where(eq(schema.gardenBeds.id, id));
    if (!bed) throw new NotFoundException(`Záhon #${id} nenalezen`);
    return bed;
  }

  async create(dto: CreateGardenBedDto) {
    const [bed] = await this.db.insert(schema.gardenBeds).values(dto).returning();
    return bed;
  }

  async update(id: number, dto: UpdateGardenBedDto) {
    await this.findOne(id);
    const [bed] = await this.db
      .update(schema.gardenBeds)
      .set(dto)
      .where(eq(schema.gardenBeds.id, id))
      .returning();
    return bed;
  }

  async remove(id: number) {
    await this.findOne(id);
    // Cascade: smaž linked tasks a reports (dle AGENTS.md – System actor)
    await this.db
      .delete(schema.tasks)
      .where(
        and(
          eq(schema.tasks.linkedType, 'plot'),
          eq(schema.tasks.linkedId, id),
        ),
      );
    await this.db.delete(schema.gardenBeds).where(eq(schema.gardenBeds.id, id));
  }

  async claim(bedId: number, userId: number) {
    const bed = await this.findOne(bedId);

    if (bed.status !== 'available') {
      throw new BadRequestException('Záhon není volný');
    }

    // Gardener může mít max 1 záhon
    const [existing] = await this.db
      .select()
      .from(schema.gardenBeds)
      .where(eq(schema.gardenBeds.userId, userId));
    if (existing) {
      throw new BadRequestException('Uživatel již má rezervovaný záhon');
    }

    const [user] = await this.db
      .select({ name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    if (!user) throw new NotFoundException(`Uživatel #${userId} nenalezen`);

    const [updated] = await this.db
      .update(schema.gardenBeds)
      .set({
        status: 'reserved',
        userId,
        ownerName: user.name,
        reservedAt: new Date(),
      })
      .where(eq(schema.gardenBeds.id, bedId))
      .returning();
    return updated;
  }

  async release(bedId: number, userId: number, isAdmin: boolean) {
    const bed = await this.findOne(bedId);

    if (bed.status !== 'reserved') {
      throw new BadRequestException('Záhon není rezervován');
    }
    if (!isAdmin && bed.userId !== userId) {
      throw new BadRequestException('Nemáte oprávnění uvolnit tento záhon');
    }

    const [updated] = await this.db
      .update(schema.gardenBeds)
      .set({ status: 'available', userId: null, ownerName: null, reservedAt: null })
      .where(eq(schema.gardenBeds.id, bedId))
      .returning();
    return updated;
  }
}

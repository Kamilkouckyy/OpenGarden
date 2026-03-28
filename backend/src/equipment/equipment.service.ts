import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  findAll() {
    return this.db.select().from(schema.equipment);
  }

  async findOne(id: number) {
    const [item] = await this.db
      .select()
      .from(schema.equipment)
      .where(eq(schema.equipment.id, id));
    if (!item) throw new NotFoundException(`Vybavení #${id} nenalezeno`);
    return item;
  }

  async create(dto: CreateEquipmentDto, createdBy: number) {
    const [item] = await this.db
      .insert(schema.equipment)
      .values({ ...dto, createdBy })
      .returning();
    return item;
  }

  async update(id: number, dto: UpdateEquipmentDto, userId: number, isAdmin: boolean) {
    const item = await this.findOne(id);
    if (!isAdmin && item.createdBy !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může upravovat vybavení');
    }
    const [updated] = await this.db
      .update(schema.equipment)
      .set(dto)
      .where(eq(schema.equipment.id, id))
      .returning();
    return updated;
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    const item = await this.findOne(id);
    if (!isAdmin && item.createdBy !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může smazat vybavení');
    }
    await this.db.delete(schema.equipment).where(eq(schema.equipment.id, id));
  }

  // Voláno System actorem – při vyřešení repair reportu
  async markFunctional(id: number) {
    await this.db
      .update(schema.equipment)
      .set({ status: 'ok' })
      .where(eq(schema.equipment.id, id));
  }
}

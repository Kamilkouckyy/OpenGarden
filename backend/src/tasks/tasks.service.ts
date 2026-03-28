import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  findAll(linkedType?: string, linkedId?: number) {
    // Základní filtr – rozšiřovat dle potřeby
    return this.db.select().from(schema.tasks);
  }

  async findOne(id: number) {
    const [task] = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, id));
    if (!task) throw new NotFoundException(`Úkol #${id} nenalezen`);
    return task;
  }

  async create(dto: CreateTaskDto, createdBy: number) {
    if ((dto.linkedType && !dto.linkedId) || (!dto.linkedType && dto.linkedId)) {
      throw new BadRequestException('linkedType a linkedId musí být vyplněny oba nebo ani jeden');
    }

    // Automaticky nastav context z linked entity
    let context = 'General';
    if (dto.linkedType === 'plot' && dto.linkedId) {
      const [bed] = await this.db
        .select({ label: schema.gardenBeds.label })
        .from(schema.gardenBeds)
        .where(eq(schema.gardenBeds.id, dto.linkedId));
      context = bed ? `Plot ${bed.label}` : 'Plot';
    } else if (dto.linkedType === 'report' && dto.linkedId) {
      const [report] = await this.db
        .select({ title: schema.reports.title })
        .from(schema.reports)
        .where(eq(schema.reports.id, dto.linkedId));
      context = report ? `Report: ${report.title}` : 'Report';
    } else if (dto.linkedType === 'event' && dto.linkedId) {
      const [event] = await this.db
        .select({ title: schema.communityEvents.title })
        .from(schema.communityEvents)
        .where(eq(schema.communityEvents.id, dto.linkedId));
      context = event ? `Event: ${event.title}` : 'Event';
    }

    const [task] = await this.db
      .insert(schema.tasks)
      .values({ ...dto, createdBy, context })
      .returning();
    return task;
  }

  async update(id: number, dto: UpdateTaskDto, userId: number, isAdmin: boolean) {
    const task = await this.findOne(id);
    if (!isAdmin && task.createdBy !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může upravovat úkol');
    }
    const [updated] = await this.db
      .update(schema.tasks)
      .set(dto)
      .where(eq(schema.tasks.id, id))
      .returning();
    return updated;
  }

  async toggleStatus(id: number, userId: number, isAdmin: boolean) {
    const task = await this.findOne(id);
    if (!isAdmin && task.createdBy !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může měnit stav úkolu');
    }
    const nextStatus = task.status === 'done' ? 'in_progress' : 'done';
    const [updated] = await this.db
      .update(schema.tasks)
      .set({ status: nextStatus })
      .where(eq(schema.tasks.id, id))
      .returning();
    return updated;
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    const task = await this.findOne(id);
    if (!isAdmin && task.createdBy !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může smazat úkol');
    }
    await this.db.delete(schema.tasks).where(eq(schema.tasks.id, id));
  }

  // Voláno System actorem z jiných service
  async autoCompleteLinked(linkedType: 'plot' | 'report' | 'event', linkedId: number) {
    await this.db
      .update(schema.tasks)
      .set({ status: 'done' })
      .where(
        and(
          eq(schema.tasks.linkedType, linkedType),
          eq(schema.tasks.linkedId, linkedId),
        ),
      );
  }
}

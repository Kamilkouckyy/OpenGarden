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
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateParticipationDto } from './dto/update-participation.dto';

@Injectable()
export class EventsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  findAll() {
    return this.db
      .select({
        id: schema.communityEvents.id,
        title: schema.communityEvents.title,
        description: schema.communityEvents.description,
        photoUrl: schema.communityEvents.photoUrl,
        date: schema.communityEvents.date,
        status: schema.communityEvents.status,
        authorId: schema.communityEvents.authorId,
        authorName: schema.users.name,
        createdAt: schema.communityEvents.createdAt,
      })
      .from(schema.communityEvents)
      .innerJoin(schema.users, eq(schema.communityEvents.authorId, schema.users.id));
  }

  async findOne(id: number) {
    const [event] = await this.db
      .select({
        id: schema.communityEvents.id,
        title: schema.communityEvents.title,
        description: schema.communityEvents.description,
        photoUrl: schema.communityEvents.photoUrl,
        date: schema.communityEvents.date,
        status: schema.communityEvents.status,
        authorId: schema.communityEvents.authorId,
        authorName: schema.users.name,
        createdAt: schema.communityEvents.createdAt,
      })
      .from(schema.communityEvents)
      .innerJoin(schema.users, eq(schema.communityEvents.authorId, schema.users.id))
      .where(eq(schema.communityEvents.id, id));
    if (!event) throw new NotFoundException(`Akce #${id} nenalezena`);
    return event;
  }

  async create(dto: CreateEventDto, authorId: number) {
    if (new Date(dto.date) < new Date()) {
      throw new BadRequestException('Datum akce nemůže být v minulosti');
    }
    const [event] = await this.db
      .insert(schema.communityEvents)
      .values({ ...dto, date: new Date(dto.date), authorId })
      .returning();
    return event;
  }

  async update(id: number, dto: UpdateEventDto, userId: number, isAdmin: boolean) {
    const event = await this.findOne(id);
    if (!isAdmin && event.authorId !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může upravovat akci');
    }
    if (dto.date && new Date(dto.date) < new Date()) {
      throw new BadRequestException('Datum akce nemůže být v minulosti');
    }
    const data: Partial<typeof schema.communityEvents.$inferInsert> = {
      title: dto.title,
      description: dto.description,
      photoUrl: dto.photoUrl,
    };
    if (dto.date) data.date = new Date(dto.date);
    const [updated] = await this.db
      .update(schema.communityEvents)
      .set(data)
      .where(eq(schema.communityEvents.id, id))
      .returning();
    return updated;
  }

  async cancel(id: number, userId: number, isAdmin: boolean) {
    const event = await this.findOne(id);
    if (!isAdmin && event.authorId !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může zrušit akci');
    }
    if (event.status === 'cancelled') {
      throw new BadRequestException('Akce je již zrušena');
    }
    const [updated] = await this.db
      .update(schema.communityEvents)
      .set({ status: 'cancelled' })
      .where(eq(schema.communityEvents.id, id))
      .returning();
    // TODO: implementovat viditelnost tasků až bude visibility field přidán do tasks
    return updated;
  }

  async restore(id: number, userId: number, isAdmin: boolean) {
    const event = await this.findOne(id);
    if (!isAdmin && event.authorId !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může obnovit akci');
    }
    if (event.status === 'active') {
      throw new BadRequestException('Akce již je aktivní');
    }
    const [updated] = await this.db
      .update(schema.communityEvents)
      .set({ status: 'active' })
      .where(eq(schema.communityEvents.id, id))
      .returning();
    return updated;
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    const event = await this.findOne(id);
    if (!isAdmin && event.authorId !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může smazat akci');
    }
    await this.db
      .delete(schema.eventParticipations)
      .where(eq(schema.eventParticipations.eventId, id));
    await this.db.delete(schema.communityEvents).where(eq(schema.communityEvents.id, id));
  }

  async getParticipations(eventId: number) {
    await this.findOne(eventId);
    return this.db
      .select()
      .from(schema.eventParticipations)
      .where(eq(schema.eventParticipations.eventId, eventId));
  }

  async updateParticipation(eventId: number, userId: number, dto: UpdateParticipationDto) {
    const event = await this.findOne(eventId);
    if (event.status === 'cancelled') {
      throw new BadRequestException('Na zrušenou akci nelze nastavit účast');
    }

    const [existing] = await this.db
      .select()
      .from(schema.eventParticipations)
      .where(
        and(
          eq(schema.eventParticipations.eventId, eventId),
          eq(schema.eventParticipations.userId, userId),
        ),
      );

    if (existing) {
      const [updated] = await this.db
        .update(schema.eventParticipations)
        .set({ status: dto.status, updatedAt: new Date() })
        .where(eq(schema.eventParticipations.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(schema.eventParticipations)
      .values({ eventId, userId, status: dto.status })
      .returning();
    return created;
  }
}

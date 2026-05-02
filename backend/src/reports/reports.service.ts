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
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { EquipmentService } from '../equipment/equipment.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private equipmentService: EquipmentService,
    private tasksService: TasksService,
  ) {}

  findAll() {
    return this.db.select().from(schema.reports);
  }

  async findOne(id: number) {
    const [report] = await this.db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, id));
    if (!report) throw new NotFoundException(`Hlášení #${id} nenalezeno`);
    return report;
  }

  async create(dto: CreateReportDto, authorId: number) {
    const [user] = await this.db
      .select({ name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, authorId));
    if (!user) throw new NotFoundException(`Uživatel #${authorId} nenalezen`);

    // Automatický kontext pokud je linked na equipment
    let context = dto.context ?? 'General';
    if (dto.equipmentId && !dto.context) {
      const [eq_] = await this.db
        .select({ name: schema.equipment.name })
        .from(schema.equipment)
        .where(eq(schema.equipment.id, dto.equipmentId));
      if (eq_) context = `Equipment: ${eq_.name}`;
    }

    const [report] = await this.db
      .insert(schema.reports)
      .values({ ...dto, authorId, authorName: user.name, context })
      .returning();

    if (report.equipmentId) {
      await this.equipmentService.markNonFunctional(report.equipmentId);
    }

    return report;
  }

  async update(id: number, dto: UpdateReportDto, userId: number, isAdmin: boolean) {
    const report = await this.findOne(id);
    if (!isAdmin && report.authorId !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může upravovat hlášení');
    }

    const previousStatus = report.status;

    const [updated] = await this.db
      .update(schema.reports)
      .set(dto)
      .where(eq(schema.reports.id, id))
      .returning();

    // System actor: report → resolved
    if (dto.status === 'resolved' && previousStatus !== 'resolved') {
      // 1) Auto-complete všech linked úkolů
      await this.tasksService.autoCompleteLinked('report', id);

      // 2) Pokud je repair report → equipment functional
      if (report.equipmentId) {
        await this.equipmentService.markFunctional(report.equipmentId);
      }
    }

    return updated;
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    const report = await this.findOne(id);
    if (!isAdmin && report.authorId !== userId) {
      throw new ForbiddenException('Pouze autor nebo admin může smazat hlášení');
    }
    await this.db.delete(schema.reports).where(eq(schema.reports.id, id));
  }
}

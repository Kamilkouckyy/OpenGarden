import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  date,
  integer,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['member', 'admin']);

export const gardenBedStatusEnum = pgEnum('garden_bed_status', ['free', 'occupied']);

export const taskStatusEnum = pgEnum('task_status', ['open', 'in_progress', 'done']);

export const taskLinkedTypeEnum = pgEnum('task_linked_type', ['plot', 'report', 'event', 'equipment']);

export const equipmentStatusEnum = pgEnum('equipment_status', ['functional', 'non_functional']);

export const reportStatusEnum = pgEnum('report_status', ['new', 'in_progress', 'resolved']);

export const eventStatusEnum = pgEnum('event_status', ['active', 'cancelled']);

export const participationStatusEnum = pgEnum('participation_status', [
  'going',
  'not_going',
  'maybe',
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const authUsers = pgTable('auth_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const authSessions = pgTable('auth_sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
});

export const authAccounts = pgTable('auth_accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const authVerifications = pgTable('auth_verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const gardenBeds = pgTable('garden_beds', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  description: text('description'),
  status: gardenBedStatusEnum('status').default('free').notNull(),
  ownerId: integer('owner_id').references(() => users.id, { onDelete: 'set null' }),
  ownerName: varchar('owner_name', { length: 100 }),
  reservedAt: timestamp('reserved_at'),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('open').notNull(),
  context: varchar('context', { length: 100 }).default('General').notNull(),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  resolverId: integer('resolver_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  dueDate: date('due_date'),
  linkedType: taskLinkedTypeEnum('linked_type'),
  linkedId: integer('linked_id'),
});

export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  status: equipmentStatusEnum('status').default('functional').notNull(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  photoUrl: varchar('photo_url', { length: 500 }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  authorName: varchar('author_name', { length: 100 }).notNull(),
  equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'set null' }),
  context: varchar('context', { length: 100 }).default('General').notNull(),
  status: reportStatusEnum('status').default('new').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communityEvents = pgTable('community_events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  photoUrl: varchar('photo_url', { length: 500 }),
  date: timestamp('event_date').notNull(),
  status: eventStatusEnum('status').default('active').notNull(),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const eventParticipations = pgTable(
  'event_participations',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id')
      .notNull()
      .references(() => communityEvents.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: participationStatusEnum('status').default('maybe').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('uq_event_user').on(t.eventId, t.userId)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  gardenBeds: many(gardenBeds),
  authoredTasks: many(tasks, { relationName: 'taskAuthor' }),
  resolvedTasks: many(tasks, { relationName: 'taskResolver' }),
  equipment: many(equipment),
  reports: many(reports),
  events: many(communityEvents),
  participations: many(eventParticipations),
}));

export const authUsersRelations = relations(authUsers, ({ many }) => ({
  sessions: many(authSessions),
  accounts: many(authAccounts),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(authUsers, { fields: [authSessions.userId], references: [authUsers.id] }),
}));

export const authAccountsRelations = relations(authAccounts, ({ one }) => ({
  user: one(authUsers, { fields: [authAccounts.userId], references: [authUsers.id] }),
}));

export const gardenBedsRelations = relations(gardenBeds, ({ one }) => ({
  owner: one(users, { fields: [gardenBeds.ownerId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  author: one(users, {
    fields: [tasks.authorId],
    references: [users.id],
    relationName: 'taskAuthor',
  }),
  resolver: one(users, {
    fields: [tasks.resolverId],
    references: [users.id],
    relationName: 'taskResolver',
  }),
}));

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  author: one(users, { fields: [equipment.authorId], references: [users.id] }),
  reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  author: one(users, { fields: [reports.authorId], references: [users.id] }),
  equipment: one(equipment, { fields: [reports.equipmentId], references: [equipment.id] }),
}));

export const communityEventsRelations = relations(communityEvents, ({ one, many }) => ({
  author: one(users, { fields: [communityEvents.authorId], references: [users.id] }),
  participations: many(eventParticipations),
}));

export const eventParticipationsRelations = relations(eventParticipations, ({ one }) => ({
  event: one(communityEvents, {
    fields: [eventParticipations.eventId],
    references: [communityEvents.id],
  }),
  user: one(users, { fields: [eventParticipations.userId], references: [users.id] }),
}));

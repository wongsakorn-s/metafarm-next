import { boolean, date, index, integer, jsonb, pgTable, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const staff = pgTable('staff', {
  email: varchar('email', { length: 254 }).primaryKey(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const hives = pgTable('hives', {
  id: uuid('id').primaryKey(),
  code: varchar('code', { length: 40 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  species: varchar('species', { length: 100 }),
  location: varchar('location', { length: 200 }),
  status: varchar('status', { length: 10 }).notNull().default('Normal'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true })
});

export const harvests = pgTable('harvests', {
  id: uuid('id').primaryKey(),
  hiveId: uuid('hive_id').notNull().references(() => hives.id, { onDelete: 'restrict' }),
  harvestedAt: date('harvested_at', { mode: 'string' }).notNull(),
  honeyMl: integer('honey_ml').notNull().default(0),
  propolisG: real('propolis_g').notNull().default(0),
  createdByEmail: varchar('created_by_email', { length: 254 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar('created_by', { length: 254 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  updatedBy: varchar('updated_by', { length: 254 }),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const inspections = pgTable('inspections', {
  id: uuid('id').primaryKey(),
  hiveId: uuid('hive_id').notNull().references(() => hives.id, { onDelete: 'restrict' }),
  inspectedAt: date('inspected_at', { mode: 'string' }).notNull(),
  notes: text('notes'),
  status: varchar('status', { length: 10 }).notNull(),
  imageKey: text('image_key'),
  imageMime: varchar('image_mime', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar('created_by', { length: 254 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  updatedBy: varchar('updated_by', { length: 254 }),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey(),
  actorEmail: varchar('actor_email', { length: 254 }).notNull(),
  action: varchar('action', { length: 10 }).notNull(),
  entity: varchar('entity', { length: 20 }).notNull(),
  entityId: varchar('entity_id', { length: 254 }).notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('audit_logs_entity_entity_id_idx').on(table.entity, table.entityId),
  index('audit_logs_created_at_desc_idx').on(table.createdAt.desc())
]);

import { boolean, date, integer, pgTable, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const harvests = pgTable('harvests', {
  id: uuid('id').primaryKey(),
  hiveId: uuid('hive_id').notNull().references(() => hives.id, { onDelete: 'restrict' }),
  harvestedAt: date('harvested_at', { mode: 'string' }).notNull(),
  honeyMl: integer('honey_ml').notNull().default(0),
  propolisG: real('propolis_g').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const inspections = pgTable('inspections', {
  id: uuid('id').primaryKey(),
  hiveId: uuid('hive_id').notNull().references(() => hives.id, { onDelete: 'restrict' }),
  inspectedAt: date('inspected_at', { mode: 'string' }).notNull(),
  notes: text('notes'),
  status: varchar('status', { length: 10 }).notNull(),
  imageKey: text('image_key'),
  imageMime: varchar('image_mime', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

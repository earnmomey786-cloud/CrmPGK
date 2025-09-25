import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Pipeline status enum
export const pipelineStatus = ["nuevo", "presupuesto-enviado", "presupuesto-pagado", "en-tareas", "terminado"] as const;
export type PipelineStatus = typeof pipelineStatus[number];

// Task priority enum
export const taskPriority = ["baja", "media", "alta", "urgente"] as const;
export type TaskPriority = typeof taskPriority[number];

// Task status enum
export const taskStatus = ["pendiente", "en-progreso", "completada", "cancelada"] as const;
export type TaskStatus = typeof taskStatus[number];

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#3B82F6"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  channel: text("channel"), // whatsapp, email, telefono, presencial
  categoryId: varchar("category_id").references(() => categories.id),
  status: text("status").$type<PipelineStatus>().notNull().default("nuevo"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  clientId: varchar("client_id").references(() => clients.id),
  priority: text("priority").$type<TaskPriority>().notNull().default("media"),
  status: text("status").$type<TaskStatus>().notNull().default("pendiente"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Extended types for API responses
export type ClientWithCategory = Client & {
  category?: Category;
};

export type TaskWithClient = Task & {
  client?: Client;
};

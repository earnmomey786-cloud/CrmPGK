import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
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
  assignedTo: text("assigned_to").references(() => users.email), // Reference by email for easier lookup
  priority: text("priority").$type<TaskPriority>().notNull().default("media"),
  status: text("status").$type<TaskStatus>().notNull().default("pendiente"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Status History table
export const clientStatusHistory = pgTable("client_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  previousStatus: text("previous_status").$type<PipelineStatus | null>(),
  newStatus: text("new_status").$type<PipelineStatus>().notNull(),
  notes: text("notes"), // Optional notes about the status change
  changedAt: timestamp("changed_at").defaultNow().notNull(),
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

export const insertClientStatusHistorySchema = createInsertSchema(clientStatusHistory).omit({
  id: true,
  changedAt: true,
});

// Types
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertClientStatusHistory = z.infer<typeof insertClientStatusHistorySchema>;
export type ClientStatusHistory = typeof clientStatusHistory.$inferSelect;

// Extended types for API responses
export type ClientWithCategory = Client & {
  category?: Category;
};

export type TaskWithClient = Task & {
  client?: ClientWithCategory;
  assignedUserName?: string; // Display name of assigned user
};

export type ClientWithCategoryAndHistory = ClientWithCategory & {
  statusHistory?: ClientStatusHistory[];
};

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User schemas  
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// User types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Global motivational phrase table (shared by all users)
export const globalMotivationalPhrase = pgTable("global_motivational_phrase", {
  id: varchar("id").primaryKey().default("global"),
  phrase: text("phrase").notNull().default("¡Vamos por un día productivo! 💪"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Global motivational phrase schemas
export const insertGlobalMotivationalPhraseSchema = createInsertSchema(globalMotivationalPhrase).omit({
  id: true,
  updatedAt: true,
});

// Global motivational phrase types
export type InsertGlobalMotivationalPhrase = z.infer<typeof insertGlobalMotivationalPhraseSchema>;
export type GlobalMotivationalPhrase = typeof globalMotivationalPhrase.$inferSelect;

// User mapping for display names
export const userNames: Record<string, string> = {
  "info@bizneswhiszpanii.com": "Natalia",
  "admin@pgkhiszpania.com": "Kenyi",
};

// Helper functions for user management
export const getUserDisplayName = (email: string): string => {
  return userNames[email] || email;
};

export const getAllUsers = (): Array<{ email: string; name: string }> => {
  return Object.entries(userNames).map(([email, name]) => ({ email, name }));
};

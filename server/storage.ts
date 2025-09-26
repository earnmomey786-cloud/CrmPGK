import { type Client, type InsertClient, type Task, type InsertTask, type Category, type InsertCategory, type ClientWithCategory, type TaskWithClient, type ClientStatusHistory, type InsertClientStatusHistory, type User, type InsertUser, type MotivationalPhrase, type InsertMotivationalPhrase, categories, clients, tasks, clientStatusHistory, users, motivationalPhrases, getUserDisplayName } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Authentication
  sessionStore: session.Store;
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Clients
  getClients(): Promise<ClientWithCategory[]>;
  getClient(id: string): Promise<ClientWithCategory | undefined>;
  getClientsByStatus(status: string): Promise<ClientWithCategory[]>;
  getClientsByCategory(categoryId: string): Promise<ClientWithCategory[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Tasks
  getTasks(): Promise<TaskWithClient[]>;
  getTask(id: string): Promise<TaskWithClient | undefined>;
  getTasksByClient(clientId: string): Promise<TaskWithClient[]>;
  getTasksByStatus(status: string): Promise<TaskWithClient[]>;
  getTasksByAssignedUser(email: string): Promise<TaskWithClient[]>;
  getPendingTasks(): Promise<TaskWithClient[]>;
  getPendingTasksCount(email: string): Promise<number>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Client Status History
  getClientStatusHistory(clientId: string): Promise<ClientStatusHistory[]>;
  createStatusHistoryEntry(entry: InsertClientStatusHistory): Promise<ClientStatusHistory>;

  // Motivational Phrases
  getMotivationalPhrase(userEmail: string): Promise<MotivationalPhrase | undefined>;
  updateMotivationalPhrase(userEmail: string, phrase: string): Promise<MotivationalPhrase | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Initialize session store with the database connection
    const connectionString = process.env.DATABASE_URL!;
    this.sessionStore = new PostgresSessionStore({ 
      conString: connectionString,
      createTableIfMissing: true 
    });
    
    // Initialize with default categories and users on first run
    this.initializeDefaultCategories();
    this.initializeDefaultUsers();
  }

  private async initializeDefaultCategories() {
    try {
      // Check if categories already exist
      const existingCategories = await db.select().from(categories).limit(1);
      if (existingCategories.length > 0) return; // Already initialized
      
      const defaultCategories = [
        { name: "Autónomo", description: "Servicios para trabajadores autónomos y freelancers", color: "#3B82F6" },
        { name: "Impuestos", description: "Gestión de declaraciones fiscales y tributación", color: "#EF4444" },
        { name: "Informe", description: "Elaboración de informes contables y financieros", color: "#10B981" },
      ];

      await db.insert(categories).values(defaultCategories);
    } catch (error) {
      // Ignore errors - table might not exist yet
      console.log("Default categories initialization skipped:", (error as Error).message);
    }
  }

  private async initializeDefaultUsers() {
    try {
      // Check if users already exist
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) return; // Already initialized
      
      // Import here to avoid circular dependency
      const { hashPassword } = await import("./auth");
      
      const defaultUsers = [
        { 
          username: "info@bizneswhiszpanii.com",
          email: "info@bizneswhiszpanii.com", 
          password: await hashPassword("Kocham647")
        },
        { 
          username: "admin@pgkhiszpania.com",
          email: "admin@pgkhiszpania.com", 
          password: await hashPassword("Kocham647")
        },
      ];

      await db.insert(users).values(defaultUsers);
      console.log("Default users created successfully");
    } catch (error) {
      // Ignore errors - table might not exist yet
      console.log("Default users initialization skipped:", (error as Error).message);
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values({
      name: insertCategory.name,
      description: insertCategory.description || null,
      color: insertCategory.color || "#3B82F6"
    }).returning();
    return category;
  }

  async updateCategory(id: string, update: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db.update(categories)
      .set({
        ...(update.name && { name: update.name }),
        ...(update.description !== undefined && { description: update.description || null }),
        ...(update.color && { color: update.color })
      })
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Clients  
  async getClients(): Promise<ClientWithCategory[]> {
    const result = await db
      .select({
        client: clients,
        category: categories,
      })
      .from(clients)
      .leftJoin(categories, eq(clients.categoryId, categories.id))
      .orderBy(desc(clients.createdAt));
    
    return result.map(row => ({
      ...row.client,
      category: row.category || undefined,
    }));
  }

  async getClient(id: string): Promise<ClientWithCategory | undefined> {
    const [result] = await db
      .select({
        client: clients,
        category: categories,
      })
      .from(clients)
      .leftJoin(categories, eq(clients.categoryId, categories.id))
      .where(eq(clients.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.client,
      category: result.category || undefined,
    };
  }

  async getClientsByStatus(status: string): Promise<ClientWithCategory[]> {
    const result = await db
      .select({
        client: clients,
        category: categories,
      })
      .from(clients)
      .leftJoin(categories, eq(clients.categoryId, categories.id))
      .where(eq(clients.status, status as any))
      .orderBy(desc(clients.createdAt));
    
    return result.map(row => ({
      ...row.client,
      category: row.category || undefined,
    }));
  }

  async getClientsByCategory(categoryId: string): Promise<ClientWithCategory[]> {
    const result = await db
      .select({
        client: clients,
        category: categories,
      })
      .from(clients)
      .leftJoin(categories, eq(clients.categoryId, categories.id))
      .where(eq(clients.categoryId, categoryId))
      .orderBy(desc(clients.createdAt));
    
    return result.map(row => ({
      ...row.client,
      category: row.category || undefined,
    }));
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values({
      name: insertClient.name,
      company: insertClient.company || null,
      email: insertClient.email,
      phone: insertClient.phone,
      whatsapp: insertClient.whatsapp || null,
      channel: insertClient.channel || null,
      categoryId: insertClient.categoryId || null,
      status: (insertClient.status as any) || "nuevo",
      notes: insertClient.notes || null,
    }).returning();
    return client;
  }

  async updateClient(id: string, update: Partial<InsertClient>): Promise<Client | undefined> {
    // If status is being updated, get the current status first for history tracking
    let previousStatus: string | null = null;
    if (update.status) {
      const currentClient = await db.select({ status: clients.status }).from(clients).where(eq(clients.id, id)).limit(1);
      if (currentClient.length > 0) {
        previousStatus = currentClient[0].status;
      }
    }

    const [client] = await db.update(clients)
      .set({
        ...(update.name && { name: update.name }),
        ...(update.company !== undefined && { company: update.company }),
        ...(update.email && { email: update.email }),
        ...(update.phone && { phone: update.phone }),
        ...(update.whatsapp !== undefined && { whatsapp: update.whatsapp }),
        ...(update.channel !== undefined && { channel: update.channel }),
        ...(update.categoryId !== undefined && { categoryId: update.categoryId }),
        ...(update.status && { status: update.status as any }),
        ...(update.notes !== undefined && { notes: update.notes }),
        updatedAt: sql`now()`,
      })
      .where(eq(clients.id, id))
      .returning();

    // Create status history entry if status was changed
    if (client && update.status && update.status !== previousStatus) {
      await this.createStatusHistoryEntry({
        clientId: id,
        previousStatus: previousStatus as any,
        newStatus: update.status as any,
        notes: `Estado cambiado de "${previousStatus || 'sin estado'}" a "${update.status}"`
      });
    }

    return client;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Tasks
  async getTasks(): Promise<TaskWithClient[]> {
    const result = await db
      .select({
        task: tasks,
        client: clients,
        category: categories,
      })
      .from(tasks)
      .leftJoin(clients, eq(tasks.clientId, clients.id))
      .leftJoin(categories, eq(clients.categoryId, categories.id))
      .orderBy(desc(tasks.createdAt));
    
    return result.map(row => ({
      ...row.task,
      client: row.client ? {
        ...row.client,
        category: row.category || undefined,
      } : undefined,
      assignedUserName: row.task.assignedTo ? getUserDisplayName(row.task.assignedTo) : undefined,
    }));
  }

  async getTask(id: string): Promise<TaskWithClient | undefined> {
    const [result] = await db
      .select({
        task: tasks,
        client: clients,
        category: categories,
      })
      .from(tasks)
      .leftJoin(clients, eq(tasks.clientId, clients.id))
      .leftJoin(categories, eq(clients.categoryId, categories.id))
      .where(eq(tasks.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.task,
      client: result.client ? {
        ...result.client,
        category: result.category || undefined,
      } : undefined,
      assignedUserName: result.task.assignedTo ? getUserDisplayName(result.task.assignedTo) : undefined,
    };
  }

  async getTasksByClient(clientId: string): Promise<TaskWithClient[]> {
    const result = await db
      .select({
        task: tasks,
        client: clients,
        category: categories,
      })
      .from(tasks)
      .leftJoin(clients, eq(tasks.clientId, clients.id))
      .leftJoin(categories, eq(clients.categoryId, categories.id))
      .where(eq(tasks.clientId, clientId))
      .orderBy(desc(tasks.createdAt));
    
    return result.map(row => ({
      ...row.task,
      client: row.client ? {
        ...row.client,
        category: row.category || undefined,
      } : undefined,
      assignedUserName: row.task.assignedTo ? getUserDisplayName(row.task.assignedTo) : undefined,
    }));
  }

  async getTasksByStatus(status: string): Promise<TaskWithClient[]> {
    const result = await db
      .select({
        task: tasks,
        client: clients,
        category: categories,
      })
      .from(tasks)
      .leftJoin(clients, eq(tasks.clientId, clients.id))
      .leftJoin(categories, eq(clients.categoryId, categories.id))
      .where(eq(tasks.status, status as any))
      .orderBy(desc(tasks.createdAt));
    
    return result.map(row => ({
      ...row.task,
      client: row.client ? {
        ...row.client,
        category: row.category || undefined,
      } : undefined,
      assignedUserName: row.task.assignedTo ? getUserDisplayName(row.task.assignedTo) : undefined,
    }));
  }

  async getPendingTasks(): Promise<TaskWithClient[]> {
    const result = await db
      .select({
        task: tasks,
        client: clients,
        category: categories,
      })
      .from(tasks)
      .leftJoin(clients, eq(tasks.clientId, clients.id))
      .leftJoin(categories, eq(clients.categoryId, categories.id))
      .where(eq(tasks.status, "pendiente"));
    
    return result.map(row => ({
      ...row.task,
      client: row.client ? {
        ...row.client,
        category: row.category || undefined,
      } : undefined,
      assignedUserName: row.task.assignedTo ? getUserDisplayName(row.task.assignedTo) : undefined,
    })).sort((a, b) => {
      // Sort by priority and due date
      const priorityOrder = { urgente: 4, alta: 3, media: 2, baja: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      title: insertTask.title,
      description: insertTask.description || null,
      clientId: insertTask.clientId || null,
      assignedTo: insertTask.assignedTo || null,
      priority: (insertTask.priority as any) || "media",
      status: (insertTask.status as any) || "pendiente",
      dueDate: insertTask.dueDate || null,
    }).returning();
    return task;
  }

  async getTasksByAssignedUser(email: string): Promise<TaskWithClient[]> {
    const result = await db
      .select({
        task: tasks,
        client: clients,
        category: categories,
      })
      .from(tasks)
      .leftJoin(clients, eq(tasks.clientId, clients.id))
      .leftJoin(categories, eq(clients.categoryId, categories.id))
      .where(eq(tasks.assignedTo, email))
      .orderBy(desc(tasks.createdAt));
    
    return result.map(row => ({
      ...row.task,
      client: row.client ? {
        ...row.client,
        category: row.category || undefined,
      } : undefined,
      assignedUserName: row.task.assignedTo ? getUserDisplayName(row.task.assignedTo) : undefined,
    }));
  }

  async getPendingTasksCount(email: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(tasks)
      .where(and(eq(tasks.assignedTo, email), eq(tasks.status, "pendiente" as any)));
    
    return result?.count ?? 0;
  }

  async updateTask(id: string, update: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set({
        ...(update.title && { title: update.title }),
        ...(update.description !== undefined && { description: update.description }),
        ...(update.clientId !== undefined && { clientId: update.clientId }),
        ...(update.assignedTo !== undefined && { assignedTo: update.assignedTo }),
        ...(update.priority && { priority: update.priority as any }),
        ...(update.status && { status: update.status as any }),
        ...(update.dueDate !== undefined && { dueDate: update.dueDate }),
        updatedAt: sql`now()`,
      })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Client Status History
  async getClientStatusHistory(clientId: string): Promise<ClientStatusHistory[]> {
    return await db.select()
      .from(clientStatusHistory)
      .where(eq(clientStatusHistory.clientId, clientId))
      .orderBy(desc(clientStatusHistory.changedAt));
  }

  async createStatusHistoryEntry(entry: InsertClientStatusHistory): Promise<ClientStatusHistory> {
    const [historyEntry] = await db.insert(clientStatusHistory).values({
      clientId: entry.clientId,
      previousStatus: (entry.previousStatus as any) || null,
      newStatus: entry.newStatus as any,
      notes: entry.notes || null,
    }).returning();
    return historyEntry;
  }

  // Authentication methods
  async getUser(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
    }).returning();
    return user;
  }

  // Motivational Phrases methods
  async getMotivationalPhrase(userEmail: string): Promise<MotivationalPhrase | undefined> {
    const [phrase] = await db
      .select()
      .from(motivationalPhrases)
      .where(eq(motivationalPhrases.userEmail, userEmail));
    return phrase;
  }

  async updateMotivationalPhrase(userEmail: string, phrase: string): Promise<MotivationalPhrase | undefined> {
    const [existingPhrase] = await db
      .select()
      .from(motivationalPhrases)
      .where(eq(motivationalPhrases.userEmail, userEmail));

    if (existingPhrase) {
      // Update existing phrase
      const [updated] = await db
        .update(motivationalPhrases)
        .set({ 
          phrase: phrase, 
          updatedAt: new Date() 
        })
        .where(eq(motivationalPhrases.userEmail, userEmail))
        .returning();
      return updated;
    } else {
      // Create new phrase
      const [newPhrase] = await db
        .insert(motivationalPhrases)
        .values({
          userEmail: userEmail,
          phrase: phrase,
        })
        .returning();
      return newPhrase;
    }
  }
}

export const storage = new DatabaseStorage();

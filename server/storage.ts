import { type Client, type InsertClient, type Task, type InsertTask, type Category, type InsertCategory, type ClientWithCategory, type TaskWithClient } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
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
  getPendingTasks(): Promise<TaskWithClient[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category>;
  private clients: Map<string, Client>;
  private tasks: Map<string, Task>;

  constructor() {
    this.categories = new Map();
    this.clients = new Map();
    this.tasks = new Map();

    // Initialize with default categories
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const defaultCategories = [
      { name: "Autónomo", description: "Servicios para trabajadores autónomos y freelancers", color: "#3B82F6" },
      { name: "Impuestos", description: "Gestión de declaraciones fiscales y tributación", color: "#EF4444" },
      { name: "Informe", description: "Elaboración de informes contables y financieros", color: "#10B981" },
    ];

    defaultCategories.forEach(cat => {
      const id = randomUUID();
      const category: Category = {
        id,
        name: cat.name,
        description: cat.description,
        color: cat.color,
        createdAt: new Date(),
      };
      this.categories.set(id, category);
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      id,
      name: insertCategory.name,
      description: insertCategory.description || null,
      color: insertCategory.color || "#3B82F6",
      createdAt: new Date(),
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, update: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updated = { ...category, ...update };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Clients
  async getClients(): Promise<ClientWithCategory[]> {
    const clients = Array.from(this.clients.values());
    return clients.map(client => ({
      ...client,
      category: client.categoryId ? this.categories.get(client.categoryId) : undefined,
    }));
  }

  async getClient(id: string): Promise<ClientWithCategory | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    return {
      ...client,
      category: client.categoryId ? this.categories.get(client.categoryId) : undefined,
    };
  }

  async getClientsByStatus(status: string): Promise<ClientWithCategory[]> {
    const clients = await this.getClients();
    return clients.filter(client => client.status === status);
  }

  async getClientsByCategory(categoryId: string): Promise<ClientWithCategory[]> {
    const clients = await this.getClients();
    return clients.filter(client => client.categoryId === categoryId);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const now = new Date();
    const client: Client = {
      id,
      name: insertClient.name,
      company: insertClient.company || null,
      email: insertClient.email,
      phone: insertClient.phone,
      whatsapp: insertClient.whatsapp || null,
      channel: insertClient.channel || null,
      categoryId: insertClient.categoryId || null,
      status: (insertClient.status as any) || "nuevo",
      notes: insertClient.notes || null,
      createdAt: now,
      updatedAt: now,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, update: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    const updated: Client = { 
      ...client,
      ...(update.name && { name: update.name }),
      ...(update.company !== undefined && { company: update.company }),
      ...(update.email && { email: update.email }),
      ...(update.phone && { phone: update.phone }),
      ...(update.whatsapp !== undefined && { whatsapp: update.whatsapp }),
      ...(update.channel !== undefined && { channel: update.channel }),
      ...(update.categoryId !== undefined && { categoryId: update.categoryId }),
      ...(update.status && { status: update.status as any }),
      ...(update.notes !== undefined && { notes: update.notes }),
      updatedAt: new Date() 
    };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Tasks
  async getTasks(): Promise<TaskWithClient[]> {
    const tasks = Array.from(this.tasks.values());
    return tasks.map(task => ({
      ...task,
      client: task.clientId ? this.clients.get(task.clientId) : undefined,
    }));
  }

  async getTask(id: string): Promise<TaskWithClient | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    return {
      ...task,
      client: task.clientId ? this.clients.get(task.clientId) : undefined,
    };
  }

  async getTasksByClient(clientId: string): Promise<TaskWithClient[]> {
    const tasks = await this.getTasks();
    return tasks.filter(task => task.clientId === clientId);
  }

  async getTasksByStatus(status: string): Promise<TaskWithClient[]> {
    const tasks = await this.getTasks();
    return tasks.filter(task => task.status === status);
  }

  async getPendingTasks(): Promise<TaskWithClient[]> {
    const tasks = await this.getTasks();
    return tasks.filter(task => task.status === "pendiente")
      .sort((a, b) => {
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
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      id,
      title: insertTask.title,
      description: insertTask.description || null,
      clientId: insertTask.clientId || null,
      priority: (insertTask.priority as any) || "media",
      status: (insertTask.status as any) || "pendiente",
      dueDate: insertTask.dueDate || null,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, update: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updated: Task = { 
      ...task,
      ...(update.title && { title: update.title }),
      ...(update.description !== undefined && { description: update.description }),
      ...(update.clientId !== undefined && { clientId: update.clientId }),
      ...(update.priority && { priority: update.priority as any }),
      ...(update.status && { status: update.status as any }),
      ...(update.dueDate !== undefined && { dueDate: update.dueDate }),
      updatedAt: new Date() 
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}

export const storage = new MemStorage();

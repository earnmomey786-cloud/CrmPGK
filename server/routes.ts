import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertTaskSchema, insertCategorySchema, insertClientStatusHistorySchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories routes - Protected
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating category" });
      }
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      
      if (!category) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating category" });
      }
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  // Clients routes - Protected
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const { status, category } = req.query;
      
      let clients;
      if (status) {
        clients = await storage.getClientsByStatus(status as string);
      } else if (category) {
        clients = await storage.getClientsByCategory(category as string);
      } else {
        clients = await storage.getClients();
      }
      
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching clients" });
    }
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      
      if (!client) {
        res.status(404).json({ message: "Client not found" });
        return;
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client" });
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid client data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating client" });
      }
    }
  });

  app.put("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, validatedData);
      
      if (!client) {
        res.status(404).json({ message: "Client not found" });
        return;
      }
      
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid client data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating client" });
      }
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteClient(id);
      
      if (!success) {
        res.status(404).json({ message: "Client not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting client" });
    }
  });

  // Client Status History routes
  app.get("/api/clients/:id/history", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getClientStatusHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client status history" });
    }
  });

  app.post("/api/clients/:id/history", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertClientStatusHistorySchema.parse({
        ...req.body,
        clientId: id
      });
      const historyEntry = await storage.createStatusHistoryEntry(validatedData);
      res.status(201).json(historyEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid status history data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating status history entry" });
      }
    }
  });

  // Tasks routes - Protected
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const { client, status, pending } = req.query;
      
      let tasks;
      if (pending === "true") {
        tasks = await storage.getPendingTasks();
      } else if (client) {
        tasks = await storage.getTasksByClient(client as string);
      } else if (status) {
        tasks = await storage.getTasksByStatus(status as string);
      } else {
        tasks = await storage.getTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tasks" });
    }
  });

  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getTask(id);
      
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Error fetching task" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      // Convert dueDate string to Date if present
      const processedBody = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      };
      
      const validatedData = insertTaskSchema.parse(processedBody);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating task" });
      }
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convert dueDate string to Date if present
      const processedBody = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : req.body.dueDate,
      };
      
      const validatedData = insertTaskSchema.partial().parse(processedBody);
      const task = await storage.updateTask(id, validatedData);
      
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating task" });
      }
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTask(id);
      
      if (!success) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting task" });
    }
  });

  // User notifications endpoint - Protected
  app.get("/api/notifications/count", requireAuth, async (req, res) => {
    try {
      if (!req.user?.email) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      const pendingCount = await storage.getPendingTasksCount(req.user.email);
      res.json({ count: pendingCount });
    } catch (error) {
      res.status(500).json({ message: "Error fetching notification count" });
    }
  });

  // Get pending tasks for current user - Protected
  app.get("/api/notifications/tasks", requireAuth, async (req, res) => {
    try {
      if (!req.user?.email) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      const pendingTasks = await storage.getTasksByAssignedUser(req.user.email);
      const onlyPending = pendingTasks.filter(task => task.status === "pendiente");
      res.json(onlyPending);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending tasks" });
    }
  });

  // Get motivational phrase for current user - Protected
  app.get("/api/motivational-phrase", requireAuth, async (req, res) => {
    try {
      if (!req.user?.email) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      const phrase = await storage.getMotivationalPhrase(req.user.email);
      if (!phrase) {
        // Return default phrase if none exists
        res.json({ phrase: "¡Vamos por un día productivo! 💪" });
        return;
      }
      
      res.json({ phrase: phrase.phrase });
    } catch (error) {
      res.status(500).json({ message: "Error fetching motivational phrase" });
    }
  });

  // Update motivational phrase for current user - Protected
  app.put("/api/motivational-phrase", requireAuth, async (req, res) => {
    try {
      if (!req.user?.email) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      const { phrase } = req.body;
      if (!phrase || typeof phrase !== 'string') {
        res.status(400).json({ message: "Phrase is required and must be a string" });
        return;
      }
      
      const updatedPhrase = await storage.updateMotivationalPhrase(req.user.email, phrase);
      res.json({ phrase: updatedPhrase?.phrase });
    } catch (error) {
      res.status(500).json({ message: "Error updating motivational phrase" });
    }
  });

  // Stats endpoint for dashboard - Protected
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getClients();
      const tasks = await storage.getTasks();
      
      const pipelineStats = {
        nuevo: clients.filter(c => c.status === "nuevo").length,
        "presupuesto-enviado": clients.filter(c => c.status === "presupuesto-enviado").length,
        "presupuesto-pagado": clients.filter(c => c.status === "presupuesto-pagado").length,
        "en-tareas": clients.filter(c => c.status === "en-tareas").length,
        "terminado": clients.filter(c => c.status === "terminado").length,
      };
      
      const stats = {
        totalClients: clients.length,
        pendingTasks: tasks.filter(t => t.status === "pendiente").length,
        pipelineStats,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

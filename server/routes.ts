import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Projects ---
  app.get(api.projects.list.path, async (_req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    const columns = await storage.getProjectColumns(req.params.id);
    res.json({ ...project, columns });
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    await storage.deleteProject(req.params.id);
    res.status(204).send();
  });

  // --- Columns ---
  app.post(api.columns.create.path, async (req, res) => {
    const { projectId } = req.params;
    const project = await storage.getProject(projectId);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    try {
      const input = api.columns.create.input.parse(req.body);
      const column = await storage.createColumn(projectId, input);
      res.status(201).json(column);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.columns.updateData.path, async (req, res) => {
    const { projectId, columnId } = req.params;
    const column = await storage.getColumn(columnId);
    if (!column || column.projectId !== projectId) {
      res.status(404).json({ message: "Column not found" });
      return;
    }

    try {
      const input = api.columns.updateData.input.parse(req.body);
      
      // Process raw input
      // Split by newline or comma, trim, filter empty
      const rawValues = input.rawInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      
      let processedData: (string | number)[];
      if (column.type === 'numeric') {
        processedData = rawValues.map(v => {
          const num = parseFloat(v);
          return isNaN(num) ? 0 : num; // Or handle invalid numbers differently
        });
      } else {
        processedData = rawValues;
      }

      const updated = await storage.updateColumnData(columnId, processedData);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.post(api.columns.mergeTerms.path, async (req, res) => {
    const { projectId, columnId } = req.params;
    const column = await storage.getColumn(columnId);
    if (!column || column.projectId !== projectId) {
      res.status(404).json({ message: "Column not found" });
      return;
    }

    try {
      const input = api.columns.mergeTerms.input.parse(req.body);
      const updated = await storage.mergeColumnTerms(columnId, input.originalTerms, input.mergedTerm);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.columns.delete.path, async (req, res) => {
    const { projectId, columnId } = req.params;
    const column = await storage.getColumn(columnId);
    if (!column || column.projectId !== projectId) {
      res.status(404).json({ message: "Column not found" });
      return;
    }
    await storage.deleteColumn(columnId);
    res.status(204).send();
  });

  // Seed Data
  const projects = await storage.getProjects();
  if (projects.length === 0) {
    const demo = await storage.createProject({ 
      name: "Demo Sales Data", 
      description: "Example project with categorical and numeric data" 
    });
    
    // Categorical Column: Regions
    const regionCol = await storage.createColumn(demo.id, { name: "Region", type: "categorical" });
    await storage.updateColumnData(regionCol.id, [
      "North", "North", "South", "East", "West", "North", "East", "East", "West", "South", "South-East", "North-West"
    ]);

    // Numeric Column: Sales
    const salesCol = await storage.createColumn(demo.id, { name: "Sales (k$)", type: "numeric" });
    await storage.updateColumnData(salesCol.id, [
      120, 150, 90, 200, 110, 130, 210, 190, 115, 95, 80, 140
    ]);
  }

  return httpServer;
}

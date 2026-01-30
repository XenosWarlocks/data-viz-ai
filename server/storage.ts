import { Project, Column, CreateProject, CreateColumn, UpdateColumnData, MergeTerms } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: CreateProject): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Columns
  getProjectColumns(projectId: string): Promise<Column[]>;
  getColumn(columnId: string): Promise<Column | undefined>;
  createColumn(projectId: string, column: CreateColumn): Promise<Column>;
  updateColumnData(columnId: string, data: (string | number)[]): Promise<Column>;
  mergeColumnTerms(columnId: string, originalTerms: string[], mergedTerm: string): Promise<Column>;
  deleteColumn(columnId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private columns: Map<string, Column>;

  constructor() {
    this.projects = new Map();
    this.columns = new Map();
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: CreateProject): Promise<Project> {
    const id = randomUUID();
    const newProject: Project = {
      id,
      ...project,
      createdAt: Date.now(),
      description: project.description || undefined
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
    // Cascade delete columns
    for (const [colId, col] of this.columns.entries()) {
      if (col.projectId === id) {
        this.columns.delete(colId);
      }
    }
  }

  // Columns
  async getProjectColumns(projectId: string): Promise<Column[]> {
    return Array.from(this.columns.values()).filter(c => c.projectId === projectId);
  }

  async getColumn(columnId: string): Promise<Column | undefined> {
    return this.columns.get(columnId);
  }

  async createColumn(projectId: string, column: CreateColumn): Promise<Column> {
    const id = randomUUID();
    const newColumn: Column = {
      id,
      projectId,
      ...column,
      data: [],
      merges: {}
    };
    this.columns.set(id, newColumn);
    return newColumn;
  }

  async updateColumnData(columnId: string, data: (string | number)[]): Promise<Column> {
    const column = this.columns.get(columnId);
    if (!column) throw new Error("Column not found");

    const updatedColumn = { ...column, data };
    this.columns.set(columnId, updatedColumn);
    return updatedColumn;
  }

  async mergeColumnTerms(columnId: string, originalTerms: string[], mergedTerm: string): Promise<Column> {
    const column = this.columns.get(columnId);
    if (!column) throw new Error("Column not found");

    const newMerges = { ...column.merges };
    originalTerms.forEach(term => {
      newMerges[term] = mergedTerm;
    });

    const updatedColumn = { ...column, merges: newMerges };
    this.columns.set(columnId, updatedColumn);
    return updatedColumn;
  }

  async deleteColumn(columnId: string): Promise<void> {
    this.columns.delete(columnId);
  }
}

export const storage = new MemStorage();

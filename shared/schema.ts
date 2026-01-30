import { z } from "zod";

// Data Models
export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  createdAt: z.number(),
});

export const columnTypeSchema = z.enum(["categorical", "numeric"]);

export const columnSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1, "Name is required"),
  type: columnTypeSchema,
  data: z.array(z.union([z.string(), z.number()])).default([]),
  // For categorical columns: map of original value -> canonical merged value
  merges: z.record(z.string(), z.string()).default({}), 
});

// API Schemas
export const createProjectSchema = projectSchema.pick({ name: true, description: true });
export const createColumnSchema = columnSchema.pick({ name: true, type: true });

export const updateColumnDataSchema = z.object({
  rawInput: z.string(), // We accept raw string input (comma or newline separated)
});

export const mergeTermsSchema = z.object({
  originalTerms: z.array(z.string()),
  mergedTerm: z.string(),
});

// Types
export type Project = z.infer<typeof projectSchema>;
export type Column = z.infer<typeof columnSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type CreateColumn = z.infer<typeof createColumnSchema>;
export type UpdateColumnData = z.infer<typeof updateColumnDataSchema>;
export type MergeTerms = z.infer<typeof mergeTermsSchema>;

// Distribution Analysis Type
export interface TermFrequency {
  term: string;
  count: number;
  percentage: number;
}

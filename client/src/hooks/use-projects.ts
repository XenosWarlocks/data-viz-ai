import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateProject, type Project, type Column, type CreateColumn, type UpdateColumnData, type MergeTerms } from "@shared/schema";
import { z } from "zod";

// ============================================
// PROJECTS
// ============================================

export function useProjects() {
  return useQuery({
    queryKey: [api.projects.list.path],
    queryFn: async () => {
      const res = await fetch(api.projects.list.path);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return api.projects.list.responses[200].parse(await res.json());
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [api.projects.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.projects.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch project");
      return api.projects.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProject) => {
      const validated = api.projects.create.input.parse(data);
      const res = await fetch(api.projects.create.path, {
        method: api.projects.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return api.projects.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.projects.delete.path, { id });
      const res = await fetch(url, { method: api.projects.delete.method });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
    },
  });
}

// ============================================
// COLUMNS
// ============================================

export function useCreateColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: CreateColumn }) => {
      const validated = api.columns.create.input.parse(data);
      const url = buildUrl(api.columns.create.path, { projectId });
      const res = await fetch(url, {
        method: api.columns.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create column");
      return api.columns.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, variables.projectId] });
    },
  });
}

export function useUpdateColumnData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, columnId, data }: { projectId: string; columnId: string; data: UpdateColumnData }) => {
      const validated = api.columns.updateData.input.parse(data);
      const url = buildUrl(api.columns.updateData.path, { projectId, columnId });
      const res = await fetch(url, {
        method: api.columns.updateData.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to update column data");
      return api.columns.updateData.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, variables.projectId] });
    },
  });
}

export function useMergeTerms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, columnId, data }: { projectId: string; columnId: string; data: MergeTerms }) => {
      const validated = api.columns.mergeTerms.input.parse(data);
      const url = buildUrl(api.columns.mergeTerms.path, { projectId, columnId });
      const res = await fetch(url, {
        method: api.columns.mergeTerms.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to merge terms");
      return api.columns.mergeTerms.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, variables.projectId] });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, columnId }: { projectId: string; columnId: string }) => {
      const url = buildUrl(api.columns.delete.path, { projectId, columnId });
      const res = await fetch(url, { method: api.columns.delete.method });
      if (!res.ok) throw new Error("Failed to delete column");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, variables.projectId] });
    },
  });
}

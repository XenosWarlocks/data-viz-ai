import { z } from 'zod';
import { createProjectSchema, createColumnSchema, updateColumnDataSchema, mergeTermsSchema, projectSchema, columnSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects',
      responses: {
        200: z.array(projectSchema),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects',
      input: createProjectSchema,
      responses: {
        201: projectSchema,
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id',
      responses: {
        200: projectSchema.extend({ columns: z.array(columnSchema) }),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/projects/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  columns: {
    create: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/columns',
      input: createColumnSchema,
      responses: {
        201: columnSchema,
        404: errorSchemas.notFound,
      },
    },
    updateData: {
      method: 'PUT' as const,
      path: '/api/projects/:projectId/columns/:columnId/data',
      input: updateColumnDataSchema,
      responses: {
        200: columnSchema,
        404: errorSchemas.notFound,
      },
    },
    mergeTerms: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/columns/:columnId/merge',
      input: mergeTermsSchema,
      responses: {
        200: columnSchema,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/projects/:projectId/columns/:columnId',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}

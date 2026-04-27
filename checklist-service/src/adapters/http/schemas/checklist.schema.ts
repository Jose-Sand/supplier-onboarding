import { z } from 'zod';

export const createChecklistSchema = z.object({
  title: z.string().min(1, 'title is required').max(200),
  description: z.string().max(1000).optional(),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1, 'task title is required').max(200),
        description: z.string().max(1000).optional(),
      }),
    )
    .optional(),
});

export const checklistIdSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const completeTaskParamsSchema = z.object({
  id: z.string().uuid('checklist id must be a valid UUID'),
  taskId: z.string().uuid('taskId must be a valid UUID'),
});

export const supplierIdQuerySchema = z.object({
  supplierId: z.string().uuid('supplierId must be a valid UUID'),
});

export type CreateChecklistBody = z.infer<typeof createChecklistSchema>;

import { z } from 'zod';

export const TaskGidSchema = z.string()
  .min(1, 'task_gid is required')
  .describe('The globally unique identifier (GID) of the Asana task. Found in the task URL: https://app.asana.com/0/{project_gid}/{task_gid}');

export const GetTaskSchema = z.object({
  task_gid: TaskGidSchema,
  fields: z.string()
    .optional()
    .describe('Comma-separated list of fields to return. Defaults to common fields. Example: "gid,name,notes,completed,assignee.name,due_on"'),
}).strict();

export const AddCommentSchema = z.object({
  task_gid: TaskGidSchema,
  text: z.string()
    .min(1, 'Comment text is required')
    .max(10000, 'Comment text too long (max 10000 chars)')
    .describe('The plain text content of the comment to add to the task'),
}).strict();

export const UpdateTaskSchema = z.object({
  task_gid: TaskGidSchema,
  name: z.string().optional().describe('New name/title for the task'),
  notes: z.string().optional().describe('New description/notes for the task'),
  completed: z.boolean().optional().describe('Set to true to mark task as complete, false to reopen'),
  due_on: z.string().optional().describe('Due date in YYYY-MM-DD format, or null to remove'),
  assignee: z.string().optional().describe('Assignee GID, or "me" for the authenticated user'),
}).strict().refine(
  (data) => data.name !== undefined || data.notes !== undefined || data.completed !== undefined || data.due_on !== undefined || data.assignee !== undefined,
  { message: 'At least one field to update is required (name, notes, completed, due_on, or assignee)' }
);

export const GetTaskStoriesSchema = z.object({
  task_gid: TaskGidSchema,
  limit: z.number()
    .min(1)
    .max(100)
    .default(20)
    .optional()
    .describe('Max number of stories/comments to return (1-100, default 20)'),
}).strict();

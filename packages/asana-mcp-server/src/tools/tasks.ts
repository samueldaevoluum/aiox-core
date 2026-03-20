import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { asanaRequest } from '../services/asana-client.js';
import { GetTaskSchema, AddCommentSchema, UpdateTaskSchema, GetTaskStoriesSchema } from '../schemas/asana.js';
import { DEFAULT_FIELDS, CHARACTER_LIMIT } from '../constants.js';

interface AsanaTask {
  gid: string;
  name: string;
  notes?: string;
  completed?: boolean;
  assignee?: { name: string; gid: string };
  due_on?: string;
  modified_at?: string;
  custom_fields?: Array<{ name: string; display_value: string }>;
}

interface AsanaStory {
  gid: string;
  created_at: string;
  created_by?: { name: string };
  text: string;
  type: string;
}

function truncate(text: string, limit: number = CHARACTER_LIMIT): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + `\n\n[Truncated — ${text.length - limit} chars omitted]`;
}

function formatTask(task: AsanaTask): string {
  const lines = [
    `**${task.name}** (${task.gid})`,
    `Status: ${task.completed ? 'Complete' : 'Incomplete'}`,
  ];
  if (task.assignee) lines.push(`Assignee: ${task.assignee.name}`);
  if (task.due_on) lines.push(`Due: ${task.due_on}`);
  if (task.modified_at) lines.push(`Modified: ${task.modified_at}`);
  if (task.notes) lines.push(`\nNotes:\n${task.notes}`);
  if (task.custom_fields?.length) {
    lines.push('\nCustom Fields:');
    for (const field of task.custom_fields) {
      if (field.display_value) lines.push(`  - ${field.name}: ${field.display_value}`);
    }
  }
  return truncate(lines.join('\n'));
}

function formatStories(stories: AsanaStory[]): string {
  const comments = stories.filter((s) => s.type === 'comment');
  if (comments.length === 0) return 'No comments on this task.';

  const lines = [`**${comments.length} comment(s):**\n`];
  for (const story of comments) {
    const author = story.created_by?.name ?? 'Unknown';
    const date = story.created_at.split('T')[0];
    lines.push(`[${date}] ${author}:\n${story.text}\n`);
  }
  return truncate(lines.join('\n'));
}

export function registerTaskTools(server: McpServer): void {

  server.registerTool(
    'asana_get_task',
    {
      title: 'Get Asana Task',
      description:
        'Retrieve details of an Asana task by its GID. Returns name, status, assignee, due date, notes, and custom fields. ' +
        'Use this to inspect a task before updating it or to gather candidate information from admission tasks.',
      inputSchema: GetTaskSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ task_gid, fields }) => {
      try {
        const task = await asanaRequest<AsanaTask>(`/tasks/${task_gid}`, {
          query: { opt_fields: fields ?? DEFAULT_FIELDS },
        });
        return { content: [{ type: 'text', text: formatTask(task) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text', text: `Failed to get task: ${msg}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'asana_add_comment',
    {
      title: 'Add Comment to Asana Task',
      description:
        'Add a comment (story) to an Asana task. Use this to post status updates, ' +
        'notify team members about admission progress, or log automated actions.',
      inputSchema: AddCommentSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ task_gid, text }) => {
      try {
        await asanaRequest(`/tasks/${task_gid}/stories`, {
          method: 'POST',
          body: { text },
        });
        return { content: [{ type: 'text', text: `Comment added to task ${task_gid}.` }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text', text: `Failed to add comment: ${msg}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'asana_update_task',
    {
      title: 'Update Asana Task',
      description:
        'Update fields of an Asana task: name, notes, completed status, due date, or assignee. ' +
        'Use this to mark admission steps as complete, update task descriptions with generated content, or reassign tasks.',
      inputSchema: UpdateTaskSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ task_gid, ...updates }) => {
      try {
        const body: Record<string, unknown> = {};
        if (updates.name !== undefined) body.name = updates.name;
        if (updates.notes !== undefined) body.notes = updates.notes;
        if (updates.completed !== undefined) body.completed = updates.completed;
        if (updates.due_on !== undefined) body.due_on = updates.due_on;
        if (updates.assignee !== undefined) body.assignee = updates.assignee;

        const task = await asanaRequest<AsanaTask>(`/tasks/${task_gid}`, {
          method: 'PUT',
          body,
        });
        return { content: [{ type: 'text', text: `Task ${task_gid} updated. Name: "${task.name}", Completed: ${task.completed}` }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text', text: `Failed to update task: ${msg}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'asana_get_task_stories',
    {
      title: 'Get Asana Task Comments',
      description:
        'Retrieve comments and activity history (stories) from an Asana task. ' +
        'Use this to read candidate data posted as comments by Manu, or to check admission status updates.',
      inputSchema: GetTaskStoriesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ task_gid, limit }) => {
      try {
        const stories = await asanaRequest<AsanaStory[]>(`/tasks/${task_gid}/stories`, {
          query: {
            opt_fields: 'gid,created_at,created_by.name,text,type',
            limit: String(limit ?? 20),
          },
        });
        return { content: [{ type: 'text', text: formatStories(stories) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text', text: `Failed to get stories: ${msg}` }], isError: true };
      }
    }
  );
}

#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SERVER_NAME, SERVER_VERSION } from './constants.js';
import { registerTaskTools } from './tools/tasks.js';

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

registerTaskTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error starting asana-mcp-server:', error);
  process.exit(1);
});

#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BitbucketClient } from "./client.js";
import { toolDefinitions, toolHandlers } from "./tools/index.js";

const token = process.env.BITBUCKET_TOKEN;
if (!token) {
  process.stderr.write(
    "mcp-server-bitbucket: BITBUCKET_TOKEN environment variable is required.\n" +
      "Set it to a Bitbucket access token with appropriate permissions.\n",
  );
  process.exit(1);
}

const email = process.env.BITBUCKET_USER_EMAIL;
const client = new BitbucketClient(token, email);

const server = new Server(
  { name: "bitbucket", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = toolHandlers[name];

  if (!handler) {
    return {
      content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const result = await handler(client, args ?? {});
    return { content: [{ type: "text" as const, text: result }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: `${name} failed: ${message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

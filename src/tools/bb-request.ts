import { z } from "zod";
import type { BitbucketClient } from "../client.js";

export const definition = {
  name: "bb_request",
  description:
    "Generic fallback: make any Bitbucket Cloud API call not covered by the purpose-built tools. The path is relative to https://api.bitbucket.org/2.0.",
  inputSchema: {
    type: "object" as const,
    properties: {
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        description: "HTTP method.",
      },
      path: {
        type: "string",
        description:
          'API path relative to /2.0, e.g. "/repositories/myworkspace/myrepo/refs/branches".',
      },
      body: {
        type: "object",
        description: "Request body (for POST/PUT/PATCH).",
      },
      query_params: {
        type: "object",
        description: "Query parameters as key-value pairs.",
        additionalProperties: { type: "string" },
      },
    },
    required: ["method", "path"],
  },
};

const schema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string(),
  body: z.record(z.unknown()).optional(),
  query_params: z.record(z.string()).optional(),
});

export async function handler(
  client: BitbucketClient,
  args: unknown,
): Promise<string> {
  const parsed = schema.parse(args);

  const result = await client.request<unknown>(parsed.method, parsed.path, {
    body: parsed.body,
    query: parsed.query_params,
  });

  return JSON.stringify(result, null, 2);
}

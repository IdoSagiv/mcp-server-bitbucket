import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPaginated, BitbucketRef } from "../types.js";
import { fetchAllPages } from "../pagination.js";
import { formatRefList } from "../formatting.js";

export const definition = {
  name: "list_branches",
  description: "List branches in a Bitbucket repository.",
  inputSchema: {
    type: "object" as const,
    properties: {
      workspace: {
        type: "string",
        description:
          "Workspace slug. Falls back to BITBUCKET_DEFAULT_WORKSPACE if not provided.",
      },
      repo_slug: {
        type: "string",
        description: "Repository slug.",
      },
      query: {
        type: "string",
        description:
          'FIQL query to filter branches, e.g. name~"feature".',
      },
      sort: {
        type: "string",
        description:
          'Field to sort by, e.g. "-target.date" for newest first.',
      },
      max_pages: {
        type: "number",
        description:
          "Maximum number of pages to fetch (default: 3). Each page has up to 10 results.",
      },
    },
    required: ["repo_slug"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  query: z.string().optional(),
  sort: z.string().optional(),
  max_pages: z.number().optional(),
});

export async function handler(
  client: BitbucketClient,
  args: unknown,
): Promise<string> {
  const parsed = schema.parse(args);
  const ws = parsed.workspace || process.env.BITBUCKET_DEFAULT_WORKSPACE;
  if (!ws) {
    return "Error: workspace is required. Provide it as a parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.";
  }

  const queryParams: Record<string, string> = {};
  if (parsed.query) queryParams.q = parsed.query;
  if (parsed.sort) queryParams.sort = parsed.sort;

  const firstPage = await client.request<BitbucketPaginated<BitbucketRef>>(
    "GET",
    `/repositories/${ws}/${parsed.repo_slug}/refs/branches`,
    { query: queryParams },
  );

  const refs = await fetchAllPages(client, firstPage, parsed.max_pages ?? 3);
  return formatRefList(refs, "branch");
}

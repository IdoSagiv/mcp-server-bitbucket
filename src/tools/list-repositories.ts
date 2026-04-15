import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPaginated, BitbucketRepository } from "../types.js";
import { fetchAllPages } from "../pagination.js";
import { formatRepositoryList } from "../formatting.js";

export const definition = {
  name: "list_repositories",
  description:
    "List repositories in a Bitbucket workspace. Can filter by name or other query.",
  inputSchema: {
    type: "object" as const,
    properties: {
      workspace: {
        type: "string",
        description:
          "Workspace slug. Falls back to BITBUCKET_DEFAULT_WORKSPACE if not provided.",
      },
      query: {
        type: "string",
        description:
          'FIQL query to filter repositories, e.g. name~"my-repo".',
      },
      max_pages: {
        type: "number",
        description:
          "Maximum number of pages to fetch (default: 3). Each page has up to 50 results.",
      },
    },
    required: [] as string[],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  query: z.string().optional(),
  max_pages: z.number().optional(),
});

export async function handler(
  client: BitbucketClient,
  args: unknown,
): Promise<string> {
  const { workspace, query, max_pages } = schema.parse(args);
  const ws = workspace || process.env.BITBUCKET_DEFAULT_WORKSPACE;
  if (!ws) {
    return "Error: workspace is required. Provide it as a parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.";
  }

  const queryParams: Record<string, string> = {};
  if (query) queryParams.q = query;

  const firstPage = await client.request<
    BitbucketPaginated<BitbucketRepository>
  >("GET", `/repositories/${ws}`, { query: queryParams });

  const repos = await fetchAllPages(client, firstPage, max_pages ?? 3);
  return formatRepositoryList(repos);
}

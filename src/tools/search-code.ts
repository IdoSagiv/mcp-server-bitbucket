import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPaginated, BitbucketSearchResult } from "../types.js";
import { fetchAllPages } from "../pagination.js";
import { formatSearchResults } from "../formatting.js";

export const definition = {
  name: "search_code",
  description:
    "Search for code in a Bitbucket repository. Returns matching files with line numbers and context.",
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
        description: "Search query string.",
      },
      max_pages: {
        type: "number",
        description:
          "Maximum number of pages to fetch (default: 3). Each page has up to 10 results.",
      },
    },
    required: ["repo_slug", "query"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  query: z.string(),
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

  const searchQuery = `repo:${parsed.repo_slug} ${parsed.query}`;

  const firstPage = await client.request<
    BitbucketPaginated<BitbucketSearchResult>
  >(
    "GET",
    `/workspaces/${ws}/search/code`,
    { query: { search_query: searchQuery } },
  );

  const results = await fetchAllPages(
    client,
    firstPage,
    parsed.max_pages ?? 3,
  );
  return formatSearchResults(results);
}

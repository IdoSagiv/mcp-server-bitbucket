import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPaginated, BitbucketPullRequest } from "../types.js";
import { fetchAllPages } from "../pagination.js";
import { formatPullRequestList } from "../formatting.js";

export const definition = {
  name: "find_pull_request",
  description:
    "Search for pull requests by source/destination branch, state, or custom FIQL query.",
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
      source_branch: {
        type: "string",
        description: "Filter by source branch name.",
      },
      destination_branch: {
        type: "string",
        description: "Filter by destination branch name.",
      },
      state: {
        type: "string",
        enum: ["OPEN", "MERGED", "DECLINED", "SUPERSEDED"],
        description: "Filter by PR state (default: OPEN).",
      },
      query: {
        type: "string",
        description:
          "Raw FIQL query string. Overrides source_branch/destination_branch filters.",
      },
    },
    required: ["repo_slug"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  source_branch: z.string().optional(),
  destination_branch: z.string().optional(),
  state: z
    .enum(["OPEN", "MERGED", "DECLINED", "SUPERSEDED"])
    .optional(),
  query: z.string().optional(),
});

export async function handler(
  client: BitbucketClient,
  args: unknown,
): Promise<string> {
  const { workspace, repo_slug, source_branch, destination_branch, state, query } =
    schema.parse(args);
  const ws = workspace || process.env.BITBUCKET_DEFAULT_WORKSPACE;
  if (!ws) {
    return "Error: workspace is required. Provide it as a parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.";
  }

  const queryParams: Record<string, string> = {};

  if (state) queryParams.state = state;

  if (query) {
    queryParams.q = query;
  } else {
    const filters: string[] = [];
    if (source_branch) {
      filters.push(`source.branch.name="${source_branch}"`);
    }
    if (destination_branch) {
      filters.push(`destination.branch.name="${destination_branch}"`);
    }
    if (filters.length > 0) {
      queryParams.q = filters.join(" AND ");
    }
  }

  const firstPage = await client.request<
    BitbucketPaginated<BitbucketPullRequest>
  >("GET", `/repositories/${ws}/${repo_slug}/pullrequests`, {
    query: queryParams,
  });

  const prs = await fetchAllPages(client, firstPage, 5);
  return formatPullRequestList(prs);
}

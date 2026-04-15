import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPaginated, BitbucketActivity } from "../types.js";
import { fetchAllPages } from "../pagination.js";
import { formatActivity } from "../formatting.js";

export const definition = {
  name: "get_pr_activity",
  description:
    "Get the activity timeline of a pull request. Shows updates, approvals, and comments in chronological order.",
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
      pr_id: {
        type: "number",
        description: "Pull request ID.",
      },
      max_pages: {
        type: "number",
        description: "Maximum number of pages to fetch (default: 3).",
      },
    },
    required: ["repo_slug", "pr_id"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  pr_id: z.number(),
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

  const firstPage = await client.request<
    BitbucketPaginated<BitbucketActivity>
  >(
    "GET",
    `/repositories/${ws}/${parsed.repo_slug}/pullrequests/${parsed.pr_id}/activity`,
  );

  const activities = await fetchAllPages(
    client,
    firstPage,
    parsed.max_pages ?? 3,
  );
  return formatActivity(activities);
}

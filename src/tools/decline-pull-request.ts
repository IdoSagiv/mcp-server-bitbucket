import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPullRequest } from "../types.js";

export const definition = {
  name: "decline_pull_request",
  description: "Decline (close without merging) a pull request.",
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
    },
    required: ["repo_slug", "pr_id"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  pr_id: z.number(),
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

  const pr = await client.request<BitbucketPullRequest>(
    "POST",
    `/repositories/${ws}/${parsed.repo_slug}/pullrequests/${parsed.pr_id}/decline`,
  );

  return `Pull request #${parsed.pr_id} declined. State: ${pr.state}`;
}

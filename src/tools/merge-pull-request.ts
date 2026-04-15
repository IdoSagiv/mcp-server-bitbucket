import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPullRequest } from "../types.js";
import { formatPullRequest } from "../formatting.js";

export const definition = {
  name: "merge_pull_request",
  description:
    "Merge a pull request. Supports merge commit, squash, and fast-forward strategies.",
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
      merge_strategy: {
        type: "string",
        enum: ["merge_commit", "squash", "fast_forward"],
        description: "Merge strategy to use.",
      },
      close_source_branch: {
        type: "boolean",
        description: "Whether to close the source branch after merging.",
      },
      message: {
        type: "string",
        description: "Custom merge commit message.",
      },
    },
    required: ["repo_slug", "pr_id"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  pr_id: z.number(),
  merge_strategy: z
    .enum(["merge_commit", "squash", "fast_forward"])
    .optional(),
  close_source_branch: z.boolean().optional(),
  message: z.string().optional(),
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

  const body: Record<string, unknown> = { type: "pullrequest" };

  if (parsed.merge_strategy) body.merge_strategy = parsed.merge_strategy;
  if (parsed.close_source_branch !== undefined)
    body.close_source_branch = parsed.close_source_branch;
  if (parsed.message) body.message = parsed.message;

  const pr = await client.request<BitbucketPullRequest>(
    "POST",
    `/repositories/${ws}/${parsed.repo_slug}/pullrequests/${parsed.pr_id}/merge`,
    { body },
  );

  return `Pull request merged successfully!\n\n${formatPullRequest(pr)}`;
}

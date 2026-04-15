import { z } from "zod";
import type { BitbucketClient } from "../client.js";

export const definition = {
  name: "resolve_pr_comment",
  description:
    "Resolve or unresolve a comment on a pull request.",
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
      comment_id: {
        type: "number",
        description: "Comment ID to resolve or unresolve.",
      },
      action: {
        type: "string",
        enum: ["resolve", "unresolve"],
        description: 'Action to perform (default: "resolve").',
      },
    },
    required: ["repo_slug", "pr_id", "comment_id"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  pr_id: z.number(),
  comment_id: z.number(),
  action: z.enum(["resolve", "unresolve"]).optional(),
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

  const action = parsed.action ?? "resolve";
  const method = action === "resolve" ? "PUT" : "DELETE";

  await client.request(
    method,
    `/repositories/${ws}/${parsed.repo_slug}/pullrequests/${parsed.pr_id}/comments/${parsed.comment_id}/resolve`,
  );

  return action === "resolve"
    ? `Comment #${parsed.comment_id} resolved.`
    : `Comment #${parsed.comment_id} unresolved.`;
}

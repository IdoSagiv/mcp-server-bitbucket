import { z } from "zod";
import type { BitbucketClient } from "../client.js";

export const definition = {
  name: "approve_pull_request",
  description: "Approve a pull request, or remove your approval.",
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
      action: {
        type: "string",
        enum: ["approve", "unapprove"],
        description: 'Action to perform (default: "approve").',
      },
    },
    required: ["repo_slug", "pr_id"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  pr_id: z.number(),
  action: z.enum(["approve", "unapprove"]).optional(),
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

  const action = parsed.action ?? "approve";
  const method = action === "approve" ? "POST" : "DELETE";

  await client.request(
    method,
    `/repositories/${ws}/${parsed.repo_slug}/pullrequests/${parsed.pr_id}/approve`,
  );

  return action === "approve"
    ? `Pull request #${parsed.pr_id} approved.`
    : `Approval removed from pull request #${parsed.pr_id}.`;
}

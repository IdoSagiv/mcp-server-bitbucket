import { z } from "zod";
import type { BitbucketClient } from "../client.js";

const MAX_DIFF_SIZE = 100_000; // 100KB

export const definition = {
  name: "get_pr_diff",
  description:
    "Get the full diff of a pull request as raw text. Large diffs are truncated at 100KB.",
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

  const diff = await client.requestRaw(
    "GET",
    `/repositories/${ws}/${parsed.repo_slug}/pullrequests/${parsed.pr_id}/diff`,
  );

  if (diff.length > MAX_DIFF_SIZE) {
    return `${diff.slice(0, MAX_DIFF_SIZE)}\n\n[Diff truncated at 100KB. Full diff is ${diff.length} bytes.]`;
  }

  return diff;
}

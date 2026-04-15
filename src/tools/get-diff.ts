import { z } from "zod";
import type { BitbucketClient } from "../client.js";

const MAX_DIFF_SIZE = 100_000; // 100KB

export const definition = {
  name: "get_diff",
  description:
    'Get the diff for a commit or between two revisions. The spec can be a single commit hash (diff against its parent) or a range like "commit1..commit2". Large diffs are truncated at 100KB.',
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
      spec: {
        type: "string",
        description:
          'Revision spec: a single commit hash or a range like "commit1..commit2".',
      },
    },
    required: ["repo_slug", "spec"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  spec: z.string(),
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

  const encodedSpec = parsed.spec
    .split("..")
    .map(encodeURIComponent)
    .join("..");

  const diff = await client.requestRaw(
    "GET",
    `/repositories/${ws}/${parsed.repo_slug}/diff/${encodedSpec}`,
  );

  if (diff.length > MAX_DIFF_SIZE) {
    return `${diff.slice(0, MAX_DIFF_SIZE)}\n\n[Diff truncated at 100KB. Full diff is ${diff.length} bytes.]`;
  }

  return diff;
}

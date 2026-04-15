import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPullRequest } from "../types.js";
import { formatPullRequest } from "../formatting.js";

export const definition = {
  name: "create_pull_request",
  description:
    "Create a new pull request from a source branch to a destination branch.",
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
      title: {
        type: "string",
        description: "Pull request title.",
      },
      source_branch: {
        type: "string",
        description: "Source branch name.",
      },
      destination_branch: {
        type: "string",
        description:
          "Destination branch name. Defaults to the repository's main branch if not specified.",
      },
      description: {
        type: "string",
        description: "Pull request description (Markdown supported).",
      },
      reviewers: {
        type: "array",
        items: { type: "string" },
        description:
          "List of reviewer UUIDs or account IDs to add as reviewers.",
      },
      close_source_branch: {
        type: "boolean",
        description:
          "Whether to close the source branch after merging (default: true).",
      },
    },
    required: ["repo_slug", "title", "source_branch"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  title: z.string(),
  source_branch: z.string(),
  destination_branch: z.string().optional(),
  description: z.string().optional(),
  reviewers: z.array(z.string()).optional(),
  close_source_branch: z.boolean().optional(),
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

  const body: Record<string, unknown> = {
    title: parsed.title,
    source: { branch: { name: parsed.source_branch } },
    close_source_branch: parsed.close_source_branch ?? true,
  };

  if (parsed.destination_branch) {
    body.destination = { branch: { name: parsed.destination_branch } };
  }

  if (parsed.description) {
    body.description = parsed.description;
  }

  if (parsed.reviewers && parsed.reviewers.length > 0) {
    body.reviewers = parsed.reviewers.map((id) => ({ uuid: id }));
  }

  const pr = await client.request<BitbucketPullRequest>(
    "POST",
    `/repositories/${ws}/${parsed.repo_slug}/pullrequests`,
    { body },
  );

  return `Pull request created successfully!\n\n${formatPullRequest(pr)}`;
}

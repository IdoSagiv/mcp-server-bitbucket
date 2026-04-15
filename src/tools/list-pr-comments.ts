import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPaginated, BitbucketComment } from "../types.js";
import { fetchAllPages } from "../pagination.js";
import { formatCommentList } from "../formatting.js";

export const definition = {
  name: "list_pr_comments",
  description:
    "List comments on a pull request. Can filter by author, resolution status, or comment type (inline vs general).",
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
      author: {
        type: "string",
        description:
          "Filter by author display name or nickname (case-insensitive partial match).",
      },
      resolved: {
        type: "boolean",
        description:
          "Filter by resolution status: true for resolved, false for unresolved.",
      },
      inline_only: {
        type: "boolean",
        description: "Only return inline (file-level) comments.",
      },
      general_only: {
        type: "boolean",
        description: "Only return general (non-inline) comments.",
      },
      max_pages: {
        type: "number",
        description: "Maximum number of pages to fetch (default: 5).",
      },
    },
    required: ["repo_slug", "pr_id"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  pr_id: z.number(),
  author: z.string().optional(),
  resolved: z.boolean().optional(),
  inline_only: z.boolean().optional(),
  general_only: z.boolean().optional(),
  max_pages: z.number().optional(),
});

export async function handler(
  client: BitbucketClient,
  args: unknown,
): Promise<string> {
  const { workspace, repo_slug, pr_id, author, resolved, inline_only, general_only, max_pages } =
    schema.parse(args);
  const ws = workspace || process.env.BITBUCKET_DEFAULT_WORKSPACE;
  if (!ws) {
    return "Error: workspace is required. Provide it as a parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.";
  }

  const firstPage = await client.request<
    BitbucketPaginated<BitbucketComment>
  >(
    "GET",
    `/repositories/${ws}/${repo_slug}/pullrequests/${pr_id}/comments`,
  );

  let comments = await fetchAllPages(client, firstPage, max_pages ?? 5);

  // Filter out deleted comments
  comments = comments.filter((c) => !c.deleted);

  // Apply client-side filters
  if (author) {
    const authorLower = author.toLowerCase();
    comments = comments.filter(
      (c) =>
        c.user.display_name.toLowerCase().includes(authorLower) ||
        c.user.nickname.toLowerCase().includes(authorLower),
    );
  }

  if (resolved !== undefined) {
    comments = comments.filter((c) =>
      resolved ? c.resolution != null : c.resolution == null,
    );
  }

  if (inline_only) {
    comments = comments.filter((c) => c.inline != null);
  }

  if (general_only) {
    comments = comments.filter((c) => c.inline == null);
  }

  return formatCommentList(comments);
}

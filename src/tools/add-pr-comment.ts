import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketComment } from "../types.js";

export const definition = {
  name: "add_pr_comment",
  description:
    "Add a comment to a pull request. Supports general comments, inline comments on specific files/lines, and replies to existing comments.",
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
      content: {
        type: "string",
        description: "Comment text (Markdown supported).",
      },
      file_path: {
        type: "string",
        description:
          "File path for inline comment. If provided, creates an inline comment instead of a general one.",
      },
      line: {
        type: "number",
        description: "Line number for inline comment (the 'to' line in the diff).",
      },
      parent_id: {
        type: "number",
        description: "Parent comment ID to reply to an existing comment thread.",
      },
    },
    required: ["repo_slug", "pr_id", "content"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  pr_id: z.number(),
  content: z.string(),
  file_path: z.string().optional(),
  line: z.number().optional(),
  parent_id: z.number().optional(),
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
    content: { raw: parsed.content },
  };

  if (parsed.file_path) {
    body.inline = {
      path: parsed.file_path,
      ...(parsed.line !== undefined ? { to: parsed.line } : {}),
    };
  }

  if (parsed.parent_id) {
    body.parent = { id: parsed.parent_id };
  }

  const comment = await client.request<BitbucketComment>(
    "POST",
    `/repositories/${ws}/${parsed.repo_slug}/pullrequests/${parsed.pr_id}/comments`,
    { body },
  );

  const type = comment.inline ? "Inline comment" : "Comment";
  return `${type} #${comment.id} added successfully.`;
}

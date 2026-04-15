import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import { resolveRevision } from "./resolve-revision.js";

const MAX_FILE_SIZE = 100_000; // 100KB

export const definition = {
  name: "get_file_content",
  description:
    "Read the content of a file from a Bitbucket repository at a given revision. Large files are truncated at 100KB.",
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
      path: {
        type: "string",
        description: "File path within the repository.",
      },
      revision: {
        type: "string",
        description:
          "Branch name, tag, or commit hash. Defaults to the repository's main branch.",
      },
    },
    required: ["repo_slug", "path"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  path: z.string(),
  revision: z.string().optional(),
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

  const rev = await resolveRevision(client, ws, parsed.repo_slug, parsed.revision);
  const encodedPath = parsed.path
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const content = await client.requestRaw(
    "GET",
    `/repositories/${ws}/${parsed.repo_slug}/src/${encodeURIComponent(rev)}/${encodedPath}`,
  );

  const byteSize = Buffer.byteLength(content, "utf-8");
  const header = `## File: ${parsed.path}\n**Revision:** ${rev} | **Size:** ${byteSize} bytes\n`;

  if (byteSize > MAX_FILE_SIZE) {
    const truncated = Buffer.from(content, "utf-8")
      .subarray(0, MAX_FILE_SIZE)
      .toString("utf-8");
    return `${header}\n${truncated}\n\n[File truncated at 100KB. Full file is ${byteSize} bytes.]`;
  }

  return `${header}\n${content}`;
}

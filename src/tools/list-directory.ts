import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPaginated, BitbucketSourceEntry } from "../types.js";
import { fetchAllPages } from "../pagination.js";
import { formatDirectoryListing } from "../formatting.js";
import { resolveRevision } from "./resolve-revision.js";

export const definition = {
  name: "list_directory",
  description:
    "List the contents of a directory in a Bitbucket repository at a given revision.",
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
        description:
          'Directory path within the repository. Defaults to the repository root ("").',
      },
      revision: {
        type: "string",
        description:
          "Branch name, tag, or commit hash. Defaults to the repository's main branch.",
      },
      max_depth: {
        type: "number",
        description:
          "Depth of directory tree to return (default: 1, immediate contents only).",
      },
      max_pages: {
        type: "number",
        description:
          "Maximum number of pages to fetch (default: 5). Each page has up to 10 results.",
      },
    },
    required: ["repo_slug"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  path: z.string().optional(),
  revision: z.string().optional(),
  max_depth: z.number().optional(),
  max_pages: z.number().optional(),
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
  const dirPath = parsed.path || "";
  const encodedPath = dirPath
    ? dirPath.split("/").map(encodeURIComponent).join("/")
    : "";

  const queryParams: Record<string, string> = {};
  if (parsed.max_depth && parsed.max_depth > 1) {
    queryParams.max_depth = String(parsed.max_depth);
  }

  const apiPath = encodedPath
    ? `/repositories/${ws}/${parsed.repo_slug}/src/${encodeURIComponent(rev)}/${encodedPath}`
    : `/repositories/${ws}/${parsed.repo_slug}/src/${encodeURIComponent(rev)}/`;

  const firstPage = await client.request<
    BitbucketPaginated<BitbucketSourceEntry>
  >("GET", apiPath, { query: queryParams });

  const entries = await fetchAllPages(
    client,
    firstPage,
    parsed.max_pages ?? 5,
  );
  return formatDirectoryListing(entries, dirPath);
}

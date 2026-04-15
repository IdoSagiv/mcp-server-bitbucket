import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketPaginated, BitbucketCommit } from "../types.js";
import { fetchAllPages } from "../pagination.js";
import { formatCommitList } from "../formatting.js";
import { resolveRevision } from "./resolve-revision.js";

export const definition = {
  name: "list_commits",
  description:
    "List commit history for a Bitbucket repository. Can filter by branch, path, or revision range.",
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
      revision: {
        type: "string",
        description:
          "Branch name, tag, or commit hash to list commits from. Defaults to the repository's main branch.",
      },
      path: {
        type: "string",
        description: "Filter commits to only those affecting this file path.",
      },
      include: {
        type: "string",
        description:
          "Commit hash or ref to include (for revision ranges).",
      },
      exclude: {
        type: "string",
        description:
          "Commit hash or ref to exclude (for revision ranges).",
      },
      max_pages: {
        type: "number",
        description:
          "Maximum number of pages to fetch (default: 3). Each page has up to 30 results.",
      },
    },
    required: ["repo_slug"],
  },
};

const schema = z.object({
  workspace: z.string().optional(),
  repo_slug: z.string(),
  revision: z.string().optional(),
  path: z.string().optional(),
  include: z.string().optional(),
  exclude: z.string().optional(),
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

  const queryParams: Record<string, string> = {};
  if (parsed.path) queryParams.path = parsed.path;
  if (parsed.include) queryParams.include = parsed.include;
  if (parsed.exclude) queryParams.exclude = parsed.exclude;

  const useRevisionRange = parsed.include || parsed.exclude;
  let apiPath: string;

  if (useRevisionRange && !parsed.revision) {
    apiPath = `/repositories/${ws}/${parsed.repo_slug}/commits`;
  } else {
    const rev = await resolveRevision(client, ws, parsed.repo_slug, parsed.revision);
    apiPath = `/repositories/${ws}/${parsed.repo_slug}/commits/${encodeURIComponent(rev)}`;
  }

  const firstPage = await client.request<
    BitbucketPaginated<BitbucketCommit>
  >("GET", apiPath, { query: queryParams });

  const commits = await fetchAllPages(
    client,
    firstPage,
    parsed.max_pages ?? 3,
  );
  return formatCommitList(commits);
}

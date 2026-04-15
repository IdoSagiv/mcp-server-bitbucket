import type { BitbucketClient } from "../client.js";
import type { BitbucketRepository } from "../types.js";

export async function resolveRevision(
  client: BitbucketClient,
  workspace: string,
  repoSlug: string,
  revision?: string,
): Promise<string> {
  if (revision) return revision;

  const repo = await client.request<BitbucketRepository>(
    "GET",
    `/repositories/${workspace}/${repoSlug}`,
  );
  return repo.mainbranch?.name ?? "main";
}

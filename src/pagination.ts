import type { BitbucketClient } from "./client.js";
import type { BitbucketPaginated } from "./types.js";

export async function fetchAllPages<T>(
  client: BitbucketClient,
  firstPage: BitbucketPaginated<T>,
  maxPages: number = 10,
): Promise<T[]> {
  const results = [...firstPage.values];
  let nextUrl = firstPage.next;
  let pages = 1;

  while (nextUrl && pages < maxPages) {
    const page = await client.fetchPage<T>(nextUrl);
    results.push(...page.values);
    nextUrl = page.next;
    pages++;
  }

  return results;
}

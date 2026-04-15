import { z } from "zod";
import type { BitbucketClient } from "../client.js";
import type { BitbucketUser } from "../types.js";
import { formatUser } from "../formatting.js";

export const definition = {
  name: "get_current_user",
  description:
    "Get information about the currently authenticated Bitbucket user. Useful for verifying authentication works.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [] as string[],
  },
};

const schema = z.object({});

export async function handler(
  client: BitbucketClient,
  args: unknown,
): Promise<string> {
  schema.parse(args);
  const user = await client.request<BitbucketUser>("GET", "/user");
  const lines = [
    `**Display Name:** ${user.display_name}`,
    `**Nickname:** ${user.nickname}`,
    `**UUID:** ${user.uuid}`,
    `**Account ID:** ${user.account_id}`,
  ];
  if (user.links.html?.href) {
    lines.push(`**Profile:** ${user.links.html.href}`);
  }
  return lines.join("\n");
}

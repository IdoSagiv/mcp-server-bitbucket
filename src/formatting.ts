import type {
  BitbucketPullRequest,
  BitbucketComment,
  BitbucketRepository,
  BitbucketUser,
  BitbucketActivity,
  BitbucketSourceEntry,
  BitbucketRef,
  BitbucketCommit,
  BitbucketSearchResult,
} from "./types.js";

export function formatUser(user: BitbucketUser): string {
  const parts = [user.display_name];
  if (user.nickname) parts.push(`(@${user.nickname})`);
  return parts.join(" ");
}

export function formatPullRequest(pr: BitbucketPullRequest): string {
  const lines: string[] = [
    `# PR #${pr.id}: ${pr.title}`,
    ``,
    `**State:** ${pr.state}`,
    `**Author:** ${formatUser(pr.author)}`,
    `**Branch:** ${pr.source.branch.name} → ${pr.destination.branch.name}`,
  ];

  if (pr.reviewers.length > 0) {
    lines.push(
      `**Reviewers:** ${pr.reviewers.map((r) => formatUser(r)).join(", ")}`,
    );
  }

  if (pr.participants.length > 0) {
    const participantInfo = pr.participants
      .map((p) => {
        const status = p.approved
          ? "approved"
          : p.state === "changes_requested"
            ? "changes requested"
            : p.role;
        return `${formatUser(p.user)} (${status})`;
      })
      .join(", ");
    lines.push(`**Participants:** ${participantInfo}`);
  }

  lines.push(`**Comments:** ${pr.comment_count} | **Tasks:** ${pr.task_count}`);
  lines.push(
    `**Created:** ${formatDate(pr.created_on)} | **Updated:** ${formatDate(pr.updated_on)}`,
  );

  if (pr.close_source_branch) {
    lines.push(`**Close source branch:** yes`);
  }

  if (pr.merge_commit) {
    lines.push(`**Merge commit:** ${pr.merge_commit.hash}`);
  }

  if (pr.links.html?.href) {
    lines.push(`**URL:** ${pr.links.html.href}`);
  }

  if (pr.description) {
    lines.push(``, `## Description`, ``, pr.description);
  }

  return lines.join("\n");
}

export function formatPullRequestList(prs: BitbucketPullRequest[]): string {
  if (prs.length === 0) return "No pull requests found.";

  return prs
    .map((pr, i) => {
      const line = `${i + 1}. **#${pr.id}** ${pr.title} [${pr.state}]`;
      const details = `   ${pr.source.branch.name} → ${pr.destination.branch.name} | by ${formatUser(pr.author)} | ${formatDate(pr.created_on)}`;
      return `${line}\n${details}`;
    })
    .join("\n\n");
}

export function formatComment(comment: BitbucketComment): string {
  if (comment.deleted) return `~~Comment #${comment.id} (deleted)~~`;

  const lines: string[] = [];

  const header = `**${formatUser(comment.user)}** — ${formatDate(comment.created_on)}`;
  lines.push(header);

  if (comment.inline) {
    const loc = comment.inline.to
      ? `line ${comment.inline.to}`
      : comment.inline.from
        ? `line ${comment.inline.from}`
        : "";
    lines.push(`*Inline: ${comment.inline.path}${loc ? ` (${loc})` : ""}*`);
  }

  if (comment.parent) {
    lines.push(`*Reply to comment #${comment.parent.id}*`);
  }

  if (comment.resolution) {
    lines.push(
      `*Resolved by ${formatUser(comment.resolution.user)} on ${formatDate(comment.resolution.created_on)}*`,
    );
  }

  lines.push("", comment.content.raw);

  return lines.join("\n");
}

export function formatCommentList(comments: BitbucketComment[]): string {
  if (comments.length === 0) return "No comments found.";

  return comments
    .map(
      (c, i) =>
        `### Comment #${c.id} (${i + 1}/${comments.length})\n\n${formatComment(c)}`,
    )
    .join("\n\n---\n\n");
}

export function formatRepository(repo: BitbucketRepository): string {
  const lines: string[] = [
    `**${repo.full_name}** ${repo.is_private ? "(private)" : "(public)"}`,
  ];

  if (repo.description) lines.push(`  ${repo.description}`);
  if (repo.mainbranch) lines.push(`  Main branch: ${repo.mainbranch.name}`);
  if (repo.project) lines.push(`  Project: ${repo.project.name}`);
  if (repo.links.html?.href) lines.push(`  URL: ${repo.links.html.href}`);

  return lines.join("\n");
}

export function formatRepositoryList(repos: BitbucketRepository[]): string {
  if (repos.length === 0) return "No repositories found.";
  return repos.map((r, i) => `${i + 1}. ${formatRepository(r)}`).join("\n\n");
}

export function formatActivity(activities: BitbucketActivity[]): string {
  if (activities.length === 0) return "No activity found.";

  return activities
    .map((a) => {
      if (a.update) {
        return `**Update** by ${formatUser(a.update.author)} on ${formatDate(a.update.date)} — state: ${a.update.state}`;
      }
      if (a.approval) {
        return `**Approved** by ${formatUser(a.approval.user)} on ${formatDate(a.approval.date)}`;
      }
      if (a.comment) {
        const snippet = a.comment.content.raw.slice(0, 100);
        const truncated =
          a.comment.content.raw.length > 100 ? "..." : "";
        return `**Comment** by ${formatUser(a.comment.user)} on ${formatDate(a.comment.created_on)}: ${snippet}${truncated}`;
      }
      return `**Activity** on PR #${a.pull_request.id}`;
    })
    .join("\n\n");
}

export function formatDirectoryListing(
  entries: BitbucketSourceEntry[],
  path: string,
): string {
  if (entries.length === 0) return `Directory \`${path || "/"}\` is empty.`;

  const dirs = entries.filter((e) => e.type === "commit_directory");
  const files = entries.filter((e) => e.type === "commit_file");
  const sorted = [...dirs, ...files];

  const lines: string[] = [
    `## Directory: ${path || "/"}`,
    ``,
    `${dirs.length} directories, ${files.length} files`,
    ``,
  ];

  for (const entry of sorted) {
    const name = entry.path.split("/").pop() || entry.path;
    if (entry.type === "commit_directory") {
      lines.push(`- [DIR]  ${name}/`);
    } else {
      const size = entry.size != null ? ` (${entry.size} bytes)` : "";
      lines.push(`- [FILE] ${name}${size}`);
    }
  }

  return lines.join("\n");
}

export function formatRef(ref: BitbucketRef): string {
  const hash = ref.target.hash.slice(0, 7);
  const date = formatDate(ref.target.date);
  return `**${ref.name}** — ${hash} — ${date}`;
}

export function formatRefList(
  refs: BitbucketRef[],
  kind: "branch" | "tag",
): string {
  const plural = kind === "branch" ? "Branches" : "Tags";
  if (refs.length === 0) return `No ${plural.toLowerCase()} found.`;

  const header = `## ${plural} (${refs.length} found)\n`;
  const list = refs.map((r, i) => `${i + 1}. ${formatRef(r)}`).join("\n");
  return header + "\n" + list;
}

export function formatCommit(commit: BitbucketCommit): string {
  const hash = commit.hash.slice(0, 7);
  const date = formatDate(commit.date);
  const author = commit.author.user
    ? formatUser(commit.author.user)
    : commit.author.raw;
  const message = commit.message.split("\n")[0];
  return `**${hash}** ${message}\n   by ${author} — ${date}`;
}

export function formatCommitList(commits: BitbucketCommit[]): string {
  if (commits.length === 0) return "No commits found.";
  return commits.map((c, i) => `${i + 1}. ${formatCommit(c)}`).join("\n\n");
}

export function formatSearchResults(
  results: BitbucketSearchResult[],
): string {
  if (results.length === 0) return "No matches found.";

  return results
    .map((r) => {
      const lines: string[] = [`### ${r.file.path}`];
      for (const match of r.content_matches) {
        for (const line of match.lines) {
          const text = line.segments.map((s) => s.text).join("");
          lines.push(`  L${line.line}: ${text}`);
        }
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 19);
  } catch {
    return iso;
  }
}

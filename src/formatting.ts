import type {
  BitbucketPullRequest,
  BitbucketComment,
  BitbucketRepository,
  BitbucketUser,
  BitbucketActivity,
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 19);
  } catch {
    return iso;
  }
}

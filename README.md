<p align="center">
  <h1 align="center">mcp-server-bitbucket</h1>
  <p align="center">
    An MCP server for Bitbucket Cloud &mdash; source browsing, pull requests, code review, debugging, and more.
    <br />
    <a href="#getting-started">Getting Started</a> &middot; <a href="#available-tools">Tools</a> &middot; <a href="#usage-examples">Examples</a> &middot; <a href="#tool-reference">Reference</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.0-blue" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node" />
  <img src="https://img.shields.io/badge/Bitbucket%20Cloud-REST%20API%20v2.0-0052CC" alt="Bitbucket API" />
</p>

---

Give AI assistants like Claude the ability to interact with your Bitbucket repositories &mdash; browse source code, search, review pull requests, debug across repos, and more &mdash; all through the [Model Context Protocol](https://modelcontextprotocol.io/).

## Available Tools

<table>
<tr><th colspan="2">Pull Request Management</th></tr>
<tr><td><code>create_pull_request</code></td><td>Create a new PR from a source branch to a destination branch</td></tr>
<tr><td><code>find_pull_request</code></td><td>Search PRs by source/destination branch, state, or custom query</td></tr>
<tr><td><code>get_pull_request</code></td><td>Get full details of a single PR by its ID</td></tr>

<tr><th colspan="2">Code Review</th></tr>
<tr><td><code>list_pr_comments</code></td><td>List comments with filtering by author, resolution status, or type</td></tr>
<tr><td><code>add_pr_comment</code></td><td>Add general, inline, or reply comments to a PR</td></tr>
<tr><td><code>approve_pull_request</code></td><td>Approve a PR or remove your approval</td></tr>
<tr><td><code>request_changes</code></td><td>Mark a PR as "changes requested"</td></tr>

<tr><th colspan="2">PR Actions</th></tr>
<tr><td><code>merge_pull_request</code></td><td>Merge a PR (merge commit, squash, or fast-forward)</td></tr>
<tr><td><code>decline_pull_request</code></td><td>Decline (close without merging) a PR</td></tr>

<tr><th colspan="2">PR Insights</th></tr>
<tr><td><code>get_pr_diff</code></td><td>Get the full diff as raw text</td></tr>
<tr><td><code>get_pr_activity</code></td><td>Get the activity timeline &mdash; updates, approvals, comments</td></tr>

<tr><th colspan="2">Source Browsing</th></tr>
<tr><td><code>get_file_content</code></td><td>Read a file from a repository at any branch, tag, or commit</td></tr>
<tr><td><code>list_directory</code></td><td>List directory contents at a given revision</td></tr>
<tr><td><code>list_branches</code></td><td>List branches in a repository</td></tr>
<tr><td><code>list_tags</code></td><td>List tags in a repository</td></tr>

<tr><th colspan="2">Debugging</th></tr>
<tr><td><code>search_code</code></td><td>Search for code patterns in a repository</td></tr>
<tr><td><code>list_commits</code></td><td>List commit history, filterable by branch and file path</td></tr>
<tr><td><code>get_diff</code></td><td>Get the diff for a commit or between two revisions</td></tr>

<tr><th colspan="2">Discovery & Utility</th></tr>
<tr><td><code>list_repositories</code></td><td>List repositories in a workspace</td></tr>
<tr><td><code>get_current_user</code></td><td>Get info about the authenticated user</td></tr>
<tr><td><code>bb_request</code></td><td>Generic fallback &mdash; make any Bitbucket API call</td></tr>
</table>

## Getting Started

### 1. Create an API Token

Go to **[Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)** and create a new **scoped** token with the following permissions:

| Scope | Access | Used for |
|-------|--------|----------|
| Repositories | Read | Listing repos, reading PRs |
| Repositories | Write | Creating PRs |
| Pull requests | Read | Reading PR details, comments, diffs |
| Pull requests | Write | Creating comments, approving, merging |

### 2. Clone and Build

> Requires **Node.js 18+**

```bash
git clone https://github.com/IdoSagiv/mcp-server-bitbucket.git
cd mcp-server-bitbucket
npm install
npm run build
```

### 3. Add to Your MCP Client

<details open>
<summary><strong>Claude Code</strong></summary>

Run the following command, replacing the placeholders:

```bash
claude mcp add bitbucket \
  node /path/to/mcp-server-bitbucket/dist/index.js \
  -e BITBUCKET_TOKEN=<your-api-token> \
  -e BITBUCKET_USER_EMAIL=<your-atlassian-email> \
  -e BITBUCKET_DEFAULT_WORKSPACE=<your-workspace-slug> \
  -s user
```

Or manually add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["/path/to/mcp-server-bitbucket/dist/index.js"],
      "env": {
        "BITBUCKET_TOKEN": "<your-api-token>",
        "BITBUCKET_USER_EMAIL": "<your-atlassian-email>",
        "BITBUCKET_DEFAULT_WORKSPACE": "<your-workspace-slug>"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["/path/to/mcp-server-bitbucket/dist/index.js"],
      "env": {
        "BITBUCKET_TOKEN": "<your-api-token>",
        "BITBUCKET_USER_EMAIL": "<your-atlassian-email>",
        "BITBUCKET_DEFAULT_WORKSPACE": "<your-workspace-slug>"
      }
    }
  }
}
```

Restart Claude Desktop after updating the configuration.

</details>

<details>
<summary><strong>Other MCP Clients</strong></summary>

This server uses the standard MCP stdio transport, so it works with any MCP-compatible client (Cursor, Continue.dev, Cline, etc.). Point the client at the built `dist/index.js` with the required environment variables.

</details>

### 4. Verify

Restart your MCP client, then ask Claude:

> "Use the get_current_user bitbucket tool to verify my auth works"

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `BITBUCKET_TOKEN` | Yes | Atlassian API token &mdash; [create one here](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `BITBUCKET_USER_EMAIL` | Yes | Your Atlassian account email (used for Basic Auth) |
| `BITBUCKET_DEFAULT_WORKSPACE` | No | Default workspace slug, used when `workspace` is omitted from a tool call |

## Usage Examples

> **"Create a PR from branch `feature/login` to `main` in the `backend-api` repo"**

> **"Review PR #42 in `backend-api` &mdash; read the diff and add inline comments on any issues you find"**

> **"Find the open PR for branch `feature/login` in `backend-api`"**

> **"Get the activity timeline for PR #42 &mdash; who approved it, what comments are pending?"**

> **"List all unresolved comments on PR #42 in `backend-api`"**

> **"Show me the contents of `src/config.ts` on the `main` branch in `backend-api`"**

> **"List all branches in the `backend-api` repo"**

> **"Search for `handleAuth` across the `backend-api` repository"**

> **"Show the last 10 commits on the `feature/login` branch"**

> **"What changed in commit `abc1234` in `backend-api`?"**

---

## Tool Reference

<details>
<summary><code>create_pull_request</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug (falls back to `BITBUCKET_DEFAULT_WORKSPACE`) |
| repo_slug | string | Yes | Repository slug |
| title | string | Yes | PR title |
| source_branch | string | Yes | Source branch name |
| destination_branch | string | | Destination branch (defaults to repo main branch) |
| description | string | | PR description (Markdown) |
| reviewers | string[] | | Reviewer UUIDs or account IDs |
| close_source_branch | boolean | | Close source branch after merge (default: true) |

</details>

<details>
<summary><code>find_pull_request</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| source_branch | string | | Filter by source branch |
| destination_branch | string | | Filter by destination branch |
| state | string | | OPEN, MERGED, DECLINED, or SUPERSEDED |
| query | string | | Raw FIQL query (overrides branch filters) |

</details>

<details>
<summary><code>get_pull_request</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |

</details>

<details>
<summary><code>list_pr_comments</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |
| author | string | | Filter by author name (case-insensitive partial match) |
| resolved | boolean | | `true` = resolved only, `false` = unresolved only |
| inline_only | boolean | | Only inline (file-level) comments |
| general_only | boolean | | Only general comments |
| max_pages | number | | Max pages to fetch (default: 5) |

</details>

<details>
<summary><code>add_pr_comment</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |
| content | string | Yes | Comment text (Markdown) |
| file_path | string | | File path for inline comment |
| line | number | | Line number for inline comment |
| parent_id | number | | Parent comment ID for replies |

</details>

<details>
<summary><code>merge_pull_request</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |
| merge_strategy | string | | `merge_commit`, `squash`, or `fast_forward` |
| close_source_branch | boolean | | Close source branch after merge |
| message | string | | Custom merge commit message |

</details>

<details>
<summary><code>approve_pull_request</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |
| action | string | | `"approve"` (default) or `"unapprove"` |

</details>

<details>
<summary><code>request_changes</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |

</details>

<details>
<summary><code>decline_pull_request</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |

</details>

<details>
<summary><code>get_pr_diff</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |

Large diffs are truncated at 100KB.

</details>

<details>
<summary><code>get_pr_activity</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |
| max_pages | number | | Max pages to fetch (default: 3) |

</details>

<details>
<summary><code>list_repositories</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| query | string | | FIQL filter (e.g. `name~"my-repo"`) |
| max_pages | number | | Max pages to fetch (default: 3) |

</details>

<details>
<summary><code>get_current_user</code></summary>

No parameters.

</details>

<details>
<summary><code>get_file_content</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| path | string | Yes | File path within the repository |
| revision | string | | Branch name, tag, or commit hash (defaults to repo main branch) |

Large files are truncated at 100KB.

</details>

<details>
<summary><code>list_directory</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| path | string | | Directory path (defaults to repo root) |
| revision | string | | Branch name, tag, or commit hash (defaults to repo main branch) |
| max_depth | number | | Depth of directory tree (default: 1) |
| max_pages | number | | Max pages to fetch (default: 5) |

</details>

<details>
<summary><code>list_branches</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| query | string | | FIQL filter (e.g. `name~"feature"`) |
| sort | string | | Sort field (e.g. `-target.date` for newest first) |
| max_pages | number | | Max pages to fetch (default: 3) |

</details>

<details>
<summary><code>list_tags</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| query | string | | FIQL filter (e.g. `name~"v1"`) |
| sort | string | | Sort field (e.g. `-target.date` for newest first) |
| max_pages | number | | Max pages to fetch (default: 3) |

</details>

<details>
<summary><code>search_code</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| query | string | Yes | Search query string |
| max_pages | number | | Max pages to fetch (default: 3) |

</details>

<details>
<summary><code>list_commits</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| revision | string | | Branch, tag, or commit to start from (defaults to repo main branch) |
| path | string | | Filter to commits affecting this file path |
| include | string | | Commit hash or ref to include (for revision ranges) |
| exclude | string | | Commit hash or ref to exclude (for revision ranges) |
| max_pages | number | | Max pages to fetch (default: 3) |

</details>

<details>
<summary><code>get_diff</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| workspace | string | | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| spec | string | Yes | A single commit hash or a range like `commit1..commit2` |

Large diffs are truncated at 100KB.

</details>

<details>
<summary><code>bb_request</code></summary>

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| method | string | Yes | `GET`, `POST`, `PUT`, `PATCH`, or `DELETE` |
| path | string | Yes | API path relative to `/2.0` |
| body | object | | Request body (for POST/PUT/PATCH) |
| query_params | object | | Query parameters |

</details>

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Run directly from TypeScript (dev mode)
```

## License

[MIT](LICENSE)

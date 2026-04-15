# mcp-server-bitbucket

An MCP (Model Context Protocol) server for Bitbucket Cloud. Gives AI assistants like Claude the ability to interact with Bitbucket pull requests — create, search, review, comment, merge, and more.

**Version:** 1.0.0  
**License:** MIT  
**API:** Bitbucket Cloud REST API v2.0

## Available Tools

### Pull Request Management

| Tool | Description |
|------|-------------|
| `create_pull_request` | Create a new pull request from a source branch to a destination branch |
| `find_pull_request` | Search for pull requests by source/destination branch, state, or custom query |
| `get_pull_request` | Get full details of a single pull request by its ID |

### Code Review

| Tool | Description |
|------|-------------|
| `list_pr_comments` | List comments on a PR with optional filtering by author, resolution status, or type (inline vs general) |
| `add_pr_comment` | Add a comment to a PR — general, inline on a specific file/line, or reply to an existing thread |
| `approve_pull_request` | Approve a pull request (or remove your approval) |
| `request_changes` | Mark a pull request as "changes requested" |

### PR Actions

| Tool | Description |
|------|-------------|
| `merge_pull_request` | Merge a pull request (merge commit, squash, or fast-forward) |
| `decline_pull_request` | Decline (close without merging) a pull request |

### PR Insights

| Tool | Description |
|------|-------------|
| `get_pr_diff` | Get the full diff of a pull request as raw text |
| `get_pr_activity` | Get the activity timeline — updates, approvals, comments in chronological order |

### Discovery & Utility

| Tool | Description |
|------|-------------|
| `list_repositories` | List repositories in a workspace |
| `get_current_user` | Get info about the authenticated user (useful for verifying auth) |
| `bb_request` | Generic fallback — make any Bitbucket API call not covered above |

## Prerequisites

- **Node.js 18+** (required for native `fetch` support)
- **Bitbucket Access Token** with appropriate permissions (repository read/write, pull request read/write)

### Creating a Bitbucket Access Token

1. Go to your **Bitbucket repository** or **project** or **workspace** settings
2. Navigate to **Access tokens** (or **Security > Access tokens**)
3. Click **Create access token**
4. Give it a name and select the required permissions:
   - **Repositories: Read** (for listing repos, reading PRs)
   - **Repositories: Write** (for creating PRs)
   - **Pull requests: Read** (for reading PR details, comments, diffs)
   - **Pull requests: Write** (for creating comments, approving, merging)
5. Copy the generated token

See [Bitbucket Access Tokens documentation](https://support.atlassian.com/bitbucket-cloud/docs/access-tokens/) for more details.

## Installation

### From GitHub

```bash
git clone https://github.com/IdoSagiv/mcp-server-bitbucket.git
cd mcp-server-bitbucket
npm install
npm run build
```

### From npm (coming soon)

```bash
npx -y mcp-server-bitbucket
```

## Configuration

### Claude Code

Add to your Claude Code settings (`~/.claude/settings.json`):

**Using a local clone:**

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["/path/to/mcp-server-bitbucket/dist/index.js"],
      "env": {
        "BITBUCKET_TOKEN": "<your-access-token>",
        "BITBUCKET_DEFAULT_WORKSPACE": "<your-workspace-slug>"
      }
    }
  }
}
```

**Using npx (once published to npm):**

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "npx",
      "args": ["-y", "mcp-server-bitbucket"],
      "env": {
        "BITBUCKET_TOKEN": "<your-access-token>",
        "BITBUCKET_DEFAULT_WORKSPACE": "<your-workspace-slug>"
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop config (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["/path/to/mcp-server-bitbucket/dist/index.js"],
      "env": {
        "BITBUCKET_TOKEN": "<your-access-token>",
        "BITBUCKET_DEFAULT_WORKSPACE": "<your-workspace-slug>"
      }
    }
  }
}
```

Restart Claude Desktop after updating the configuration.

### Other MCP Clients

This server uses the standard MCP stdio transport, so it works with any MCP-compatible client (Cursor, Continue.dev, Cline, etc.). Configure it the same way — point the client at the built `dist/index.js` with the required environment variables.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BITBUCKET_TOKEN` | Yes | Bitbucket access token for authentication |
| `BITBUCKET_DEFAULT_WORKSPACE` | No | Default workspace slug. Used when `workspace` is not provided to a tool. |

## Usage Examples

### Create a pull request

> "Create a PR from branch `feature/login` to `main` in the `backend-api` repo"

### Code review with inline comments

> "Review PR #42 in `backend-api` — read the diff and add inline comments on any issues you find"

### Find a PR by branch

> "Find the open PR for branch `feature/login` in `backend-api`"

### Check PR status

> "Get the activity timeline for PR #42 in `backend-api` — who approved it, what comments are pending?"

### List unresolved comments

> "List all unresolved comments on PR #42 in `backend-api`"

## Tool Reference

### create_pull_request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug (falls back to `BITBUCKET_DEFAULT_WORKSPACE`) |
| repo_slug | string | Yes | Repository slug |
| title | string | Yes | PR title |
| source_branch | string | Yes | Source branch name |
| destination_branch | string | No | Destination branch (defaults to repo main branch) |
| description | string | No | PR description (Markdown) |
| reviewers | string[] | No | Reviewer UUIDs or account IDs |
| close_source_branch | boolean | No | Close source branch after merge (default: true) |

### find_pull_request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| source_branch | string | No | Filter by source branch |
| destination_branch | string | No | Filter by destination branch |
| state | string | No | Filter by state: OPEN, MERGED, DECLINED, SUPERSEDED |
| query | string | No | Raw FIQL query (overrides branch filters) |

### get_pull_request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |

### list_pr_comments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |
| author | string | No | Filter by author name (case-insensitive partial match) |
| resolved | boolean | No | Filter: true=resolved, false=unresolved |
| inline_only | boolean | No | Only inline (file-level) comments |
| general_only | boolean | No | Only general comments |
| max_pages | number | No | Max pages to fetch (default: 5) |

### add_pr_comment

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |
| content | string | Yes | Comment text (Markdown) |
| file_path | string | No | File path for inline comment |
| line | number | No | Line number for inline comment |
| parent_id | number | No | Parent comment ID for replies |

### merge_pull_request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |
| merge_strategy | string | No | merge_commit, squash, or fast_forward |
| close_source_branch | boolean | No | Close source branch after merge |
| message | string | No | Custom merge commit message |

### approve_pull_request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |
| action | string | No | "approve" (default) or "unapprove" |

### request_changes

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |

### decline_pull_request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |

### get_pr_diff

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |

### get_pr_activity

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| repo_slug | string | Yes | Repository slug |
| pr_id | number | Yes | Pull request ID |
| max_pages | number | No | Max pages to fetch (default: 3) |

### list_repositories

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspace | string | No | Workspace slug |
| query | string | No | FIQL filter (e.g. `name~"my-repo"`) |
| max_pages | number | No | Max pages to fetch (default: 3) |

### get_current_user

No parameters.

### bb_request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| method | string | Yes | HTTP method: GET, POST, PUT, PATCH, DELETE |
| path | string | Yes | API path relative to /2.0 |
| body | object | No | Request body (for POST/PUT/PATCH) |
| query_params | object | No | Query parameters |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in dev mode (TypeScript directly)
BITBUCKET_TOKEN=<token> npm run dev
```

## License

MIT

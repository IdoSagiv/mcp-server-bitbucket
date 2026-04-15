export interface BitbucketPaginated<T> {
  values: T[];
  next?: string;
  page: number;
  size: number;
  pagelen: number;
}

export interface BitbucketUser {
  display_name: string;
  uuid: string;
  nickname: string;
  account_id: string;
  links: {
    html?: { href: string };
    avatar?: { href: string };
  };
}

export interface BitbucketRepository {
  slug: string;
  name: string;
  full_name: string;
  description: string;
  is_private: boolean;
  owner: BitbucketUser;
  project?: {
    key: string;
    name: string;
  };
  mainbranch?: {
    name: string;
    type: string;
  };
  updated_on: string;
  created_on: string;
  links: {
    html?: { href: string };
    clone?: Array<{ href: string; name: string }>;
  };
}

export interface BitbucketBranch {
  name: string;
}

export interface BitbucketPullRequest {
  id: number;
  title: string;
  description: string;
  state: "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED";
  source: {
    branch: BitbucketBranch;
    repository: { full_name: string };
  };
  destination: {
    branch: BitbucketBranch;
    repository: { full_name: string };
  };
  author: BitbucketUser;
  reviewers: BitbucketUser[];
  participants: BitbucketParticipant[];
  close_source_branch: boolean;
  created_on: string;
  updated_on: string;
  merge_commit?: { hash: string };
  comment_count: number;
  task_count: number;
  links: {
    html?: { href: string };
    diff?: { href: string };
  };
}

export interface BitbucketParticipant {
  user: BitbucketUser;
  role: string;
  approved: boolean;
  state: string | null;
}

export interface BitbucketCommentInline {
  path: string;
  from?: number | null;
  to?: number | null;
}

export interface BitbucketComment {
  id: number;
  content: {
    raw: string;
    markup: string;
    html: string;
  };
  user: BitbucketUser;
  created_on: string;
  updated_on: string;
  inline?: BitbucketCommentInline;
  parent?: { id: number };
  deleted: boolean;
  pending: boolean;
  resolution?: {
    user: BitbucketUser;
    created_on: string;
  };
  links: {
    html?: { href: string };
  };
}

export interface BitbucketActivity {
  pull_request: { id: number; title: string };
  update?: {
    author: BitbucketUser;
    date: string;
    state: string;
    description: string;
  };
  approval?: {
    user: BitbucketUser;
    date: string;
  };
  comment?: BitbucketComment;
}

export interface BitbucketSourceEntry {
  path: string;
  type: "commit_file" | "commit_directory";
  size?: number;
  commit?: { hash: string };
  attributes?: string[];
  mimetype?: string | null;
}

export interface BitbucketRef {
  name: string;
  target: {
    hash: string;
    date: string;
    message?: string;
    author?: {
      raw: string;
      user?: BitbucketUser;
    };
  };
  type: string;
}

export interface BitbucketCommit {
  hash: string;
  message: string;
  date: string;
  author: {
    raw: string;
    user?: BitbucketUser;
  };
  parents?: Array<{ hash: string }>;
}

export interface BitbucketSearchResult {
  type: string;
  content_match_count: number;
  content_matches: Array<{
    lines: Array<{
      line: number;
      segments: Array<{
        text: string;
        match?: boolean;
      }>;
    }>;
  }>;
  file: {
    path: string;
    type: string;
  };
}

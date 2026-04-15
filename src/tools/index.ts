import type { BitbucketClient } from "../client.js";

import * as getCurrentUser from "./get-current-user.js";
import * as listRepositories from "./list-repositories.js";
import * as getPullRequest from "./get-pull-request.js";
import * as findPullRequest from "./find-pull-request.js";
import * as createPullRequest from "./create-pull-request.js";
import * as listPrComments from "./list-pr-comments.js";
import * as addPrComment from "./add-pr-comment.js";
import * as mergePullRequest from "./merge-pull-request.js";
import * as approvePullRequest from "./approve-pull-request.js";
import * as requestChanges from "./request-changes.js";
import * as resolvePrComment from "./resolve-pr-comment.js";
import * as declinePullRequest from "./decline-pull-request.js";
import * as getPrDiff from "./get-pr-diff.js";
import * as getPrActivity from "./get-pr-activity.js";
import * as bbRequest from "./bb-request.js";

const tools = [
  getCurrentUser,
  listRepositories,
  getPullRequest,
  findPullRequest,
  createPullRequest,
  listPrComments,
  addPrComment,
  resolvePrComment,
  mergePullRequest,
  approvePullRequest,
  requestChanges,
  declinePullRequest,
  getPrDiff,
  getPrActivity,
  bbRequest,
];

export const toolDefinitions = tools.map((t) => t.definition);

export const toolHandlers: Record<
  string,
  (client: BitbucketClient, args: unknown) => Promise<string>
> = Object.fromEntries(tools.map((t) => [t.definition.name, t.handler]));

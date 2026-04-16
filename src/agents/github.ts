import { z } from "zod/v4";
import { tool, createAgent } from "langchain";
import { llm } from "../llm.js";
import { RouterState } from "../state.js";
import { createChildLogger } from "../logger.js";

const log = createChildLogger("agent:github");

const searchCode = tool(
  async ({ query, repo }) => {
    log.debug({ query, repo }, "Searching code");
    const result = `Found code matching '${query}' in ${repo || "main"}: authentication middleware in src/auth.py`;
    log.debug({ result }, "Code search complete");
    return result;
  },
  {
    name: "search_code",
    description: "Search code in GitHub repositories.",
    schema: z.object({
      query: z.string(),
      repo: z.string().optional().default("main"),
    }),
  },
);

const searchIssues = tool(
  async ({ query }) => {
    log.debug({ query }, "Searching issues");
    const result = `Found 3 issues matching '${query}': #142 (API auth docs), #89 (OAuth flow), #203 (token refresh)`;
    log.debug({ result }, "Issue search complete");
    return result;
  },
  {
    name: "search_issues",
    description: "Search GitHub issues and pull requests.",
    schema: z.object({
      query: z.string(),
    }),
  },
);

const searchPrs = tool(
  async ({ query }) => {
    log.debug({ query }, "Searching pull requests");
    const result = `PR #156 added JWT authentication, PR #178 updated OAuth scopes`;
    log.debug({ result }, "PR search complete");
    return result;
  },
  {
    name: "search_prs",
    description: "Search pull requests for implementation details.",
    schema: z.object({
      query: z.string(),
    }),
  },
);

const githubAgent = createAgent({
  model: llm,
  tools: [searchCode, searchIssues, searchPrs],
  systemPrompt: `
You are a GitHub expert. Answer questions about code,
API references, and implementation details by searching
repositories, issues, and pull requests.
  `.trim(),
});

export async function queryGithub(state: typeof RouterState.State) {
  log.info({ query: state.query }, "GitHub agent invoked");
  const start = performance.now();

  const result = await githubAgent.invoke({
    messages: [{ role: "user", content: state.query }],
  });

  const content = result.messages.at(-1)?.content;
  const durationMs = Math.round(performance.now() - start);
  log.info({ durationMs }, "GitHub agent completed");
  log.debug({ response: content }, "GitHub agent response");

  return { results: [{ source: "github", result: content }] };
}

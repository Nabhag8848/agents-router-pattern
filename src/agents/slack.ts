import { z } from "zod/v4";
import { tool, createAgent } from "langchain";
import { llm } from "../llm.js";
import { RouterState } from "../state.js";
import { createChildLogger } from "../logger.js";

const log = createChildLogger("agent:slack");

const searchSlack = tool(
  async ({ query }) => {
    log.debug({ query }, "Searching Slack messages");
    const result = `Found discussion in #engineering: 'Use Bearer tokens for API auth, see docs for refresh flow'`;
    log.debug({ result }, "Slack search complete");
    return result;
  },
  {
    name: "search_slack",
    description: "Search Slack messages and threads.",
    schema: z.object({
      query: z.string(),
    }),
  },
);

const getThread = tool(
  async ({ threadId }) => {
    log.debug({ threadId }, "Fetching Slack thread");
    const result = `Thread discusses best practices for API key rotation`;
    log.debug({ result }, "Slack thread fetched");
    return result;
  },
  {
    name: "get_thread",
    description: "Get a specific Slack thread.",
    schema: z.object({
      threadId: z.string(),
    }),
  },
);

const slackAgent = createAgent({
  model: llm,
  tools: [searchSlack, getThread],
  systemPrompt: `
You are a Slack expert. Answer questions by searching
relevant threads and discussions where team members have
shared knowledge and solutions.
  `.trim(),
});

export async function querySlack(state: typeof RouterState.State) {
  log.info({ query: state.query }, "Slack agent invoked");
  const start = performance.now();

  const result = await slackAgent.invoke({
    messages: [{ role: "user", content: state.query }],
  });

  const content = result.messages.at(-1)?.content;
  const durationMs = Math.round(performance.now() - start);
  log.info({ durationMs }, "Slack agent completed");
  log.debug({ response: content }, "Slack agent response");

  return { results: [{ source: "slack", result: content }] };
}

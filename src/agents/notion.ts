import { z } from "zod/v4";
import { tool, createAgent } from "langchain";
import { llm } from "../llm.js";
import { RouterState } from "../state.js";
import { createChildLogger } from "../logger.js";

const log = createChildLogger("agent:notion");

const searchNotion = tool(
  async ({ query }) => {
    log.debug({ query }, "Searching Notion workspace");
    const result = `Found documentation: 'API Authentication Guide' - covers OAuth2 flow, API keys, and JWT tokens`;
    log.debug({ result }, "Notion search complete");
    return result;
  },
  {
    name: "search_notion",
    description: "Search Notion workspace for documentation.",
    schema: z.object({
      query: z.string(),
    }),
  },
);

const getPage = tool(
  async ({ pageId }) => {
    log.debug({ pageId }, "Fetching Notion page");
    const result = `Page content: Step-by-step authentication setup instructions`;
    log.debug({ result }, "Notion page fetched");
    return result;
  },
  {
    name: "get_page",
    description: "Get a specific Notion page by ID.",
    schema: z.object({
      pageId: z.string(),
    }),
  },
);

const notionAgent = createAgent({
  model: llm,
  tools: [searchNotion, getPage],
  systemPrompt: `
You are a Notion expert. Answer questions about internal
processes, policies, and team documentation by searching
the organization's Notion workspace.
  `.trim(),
});

export async function queryNotion(state: typeof RouterState.State) {
  log.info({ query: state.query }, "Notion agent invoked");
  const start = performance.now();

  const result = await notionAgent.invoke({
    messages: [{ role: "user", content: state.query }],
  });

  const content = result.messages.at(-1)?.content;
  const durationMs = Math.round(performance.now() - start);
  log.info({ durationMs }, "Notion agent completed");
  log.debug({ response: content }, "Notion agent response");

  return { results: [{ source: "notion", result: content }] };
}

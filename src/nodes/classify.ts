import { z } from "zod/v4";
import { Send } from "@langchain/langgraph";
import { routerLlm } from "../llm.js";
import { RouterState } from "../state.js";
import { createChildLogger } from "../logger.js";

const log = createChildLogger("node:classify");

const ClassificationResultSchema = z.object({
  classifications: z
    .array(
      z.object({
        source: z.enum(["github", "notion", "slack"]),
        query: z.string(),
      }),
    )
    .describe("List of agents to invoke with their targeted sub-questions"),
});

export async function classifyQuery(state: typeof RouterState.State) {
  log.info({ query: state.query }, "Classifying query");
  const start = performance.now();

  const structuredLlm = routerLlm.withStructuredOutput(
    ClassificationResultSchema,
  );

  const result = await structuredLlm.invoke([
    {
      role: "system",
      content: `Analyze this query and determine which knowledge bases to consult.
For each relevant source, generate a targeted sub-question optimized for that source.

Available sources:
- github: Code, API references, implementation details, issues, pull requests
- notion: Internal documentation, processes, policies, team wikis
- slack: Team discussions, informal knowledge sharing, recent conversations

Return ONLY the sources that are relevant to the query. Each source should have
a targeted sub-question optimized for that specific knowledge domain.

Example for "How do I authenticate API requests?":
- github: "What authentication code exists? Search for auth middleware, JWT handling"
- notion: "What authentication documentation exists? Look for API auth guides"
(slack omitted because it's not relevant for this technical question)`,
    },
    { role: "user", content: state.query },
  ]);

  const durationMs = Math.round(performance.now() - start);
  const sources = result.classifications.map((c) => c.source);
  log.info({ sources, durationMs }, "Classification complete");

  for (const c of result.classifications) {
    log.debug({ source: c.source, subQuery: c.query }, "Routed sub-query");
  }

  return { classifications: result.classifications };
}

export function routeToAgents(state: typeof RouterState.State): Send[] {
  const targets = state.classifications.map((c) => c.source);
  log.info({ targets }, "Routing to agents");
  return state.classifications.map(
    (c) => new Send(c.source, { query: c.query }),
  );
}

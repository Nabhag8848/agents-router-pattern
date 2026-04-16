import { routerLlm } from "../llm.js";
import { RouterState } from "../state.js";
import { createChildLogger } from "../logger.js";

const log = createChildLogger("node:synthesize");

export async function synthesizeResults(state: typeof RouterState.State) {
  const sourceCount = state.results.length;
  const sources = state.results.map((r) => r.source);
  log.info({ sources, sourceCount }, "Synthesizing results");

  if (state.results.length === 0) {
    log.warn("No results to synthesize");
    return { finalAnswer: "No results found from any knowledge source." };
  }

  const start = performance.now();

  const formatted = state.results.map(
    (r) =>
      `**From ${r.source.charAt(0).toUpperCase() + r.source.slice(1)}:**\n${r.result}`,
  );

  const synthesisResponse = await routerLlm.invoke([
    {
      role: "system",
      content: `Synthesize these search results to answer the original question: "${state.query}"

- Combine information from multiple sources without redundancy
- Highlight the most relevant and actionable information
- Note any discrepancies between sources
- Keep the response concise and well-organized`,
    },
    { role: "user", content: formatted.join("\n\n") },
  ]);

  const durationMs = Math.round(performance.now() - start);
  log.info({ durationMs }, "Synthesis complete");

  return { finalAnswer: synthesisResponse.content };
}

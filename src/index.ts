import { logger } from "./logger.js";
import { graph } from "./graph.js";

const query = "How do I authenticate API requests?";

logger.info("=== Multi-Source Knowledge Router ===");
logger.info({ query }, "Starting workflow");
const start = performance.now();

const result = await graph.invoke({ query });

const totalMs = Math.round(performance.now() - start);
logger.info({ totalMs }, "Workflow complete");

logger.info("--- Classifications ---");
for (const c of result.classifications) {
  logger.info({ source: c.source, subQuery: c.query }, "Routed");
}

logger.info({ finalAnswer: result.finalAnswer }, "--- Final Answer ---");

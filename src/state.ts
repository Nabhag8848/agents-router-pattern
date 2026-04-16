import { z } from "zod/v4";
import { StateSchema, ReducedValue } from "@langchain/langgraph";

export const AgentOutput = z.object({
  source: z.string(),
  result: z.string(),
});

export const RouterState = new StateSchema({
  query: z.string(),
  classifications: z.array(
    z.object({
      source: z.enum(["github", "notion", "slack"]),
      query: z.string(),
    }),
  ),
  results: new ReducedValue(
    z.array(AgentOutput).default(() => []),
    { reducer: (current, update) => current.concat(update) },
  ),
  finalAnswer: z.string(),
});

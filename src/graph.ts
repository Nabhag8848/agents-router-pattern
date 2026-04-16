import { StateGraph, START, END } from "@langchain/langgraph";
import { RouterState } from "./state.js";
import { classifyQuery, routeToAgents } from "./nodes/classify.js";
import { synthesizeResults } from "./nodes/synthesize.js";
import { queryGithub } from "./agents/github.js";
import { queryNotion } from "./agents/notion.js";
import { querySlack } from "./agents/slack.js";

export const graph = new StateGraph(RouterState)
  .addNode("classify", classifyQuery)
  .addNode("github", queryGithub)
  .addNode("notion", queryNotion)
  .addNode("slack", querySlack)
  .addNode("synthesize", synthesizeResults)
  .addEdge(START, "classify")
  .addConditionalEdges("classify", routeToAgents, ["github", "notion", "slack"])
  .addEdge("github", "synthesize")
  .addEdge("notion", "synthesize")
  .addEdge("slack", "synthesize")
  .addEdge("synthesize", END)
  .compile();

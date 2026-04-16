import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { createChildLogger } from "./logger.js";

const log = createChildLogger("llm");

log.info({ model: "gpt-4.1" }, "Initializing agent LLM");
export const llm = new ChatOpenAI({
  model: "gpt-4.1",
  apiKey: process.env.OPENAI_API_KEY,
});

log.info({ model: "gpt-4.1-mini" }, "Initializing router LLM");
export const routerLlm = new ChatOpenAI({
  model: "gpt-4.1-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

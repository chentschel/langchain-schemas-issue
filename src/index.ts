import "dotenv/config";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";

import { createOpenAIToolsAgent, AgentExecutor } from "langchain/agents";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const zodSchema = z
  .object({
    chain: z
      .enum(["eth", "polygon"])
      .describe("The chain to query")
      .default("eth"),
    address: z
      .string()
      .describe("The address from which token balances will be checked"),
    to_block: z
      .number()
      .describe("The block number up to which the balances will be checked.")
      .optional(),
    token_addresses: z
      .array(z.string())
      .max(10)
      .describe("The addresses to get balances for (optional)")
      .optional(),
    exclude_spam: z
      .boolean()
      .describe("Exclude spam tokens from the result")
      .optional(),
  })
  .strict();

const llm = new ChatOpenAI({
  model: "gpt-4o",
});

const tools = [
  new DynamicStructuredTool({
    name: "getWalletTokenBalances",
    description: "Get token balances for a specific wallet address.",
    schema: zodSchema,
    func: async (params: z.infer<typeof zodSchema>) => {
      console.log("Called with params:", params);

      return "TOKENS HOLDED: USDC, WETH";
    },
  }),
];

const mainLangChain = async () => {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    ["placeholder", "{agent_scratchpad}"],
    ["user", "{input}"],
  ]);

  const agent = await createOpenAIToolsAgent({
    llm,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });

  const result = await agentExecutor.invoke({
    input: "which tokens does 0xDFcEB49eD21aE199b33A76B726E2bea7A72127B0 hold?",
  });

  console.log("LANGCHAIN AGENT RESULT: \n", result);
};

const mainLangGraph = async () => {
  const agent = createReactAgent({ llm, tools });
  const { messages } = await agent.invoke({
    messages: [
      [
        "user",
        "which tokens does 0xDFcEB49eD21aE199b33A76B726E2bea7A72127B0 hold?",
      ],
    ],
  });

  console.log(
    "LAGGRAPH AGENT RESULT: \n",
    messages[messages.length - 1].content
  );
};

mainLangChain()
  .then(() => mainLangGraph())
  .then(() => {
    console.log("LOCAL SCHEMA GENERATED: \n", zodToJsonSchema(zodSchema));
  });

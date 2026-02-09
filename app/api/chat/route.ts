import { Annotation, StateGraph, messagesStateReducer, START, END } from '@langchain/langgraph';
import { createAgent } from 'langchain';
import { createSupervisor } from '@langchain/langgraph-supervisor';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse, UIMessage } from 'ai';

export const maxDuration = 30;

// ----- Supervisor state: messages + wallet (createSupervisor uses this; input_processor sets wallet) -----

const SupervisorStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  wallet: Annotation<string>(),
});

type SupervisorState = typeof SupervisorStateAnnotation.State;

// ----- LLM for supervisor and agents -----

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  apiKey: process.env.GEMINI_API_KEY,
});

// ----- 1. Input Processor: Session Management & Wallet Extraction -----

async function inputProcessor(state: SupervisorState): Promise<Partial<SupervisorState>> {
  const messages = state.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m._getType() === 'human');
  const text = typeof lastUser?.content === 'string' ? lastUser.content : '';
  const walletMatch = text.match(/0x[a-fA-F0-9]{40}/);
  return {
    wallet: walletMatch?.[0] ?? state.wallet ?? '',
  };
}

// ----- 3. Wallet helpers (for portfolio & exec) -----

const BASE_WALLET_REQUIRED_MESSAGE =
  '**Portfolio** requires a connected Base wallet.\n\n' +
  'Connect your Base (or Base Sepolia) wallet to view balances and get yield suggestions. ' +
  'You can paste your address here (e.g. `0x...`) or connect via a supported wallet connection.';

const EXEC_WALLET_REQUIRED_MESSAGE =
  '**Execute** (swaps, trades) requires a connected Base wallet.\n\n' +
  'Connect your Base (or Base Sepolia) wallet to run swaps and on-chain actions. ' +
  'You can paste your address here (e.g. `0x...`) or connect via a supported wallet.';

function isBaseWalletConnected(wallet: string | undefined): boolean {
  if (!wallet?.trim()) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(wallet.trim());
}

// ----- 4. Specialized agents via createAgent from langchain (one per use case) -----

const portfolioAgentBase = createAgent({
  model,
  tools: [],
  systemPrompt:
    'You are the Portfolio Agent. You help with balances, yield suggestions, and portfolio overview on Base. The user has connected their wallet. Reply concisely.',
  name: 'portfolio',
  description: 'Balances, holdings, yield, portfolio overview',
});

const researchAgentBase = createAgent({
  model,
  tools: [],
  systemPrompt:
    'You are the Research Agent. You help with sentiment, project mining, and alpha. Reply concisely.',
  name: 'research',
  description: 'Sentiment, project deep-dives, alpha, research',
});

const trenchAgentBase = createAgent({
  model,
  tools: [],
  systemPrompt:
    'You are the Trench Agent. You help with whale tracking and smart money flows. Reply concisely.',
  name: 'trench',
  description: 'Whales, smart money, large flows',
});

const taAgentBase = createAgent({
  model,
  tools: [],
  systemPrompt:
    'You are the TA Analyst. You help with TradingView-style indicators and charts. Reply concisely.',
  name: 'ta',
  description: 'Charts, TradingView, technical analysis, indicators',
});

const execAgentBase = createAgent({
  model,
  tools: [],
  systemPrompt:
    'You are the Execution Agent. You help with Base on-chain swaps and execution. The user has connected their wallet. Reply concisely. Do not execute real trades without explicit confirmation.',
  name: 'exec',
  description: 'Swap, trade, execute on-chain',
});

// ----- 5. Wrap agents for supervisor: map SupervisorState -> invoke -> "Hey Anon" reply; optional wallet gate -----

function getLastMessageContent(messages: BaseMessage[]): string {
  const last = [...messages].reverse().find((m) => m._getType() === 'ai');
  if (!last) return "I couldn't generate a response for that.";
  const content = typeof last.content === 'string' ? last.content : '';
  return content.trim() || "I couldn't generate a response for that.";
}

interface AgentLike {
  invoke(state: { messages: BaseMessage[] }): Promise<{ messages: BaseMessage[] }>;
}

function wrapAgentForSupervisor(
  agent: AgentLike,
  name: string,
  options?: { requireWallet?: boolean; walletRequiredMessage?: string }
) {
  async function run(state: SupervisorState): Promise<Partial<SupervisorState>> {
    if (options?.requireWallet && !isBaseWalletConnected(state.wallet)) {
      const reply = `Hey Anon 👋\n\n${options.walletRequiredMessage ?? 'A wallet is required.'}`;
      return { messages: [...(state.messages ?? []), new AIMessage(reply)] };
    }
    const out = await agent.invoke({ messages: state.messages ?? [] });
    const content = getLastMessageContent(out.messages ?? []);
    const reply = `Hey Anon 👋\n\n${content}`;
    return { messages: [...(state.messages ?? []), new AIMessage(reply)] };
  }
  return new StateGraph(SupervisorStateAnnotation)
    .addNode('run', run)
    .addEdge(START, 'run')
    .addEdge('run', END)
    .compile({ name });
}

const portfolioAgent = wrapAgentForSupervisor(portfolioAgentBase, 'portfolio', {
  requireWallet: true,
  walletRequiredMessage: BASE_WALLET_REQUIRED_MESSAGE,
});
const researchAgent = wrapAgentForSupervisor(researchAgentBase, 'research');
const trenchAgent = wrapAgentForSupervisor(trenchAgentBase, 'trench');
const taAgent = wrapAgentForSupervisor(taAgentBase, 'ta');
const execAgent = wrapAgentForSupervisor(execAgentBase, 'exec', {
  requireWallet: true,
  walletRequiredMessage: EXEC_WALLET_REQUIRED_MESSAGE,
});

const SUPERVISOR_PROMPT = `You are the orchestrator for a DeFi chat assistant. Route the user to the right specialist:
- **portfolio**: balances, holdings, yield, portfolio overview (use when user asks about their portfolio or holdings).
- **research**: sentiment, project deep-dives, alpha, research (use for research and sentiment questions).
- **trench**: whales, smart money, large flows (use for whale tracking and smart money).
- **ta**: charts, TradingView, technical analysis, indicators (use for TA and charts).
- **exec**: swap, trade, execute on-chain (use for execution and swaps).
Pick exactly one specialist per turn. If unclear, prefer research.`;

// ----- 6. Build supervisor graph with createSupervisor, then wrap with input_processor -----

function createAgentGraph() {
  const supervisorGraph = createSupervisor({
    agents: [portfolioAgent, researchAgent, trenchAgent, taAgent, execAgent],
    llm: model,
    prompt: SUPERVISOR_PROMPT,
    stateSchema: SupervisorStateAnnotation,
    outputMode: 'last_message',
    supervisorName: 'supervisor',
  });

  const compiledSupervisor = supervisorGraph.compile();

  const graph = new StateGraph(SupervisorStateAnnotation)
    .addNode('input_processor', inputProcessor)
    .addNode('supervisor', (state, config) => compiledSupervisor.invoke(state, config))
    .addEdge(START, 'input_processor')
    .addEdge('input_processor', 'supervisor')
    .addEdge('supervisor', END);

  return graph.compile();
}

// ----- Stream filter: drop supervisor one-word intent so UI never shows "portfolio" etc. -----

const INTENT_WORDS = /^(portfolio|research|trench|ta|exec)$/i;

function getMessageContent(rawMsg: unknown): string {
  if (rawMsg == null || typeof rawMsg !== 'object') return '';
  const obj = rawMsg as Record<string, unknown>;
  if (typeof obj.content === 'string') return obj.content;
  const kwargs = obj.kwargs as Record<string, unknown> | undefined;
  if (kwargs != null && typeof kwargs.content === 'string') return kwargs.content;
  return '';
}

async function* filterSupervisorIntent(
  stream: AsyncIterable<unknown>
): AsyncGenerator<unknown> {
  for await (const event of stream) {
    if (!Array.isArray(event) || event.length < 2) {
      yield event;
      continue;
    }
    // LangGraph yields [mode, payload] or [path, mode, payload]
    const type = (event.length === 3 ? event[1] : event[0]) as string;
    const data = event.length === 3 ? event[2] : event[1];
    if (type === 'messages' && Array.isArray(data)) {
      const [rawMsg] = data;
      const content = getMessageContent(rawMsg).trim();
      if (INTENT_WORDS.test(content)) continue; // skip supervisor one-word reply
    }
    yield event;
  }
}

// ----- Route handler: stream response, always show reply (filter supervisor intent) -----

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const graph = createAgentGraph();
  const langchainMessages = await toBaseMessages(messages);

  const rawStream = await graph.stream(
    { messages: langchainMessages },
    { streamMode: ['values', 'messages'] },
  );

  // Filter out supervisor's single-word intent so the UI streams the real reply only.
  const filteredStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of filterSupervisorIntent(rawStream)) {
          controller.enqueue(chunk);
        }
      } catch (err) {
        const errorText = err instanceof Error ? err.message : 'Something went wrong.';
        const fallbackReply = `Hey Anon 👋\n\nSorry, I ran into an issue: ${errorText}\n\nTry again or rephrase your question.`;
        const fallbackState: SupervisorState = {
          messages: [new AIMessage(fallbackReply)],
          wallet: '',
        };
        controller.enqueue(['values', fallbackState]);
      } finally {
        controller.close();
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(filteredStream),
  });
}

import { CHAT_POLICIES } from '../policies/chatPolicies.js';
import publicPrompt from '../prompts/publicPrompt.js';
import forecasterPrompt from '../prompts/forecasterPrompt.js';
import adminPrompt from '../prompts/adminPrompt.js';
import { retrieveContext } from './retrievalService.js';
const PROMPTS = { public: publicPrompt, forecaster: forecasterPrompt, admin: adminPrompt };
export const resolveChatTier = (user) => !user ? 'public' : user.role === 'admin' ? 'admin' : user.role === 'forecaster' ? 'forecaster' : null;
export const buildChatRequest = async ({ user, model, messages }) => {
  const tier = resolveChatTier(user);
  if (!tier) throw new Error('Unauthorized chat tier');
  const policy = CHAT_POLICIES[tier];
  const retrieval = await retrieveContext(messages[messages.length - 1]?.content || '', policy);
  const sourceLabel = retrieval.sources?.length ? ` Sources: ${retrieval.sources.join(', ')}.` : '';
  const systemPrompt = `${PROMPTS[tier]} ${retrieval.context}${sourceLabel}`.trim();
  return { tier, policy, systemPrompt, model, messages, sources: retrieval.sources || [] };
};

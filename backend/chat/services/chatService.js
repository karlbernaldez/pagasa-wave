import { CHAT_POLICIES } from '../policies/chatPolicies.js';
import publicPrompt from '../prompts/publicPrompt.js';
import forecasterPrompt from '../prompts/forecasterPrompt.js';
import adminPrompt from '../prompts/adminPrompt.js';
import { retrieveContext } from './retrievalService.js';

const PROMPTS = {
  public: publicPrompt,
  forecaster: forecasterPrompt,
  admin: adminPrompt,
};

const GROUNDING_RULES = {
  public: `
Rules:
- Answer only from retrieved WaveLab knowledge when relevant.
- Do not invent WaveLab policies, procedures, permissions, or operational rules.
- If documentation does not contain enough information, explicitly say the information is unavailable in the current knowledge base.
- No corporate filler, disclaimers, or repetitive phrasing.
- Keep answers concise, clear, and structured with bullets when useful.
`,
  forecaster: `
Rules:
- Respond as an operational forecaster assistant.
- Use only retrieved WaveLab knowledge and clearly separate documented facts from general reasoning.
- Do not invent internal procedures, thresholds, workflows, or approvals.
- If context is insufficient, explicitly state that the current documentation does not contain enough information.
- Be concise, technical, and non-repetitive.
`,
  admin: `
Rules:
- Respond as an administrative operations assistant.
- Use retrieved documentation as source of truth for WaveLab-specific behavior.
- Never fabricate governance, approval rules, access controls, or internal policy.
- If evidence is missing, say so directly.
- Prefer structured operational answers over narrative filler.
`,
};

export const resolveChatTier = (user) => !user
  ? 'public'
  : user.role === 'admin'
    ? 'admin'
    : user.role === 'forecaster'
      ? 'forecaster'
      : null;

export const buildChatRequest = async ({ user, model, messages }) => {
  const tier = resolveChatTier(user);
  if (!tier) throw new Error('Unauthorized chat tier');

  const policy = {
    ...CHAT_POLICIES[tier],
    tier,
  };

  const latestQuery = messages[messages.length - 1]?.content || '';
  const retrieval = await retrieveContext(latestQuery, policy);

  const sourceSection = retrieval.sources?.length
    ? `\nDocument sources:\n${retrieval.sources.map((s) => `- ${s}`).join('\n')}`
    : '\nDocument sources: none';

  const contextSection = retrieval.hasContext
    ? `\nRetrieved documentation context:\n${retrieval.context}`
    : '\nRetrieved documentation context:\nNo sufficiently relevant documentation was found for this query.';

  const systemPrompt = [
    PROMPTS[tier],
    GROUNDING_RULES[tier],
    contextSection,
    sourceSection,
    '\nWhen citing documentation, mention the source names naturally in the answer.',
  ].join('\n').trim();

  return {
    tier,
    policy,
    systemPrompt,
    model,
    messages,
    sources: retrieval.sources || [],
  };
};

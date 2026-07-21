export const isChatbotEnabled = (env = process.env) =>
  env.WAVELAB_CHAT_ENABLED === 'true';

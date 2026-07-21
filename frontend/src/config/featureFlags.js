export const isChatbotEnabled = (
  value = import.meta.env.VITE_WAVELAB_CHAT_ENABLED,
) => value === 'true';

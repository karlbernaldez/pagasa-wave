import { logger } from '#utils/logger';
export const logChatEvent = ({ tier, userId, model, ip, status }) => {
  logger.info('chat_event', { tier, userId, model, ip, status, timestamp: new Date().toISOString() });
};

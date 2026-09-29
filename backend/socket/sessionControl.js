const userRoom = (userId) => `user:${String(userId)}`;

export const disconnectUserSockets = (userId) => {
  const io = globalThis.__socketIo ?? null;
  if (!io || !userId) return false;

  io.in(userRoom(userId)).disconnectSockets(true);
  return true;
};

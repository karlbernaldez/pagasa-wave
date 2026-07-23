import authenticate from './authMiddleware.js';

// Backward-compatible alias while routes migrate to the canonical middleware.
export const authenticateToken = authenticate;

export default authenticate;

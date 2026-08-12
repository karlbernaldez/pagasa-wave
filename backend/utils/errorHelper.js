// utils/errorHelper.js

/**
 * Throw a custom error
 * @param {string} message - Error message
 * @param {number} [status=400] - HTTP status code
 */
export const throwError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  err.statusCode = status;

  // Optional: log in dev
  if (process.env.NODE_ENV === 'development') {
    console.error('ThrowError:', err.message);
  }

  throw err;
};

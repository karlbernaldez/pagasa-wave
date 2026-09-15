const defaultExit = (code) => process.exit(code);

export const createShutdownHandler = ({
  httpServer,
  socketServer,
  logger,
  exit = defaultExit,
  timeoutMs = 10_000,
  scheduleTimeout = setTimeout,
  cancelTimeout = clearTimeout,
}) => {
  let shuttingDown = false;

  return (signal) => {
    if (shuttingDown) {
      return false;
    }

    shuttingDown = true;

    logger.info('WaveLab API shutdown requested', {
      signal,
    });

    let finished = false;
    let forceShutdownTimer;

    const finish = ({ error = null, timedOut = false } = {}) => {
      if (finished) {
        return;
      }

      finished = true;

      if (forceShutdownTimer) {
        cancelTimeout(forceShutdownTimer);
      }

      if (timedOut) {
        logger.error('WaveLab API shutdown timed out');
        exit(1);
        return;
      }

      if (error) {
        logger.error('WaveLab API shutdown failed', {
          message: error.message,
          stack: error.stack,
        });
        exit(1);
        return;
      }

      logger.info('WaveLab API stopped');
      exit(0);
    };

    forceShutdownTimer = scheduleTimeout(() => finish({ timedOut: true }), timeoutMs);
    forceShutdownTimer.unref?.();

    try {
      // Upgraded WebSocket connections are not completed by httpServer.close().
      // Disconnect them first so the HTTP close callback can finish promptly.
      socketServer.disconnectSockets(true);
      httpServer.close((error) => finish({ error }));
    } catch (error) {
      finish({ error });
    }

    return true;
  };
};

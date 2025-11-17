import pino from 'pino';

let logger: pino.Logger | null = null;

const isBrowser = typeof window !== 'undefined';
const isDevelopment = process.env.NODE_ENV !== 'production';
// Allow explicit control of pretty transport via environment variable
// Set to 'false' to disable pretty transport and avoid worker thread path issues
const usePrettyTransport =
  process.env.USE_PRETTY_LOG !== 'false' && isDevelopment;

const getTransport = () => {
  if (isBrowser) {
    return undefined;
  }

  // Use pino-pretty only in development environment when not disabled
  // In production, pino outputs JSON format by default, which is better for log collection systems
  // If encountering worker thread path issues (e.g., pnpm monorepo), disable by setting USE_PRETTY_LOG=false
  if (usePrettyTransport) {
    return pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'req,res',
        messageFormat: '{if req.id}{req.id} - {end}{msg}',
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        singleLine: false,
      },
    });
  }

  // Without transport, pino will use standard output (JSON format)
  return undefined;
};

export const createLogger = (logLevel: string) => {
  if (logger) {
    return logger;
  }

  const transport = getTransport();

  // Listen for worker thread errors, fallback to standard output if error occurs
  if (transport) {
    // If transport is a stream, listen to its error event
    if (typeof transport === 'object' && 'on' in transport) {
      transport.on('error', (error: Error) => {
        console.warn(
          '[pino-log] Transport error detected, worker thread may have failed. Error:',
          error.message,
        );
        console.warn(
          '[pino-log] To disable pretty transport, set USE_PRETTY_LOG=false',
        );
      });
    }
  }

  logger = pino(
    {
      level: logLevel,
    },
    transport,
  );

  return logger;
};

export const getLogger = () => {
  if (!logger) {
    // Fallback to creating logger with default 'info' level if not initialized
    // throw new Error('Logger not initialized');
    return createLogger('info');
  }
  return logger;
};

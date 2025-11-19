export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { createLogger } = await import('@repo/pino-log');
    createLogger('info');
  }
}

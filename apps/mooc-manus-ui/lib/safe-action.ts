import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSafeActionClient } from 'next-safe-action';
import { ZodError, z } from 'zod';
import { auth } from './auth';
import { BaseException } from './exception';
import { log } from './logger';

export const actionClient = createSafeActionClient({
  defineMetadataSchema: () => {
    return z.object({
      actionName: z.string(),
    });
  },
  handleServerError: (error, utils) => {
    const { clientInput, metadata } = utils;
    log.error('clientInput: %o', clientInput as object);
    log.error('metadata: %o', metadata);
    log.error('Error: %o', error);
    if (error instanceof ZodError) {
      const errorMessage = error.issues
        .map((item) => {
          if (item.path.length === 0) {
            return item.message;
          }
          const path = item.path.join('.');
          return `${path}: ${item.message}`;
        })
        .join('; ');

      log.error('Request parameter error: %o', error);
      return errorMessage;
    }

    if (error instanceof BaseException) {
      log.error('Business exception: %o', error);
      return error.message;
    }

    log.error('Unknown error: %o', error);
    console.error(error);
    return 'Unknown error';
  },
}).use(async ({ next, clientInput, metadata }) => {
  const startTime = performance.now();
  const result = await next();
  const endTime = performance.now();
  log.debug('Result -> %o', result);
  log.debug('Client input -> %o', clientInput as object);
  log.debug('Metadata -> %o', metadata);
  log.debug('Action execution took: %dms', endTime - startTime);
  return result;
});

export const authActionClient = actionClient.use(async ({ next }) => {
  // const cookieStore = await cookies();
  // const sessionToken =
  //   cookieStore.get('better-auth.session_token')?.value ?? '';

  // const token = sessionToken.split('.')[0];

  // const sessionRecord = await db
  //   .select()
  //   .from(session)
  //   .where(eq(session.token, token));

  // log.debug('sessionRecord: %o', sessionRecord);
  // if (!sessionRecord || sessionRecord.length === 0) {
  //   log.error('Unauthorized: %s', sessionToken);
  //   redirect('/login');
  // }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    log.error('Unauthorized');
    redirect('/login');
  }

  return next({ ctx: { userId: session.user.id } });
});

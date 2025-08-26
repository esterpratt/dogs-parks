import { cleanupDeviceTokensBeforeLogout } from '../services/notifications';
import { signOut } from '../services/authentication';
import { throwError } from './error';

interface LogoutOptions {
  clearQueries?: () => void;
  after?: () => void;
}

async function logoutWithCleanup(options?: LogoutOptions) {
  try {
    await cleanupDeviceTokensBeforeLogout();
    await signOut();

    if (options?.clearQueries) {
      options.clearQueries();
    }

    if (options?.after) {
      options.after();
    }
  } catch (err) {
    try {
      await signOut();
    } catch {
      console.error('Error logging out');
    }
    throwError(err);
  }
}

export { logoutWithCleanup };

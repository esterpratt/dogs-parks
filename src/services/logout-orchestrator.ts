import { cleanupDeviceTokensBeforeLogout } from '../services/notifications';
import { signOut } from '../services/authentication';
import { SignOutResult } from '../types/auth';

interface LogoutOptions {
  clearQueries?: () => void;
  after?: () => void;
}

async function logoutWithCleanup(
  options?: LogoutOptions
): Promise<SignOutResult> {
  try {
    await cleanupDeviceTokensBeforeLogout();
    const result = await signOut();

    if (options?.clearQueries) {
      options.clearQueries();
    }

    if (options?.after) {
      options.after();
    }

    return result;
  } catch (err) {
    console.error('Error logging out: ', err);

    const result = await signOut();

    return result;
  }
}

export { logoutWithCleanup };

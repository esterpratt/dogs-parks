import { AuthError } from '@supabase/supabase-js';
import { i18n } from '../i18n';
import { mapSupabaseAuthErrorToKey } from './supabase-auth-error-mapper';
import type { StorageError } from '@supabase/storage-js';

type LocalStorageError = StorageError & {
  statusCode: string;
};

class AppError {
  message: string;
  status: number;

  constructor(error: string, status: number) {
    this.message = error;
    this.status = status;
  }
}

const throwError = (error: unknown, status?: number) => {
  console.error('there was an error: ', JSON.stringify(error));

  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof AuthError) {
    const { key } = mapSupabaseAuthErrorToKey(error);
    const statusFromError = (error as unknown as { status?: number }).status;
    const translated = i18n.t(key);
    throw new AppError(translated, statusFromError || 400);
  }

  if ((error as LocalStorageError).statusCode === '413') {
    throw new AppError('Upload failed: The image is too large', 413);
  }

  throw {
    status: status || 500,
    message: 'Oh oh! It seems my dog ate the code. Please try again later.',
  };
};

export { throwError, AppError };

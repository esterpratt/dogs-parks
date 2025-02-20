import { FirebaseError } from 'firebase/app';
import { errorEvent } from './events';

class AppError {
  message: string;
  status: number;

  constructor(error: string, status: number) {
    this.message = error;
    this.status = status;
  }
}

const FIREBASE_ERRORS: { [key: string]: { status: number; message: string } } =
  {
    'auth/email-already-in-use': {
      status: 401,
      message: 'Email already is use',
    },
    'auth/weak-password': {
      status: 400,
      message: 'Password must contain at least 6 characters',
    },
    'auth/invalid-credential': {
      status: 404,
      message: 'Email or password are wrong',
    },
    'auth/invalid-email': {
      status: 404,
      message: 'Email is invalid',
    },
    'auth/popup-closed-by-user': {
      status: 500,
      message: 'Google popup closed',
    },
  };

const throwError = (error: unknown, status?: number) => {
  console.log('there was an error: ', error);
  errorEvent(error);

  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof FirebaseError) {
    const firebaseErrorMsg = FIREBASE_ERRORS[error.code];
    throw {
      status: firebaseErrorMsg.status,
      message: firebaseErrorMsg.message,
    };
  }

  throw {
    status: status || 500,
    message: 'Oh oh! It seems my dog ate the code. Please try again later.',
  };
};

export { throwError, AppError };

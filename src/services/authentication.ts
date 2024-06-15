import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import { auth, provider } from './firebase-config';
import { throwError } from './error';

interface LoginProps {
  email: string;
  password: string;
}

const signinWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    throwError(error);
  }
};

const signin = async ({ email, password }: LoginProps) => {
  try {
    const user = await createUserWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    throwError(error);
  }
};

const login = async ({ email, password }: LoginProps) => {
  try {
    const user = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    throwError(error);
  }
};

const logout = async () => {
  await signOut(auth);
};

export { login, logout, signin, signinWithGoogle };
export type { LoginProps, User };

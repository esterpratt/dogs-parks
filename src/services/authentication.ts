import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from './firebase-config';
import { throwError } from './error';

interface LoginProps {
  email: string;
  password: string;
}

interface SigninProps extends LoginProps {
  name: string;
  dogName: string;
}

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

export { login, logout, signin };
export type { LoginProps, SigninProps, User };

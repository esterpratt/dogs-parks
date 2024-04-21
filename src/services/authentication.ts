import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from './firebase-config';

interface LoginProps {
  email: string;
  password: string;
}

interface SigninProps extends LoginProps {
  name: string;
}

const signin = async ({ email, password }: LoginProps) => {
  try {
    const user = await createUserWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    console.error('error while signing in: ', error);
    throw error;
  }
};

const login = async ({ email, password }: LoginProps) => {
  try {
    const user = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    console.error('error while logging in: ', error);
    throw error;
  }
};

const logout = async () => {
  await signOut(auth);
};

export { login, logout, signin };
export type { LoginProps, SigninProps, User };

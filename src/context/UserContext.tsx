import { PropsWithChildren, createContext, useState } from 'react';
import {
  LoginProps,
  SigninProps,
  login,
  logout,
  signin,
} from '../services/authentication';
import { createUser, fetchUser } from '../services/users';
import { User } from '../types/user';

interface UserContextObj {
  user: User | null;
  userLogin: (props: LoginProps) => Promise<User | Error | void>;
  userLogout: () => void;
  userSignin: (props: SigninProps) => Promise<User | Error | void>;
}

const initialData: UserContextObj = {
  user: null,
  userLogin: () => Promise.resolve(),
  userLogout: () => {},
  userSignin: () => Promise.resolve(),
};

const UserContext = createContext<UserContextObj>(initialData);

const UserContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const userLogin = async ({ email, password }: LoginProps) => {
    try {
      const userCredentials = await login({ email, password });
      const { uid: id } = userCredentials.user;
      const user = await fetchUser(id);
      setUser(user);
    } catch (error) {
      return error as Error;
    }
  };

  const userLogout = async () => {
    await logout();
    setUser(null);
  };

  const userSignin = async ({ email, password, name }: SigninProps) => {
    try {
      const userCredentials = await signin({ email, password });
      const { uid: id } = userCredentials.user;
      const userToCreate = { id, name };
      await createUser(userToCreate);
      setUser(userToCreate);
    } catch (error) {
      return error as Error;
    }
  };

  const value: UserContextObj = {
    user,
    userLogin,
    userLogout,
    userSignin,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export { UserContextProvider, UserContext };

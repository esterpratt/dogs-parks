import {
  PropsWithChildren,
  createContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  LoginProps,
  SigninProps,
  login,
  logout,
  signin,
} from '../services/authentication';
import { createUser, fetchUser } from '../services/users';
import { User } from '../types/user';
import { useOnAuthStateChanged } from '../hooks/useOnAuthStateChanged';

interface UserContextObj {
  userId: string | null;
  user: User | null;
  loadingUserId: boolean;
  userLogin: (props: LoginProps) => Promise<User | Error | void>;
  userLogout: () => void;
  userSignin: (props: SigninProps) => Promise<User | Error | void>;
}

const initialData: UserContextObj = {
  userId: null,
  user: null,
  loadingUserId: true,
  userLogin: () => Promise.resolve(),
  userLogout: () => {},
  userSignin: () => Promise.resolve(),
};

const UserContext = createContext<UserContextObj>(initialData);

const UserContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { userId, loadingUserId } = useOnAuthStateChanged();
  const [user, setUser] = useState<User | null>(null);
  const userExtraDataRef = useRef<Omit<User, 'id'> | null>(null);

  useEffect(() => {
    const getUser = async () => {
      if (userExtraDataRef.current) {
        const userToSet = { id: userId!, name: userExtraDataRef.current.name };
        try {
          await createUser(userToSet);
          setUser(userToSet);
        } catch (error) {
          console.error(error);
        } finally {
          userExtraDataRef.current = null;
        }
      } else {
        const userData = await fetchUser(userId!);
        setUser({ ...userData });
      }
    };
    if (userId) {
      getUser();
    } else {
      setUser(null);
    }
  }, [userId]);

  const userLogin = async ({ email, password }: LoginProps) => {
    try {
      await login({ email, password });
    } catch (error) {
      return error as Error;
    }
  };

  const userLogout = async () => {
    await logout();
  };

  const userSignin = async ({ email, password, name }: SigninProps) => {
    try {
      userExtraDataRef.current = { name };
      await signin({ email, password });
    } catch (error) {
      userExtraDataRef.current = null;
      return error as Error;
    }
  };

  const value: UserContextObj = {
    user,
    userId,
    loadingUserId,
    userLogin,
    userLogout,
    userSignin,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export { UserContextProvider, UserContext };

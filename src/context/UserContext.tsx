import {
  Dispatch,
  PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from 'react';
import {
  LoginProps as LoginWithEmailAndPasswordProps,
  login,
  logout,
  signin,
  signinWithGoogle,
  deleteUser,
} from '../services/authentication';
import { createUser, fetchUser } from '../services/users';
import { User } from '../types/user';
import { useOnAuthStateChanged } from '../hooks/useOnAuthStateChanged';
import { queryClient } from '../services/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalStorage } from '../hooks/useLocalStorage';

type SigninProps = Partial<LoginWithEmailAndPasswordProps> & {
  name?: string;
  withGoogle?: boolean;
};

type LoginProps = Partial<LoginWithEmailAndPasswordProps> & {
  withGoogle?: boolean;
};

interface UserContextObj {
  userId: string | null;
  user?: User | null;
  isLoadingAuthUser: boolean;
  userLogin: (props: LoginProps) => void;
  userLogout: () => void;
  userSignin: (props: SigninProps) => void;
  userDeletion: () => void;
  error: string;
  setError: Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  refetchUser: () => void;
}

const initialData: UserContextObj = {
  userId: null,
  user: null,
  isLoadingAuthUser: false,
  userLogin: () => Promise.resolve(),
  userLogout: () => {},
  userSignin: () => Promise.resolve(),
  userDeletion: () => {},
  setError: () => {},
  error: '',
  isLoading: false,
  refetchUser: () => {},
};

const UserContext = createContext<UserContextObj>(initialData);

const UserContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { userId, displayName, isNewUser, isLoadingAuthUser } =
    useOnAuthStateChanged();
  const [error, setError] = useState('');
  const [userName, setUserName] = useLocalStorage('userName');

  const {
    data: user,
    refetch: refetchUser,
    isLoading: isLoadingUser,
  } = useQuery({
    queryKey: ['user', 'me', userId],
    queryFn: () => fetchUser(userId!),
    enabled: false,
  });

  const { mutate: addUser, isPending: isCreatingUser } = useMutation({
    mutationFn: (vars: { userId: string; userName: string }) => {
      const userToSet = {
        id: vars.userId,
        name: vars.userName,
      };
      return createUser(userToSet);
    },
    onSuccess: async () => {
      refetchUser();
    },
  });

  useEffect(() => {
    if (userId) {
      if (isNewUser) {
        addUser({
          userId,
          userName: userName || displayName || 'you',
        });
      } else {
        refetchUser();
      }
    }
  }, [userId, displayName, isNewUser, addUser, refetchUser, userName]);

  const { mutate: userSigninWithEmailAndPassowrd, isPending: isSigningIn } =
    useMutation({
      mutationFn: (vars: SigninProps) => {
        setUserName(vars.name);
        return signin({ email: vars.email!, password: vars.password! });
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  const { mutate: userSinginWithGoogle, isPending: isSigninInWithGoogle } =
    useMutation({
      mutationFn: () => signinWithGoogle(),
      onError: (error) => {
        setError(error.message);
      },
    });

  const userSignin = ({ withGoogle, email, password, name }: SigninProps) => {
    setError('');
    if (withGoogle) {
      userSinginWithGoogle();
    } else {
      userSigninWithEmailAndPassowrd({
        email: email!,
        password: password!,
        name: name!,
      });
    }
  };

  const { mutate: userLoginWithEmailAndPassword, isPending: isLogingIn } =
    useMutation({
      mutationFn: (data: LoginProps) => {
        setError('');
        return login({ email: data.email!, password: data.password! });
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  const userLogin = ({ withGoogle, email, password }: LoginProps) => {
    setError('');
    if (withGoogle) {
      userSinginWithGoogle();
    } else {
      userLoginWithEmailAndPassword({
        email: email!,
        password: password!,
      });
    }
  };

  const { mutate: userLogout } = useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ['user', 'me'] });
      setUserName();
    },
  });

  const { mutate: userDeletion, isPending: isPendingDeletion } = useMutation({
    mutationFn: () => {
      localStorage.setItem('userDeleted', '1');
      return deleteUser();
    },
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ['user', 'me'] });
      setUserName();
    },
  });

  const isLoading =
    isLoadingUser ||
    isCreatingUser ||
    isSigningIn ||
    isLogingIn ||
    isSigninInWithGoogle ||
    isPendingDeletion ||
    isLoadingAuthUser;

  const value: UserContextObj = {
    user,
    userId,
    isLoadingAuthUser,
    userLogin,
    userLogout,
    userSignin,
    userDeletion,
    error,
    setError,
    isLoading,
    refetchUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export { UserContextProvider, UserContext };
export type { SigninProps };

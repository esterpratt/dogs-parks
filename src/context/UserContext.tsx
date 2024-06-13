import { Dispatch, PropsWithChildren, createContext, useState } from 'react';
import {
  LoginProps as LoginWithEmailAndPasswordProps,
  login,
  logout,
  signin,
  signinWithGoogle,
} from '../services/authentication';
import { createUser, fetchUser } from '../services/users';
import { User } from '../types/user';
import { useOnAuthStateChanged } from '../hooks/useOnAuthStateChanged';
import { queryClient } from '../services/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';

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
  loadingUserId: boolean;
  isLoadingUser?: boolean;
  userLogin: (props: LoginProps) => void;
  userLogout: () => void;
  userSignin: (props: SigninProps) => void;
  error: string;
  setError: Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
}

const initialData: UserContextObj = {
  userId: null,
  user: null,
  loadingUserId: true,
  isLoadingUser: true,
  userLogin: () => Promise.resolve(),
  userLogout: () => {},
  userSignin: () => Promise.resolve(),
  setError: () => {},
  error: '',
  isLoading: false,
};

const UserContext = createContext<UserContextObj>(initialData);

const UserContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { userId, loadingUserId } = useOnAuthStateChanged();
  const [error, setError] = useState('');

  const {
    data: user,
    refetch: refetchUser,
    isLoading: isLoadingUser,
  } = useQuery({
    queryKey: ['user', 'me', userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId,
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

  const { mutate: userSigninWithEmailAndPassowrd, isPending: isSigningIn } =
    useMutation({
      mutationFn: (vars: SigninProps) =>
        signin({ email: vars.email!, password: vars.password! }),
      onSuccess: async (data, vars: SigninProps) => {
        const userId = data?.user.uid;
        if (userId) {
          addUser({ userId, userName: vars.name! });
        }
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  const { mutate: userSinginWithGoogle, isPending: isSigninInWithGoogle } =
    useMutation({
      mutationFn: () => signinWithGoogle(),
      onSuccess: async (data) => {
        const userId = data?.user.uid;
        if (userId) {
          addUser({
            userId,
            userName: data.user.displayName || 'user',
          });
        }
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  const { mutate: userLoginWithGoogle, isPending: isLoginInInWithGoogle } =
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
      userLoginWithGoogle();
    } else {
      userLoginWithEmailAndPassword({
        email: email!,
        password: password!,
      });
    }
  };

  const { mutate: userLogout } = useMutation({
    mutationFn: () => logout(),
    onSettled: () => queryClient.removeQueries({ queryKey: ['user', 'me'] }),
  });

  const isLoading =
    isCreatingUser ||
    isSigningIn ||
    isLogingIn ||
    isSigninInWithGoogle ||
    isLoginInInWithGoogle;

  const value: UserContextObj = {
    user,
    isLoadingUser,
    userId,
    loadingUserId,
    userLogin,
    userLogout,
    userSignin,
    error,
    setError,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export { UserContextProvider, UserContext };
export type { SigninProps };

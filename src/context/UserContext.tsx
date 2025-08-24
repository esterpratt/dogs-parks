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
  signinWithGoogle,
  signinWithApple,
  deleteUser,
} from '../services/authentication';
import { fetchUser } from '../services/users';
import { User } from '../types/user';
import { useOnAuthStateChanged } from '../hooks/useOnAuthStateChanged';
import { queryClient } from '../services/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { logoutWithCleanup } from '../services/logout-orchestrator';

type SigninProps = Partial<LoginWithEmailAndPasswordProps> & {
  name?: string;
};

type LoginProps = Partial<LoginWithEmailAndPasswordProps> & {
  withGoogle?: boolean;
  withApple?: boolean;
};

interface UserContextObj {
  userId: string | null;
  user?: User | null;
  isLoadingAuthUser: boolean;
  isLoadingUser: boolean;
  userLogin: (props: LoginProps) => void;
  userLogout: () => void;
  userSigninWithGoogle: () => void;
  userSigninWithApple: () => void;
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
  isLoadingUser: false,
  userLogin: () => Promise.resolve(),
  userLogout: () => {},
  userSigninWithGoogle: () => Promise.resolve(),
  userSigninWithApple: () => Promise.resolve(),
  userDeletion: () => {},
  setError: () => {},
  error: '',
  isLoading: false,
  refetchUser: () => {},
};

const UserContext = createContext<UserContextObj>(initialData);

const UserContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { session, isLoadingAuthUser } = useOnAuthStateChanged();
  const [error, setError] = useState('');

  const {
    data: user,
    refetch: refetchUser,
    isLoading: isLoadingUser,
  } = useQuery({
    queryKey: ['user', session?.user.id],
    queryFn: () => fetchUser(session!.user.id),
    enabled: false,
  });

  const { mutate: userSigninWithGoogle, isPending: isSigninInWithGoogle } =
    useMutation({
      mutationFn: () => signinWithGoogle(),
      onError: (error) => {
        setError(error.message);
      },
    });

  const { mutate: userSigninWithApple, isPending: isSigninInWithApple } =
    useMutation({
      mutationFn: () => signinWithApple(),
      onError: (error) => {
        setError(error.message);
      },
    });

  const { mutate: userLoginWithEmailAndPassword, isPending: isLogingIn } =
    useMutation({
      mutationFn: (data: LoginProps) => {
        return login({ email: data.email!, password: data.password! });
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  const { mutate: userLogout, isPending: isLoggingOut } = useMutation({
    mutationFn: () => logoutWithCleanup(),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ['user'] });
    },
  });

  const { mutate: userDeletion, isPending: isPendingDeletion } = useMutation({
    mutationFn: async () => {
      localStorage.setItem('userDeleted', '1');
      return deleteUser(session?.user.id || null);
    },
    onError: () => {
      localStorage.removeItem('userDeleted');
    },
    onSettled: () => {
      userLogout();
      queryClient.removeQueries({ queryKey: ['user'] });
    },
  });

  useEffect(() => {
    if (session) {
      refetchUser({ throwOnError: true }).catch((error) => {
        if (!error?.silent) {
          if (!isLoggingOut) {
            userLogout();
          }
        }
      });
    }
  }, [session, refetchUser, userLogout, isLoggingOut]);

  const userLogin = ({
    withGoogle,
    withApple,
    email,
    password,
  }: LoginProps) => {
    setError('');
    if (withGoogle) {
      userSigninWithGoogle();
    } else if (withApple) {
      userSigninWithApple();
    } else {
      userLoginWithEmailAndPassword({
        email: email!,
        password: password!,
      });
    }
  };

  const isLoading =
    isLoadingUser ||
    isLogingIn ||
    isSigninInWithGoogle ||
    isSigninInWithApple ||
    isPendingDeletion ||
    isLoadingAuthUser;

  const value: UserContextObj = {
    user,
    userId: session?.user.id || null,
    isLoadingUser,
    isLoadingAuthUser,
    userLogin,
    userLogout,
    userSigninWithGoogle,
    userSigninWithApple,
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

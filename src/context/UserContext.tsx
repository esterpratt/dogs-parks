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
import { fetchUser } from '../services/users';
import { User } from '../types/user';
import { useOnAuthStateChanged } from '../hooks/useOnAuthStateChanged';
import { queryClient } from '../services/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNotification } from './NotificationContext';

type SigninProps = Partial<LoginWithEmailAndPasswordProps> & {
  name?: string;
};

type LoginProps = Partial<LoginWithEmailAndPasswordProps> & {
  withGoogle?: boolean;
};

interface UserContextObj {
  userId: string | null;
  user?: User | null;
  isLoadingAuthUser: boolean;
  isLoadingUser: boolean;
  userLogin: (props: LoginProps) => void;
  userLogout: () => void;
  userSigninWithEmailAndPassowrd: (props: SigninProps) => void;
  userSigninWithGoogle: () => void;
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
  userSigninWithEmailAndPassowrd: () => Promise.resolve(),
  userSigninWithGoogle: () => Promise.resolve(),
  userDeletion: () => {},
  setError: () => {},
  error: '',
  isLoading: false,
  refetchUser: () => {},
};

const UserContext = createContext<UserContextObj>(initialData);

const UserContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { session, isLoadingAuthUser } = useOnAuthStateChanged();
  const { notify } = useNotification();
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

  useEffect(() => {
    if (session) {
      refetchUser();
    }
  }, [session, refetchUser]);

  const { mutate: userSigninWithEmailAndPassowrd, isPending: isSigningIn } =
    useMutation({
      mutationFn: (vars: SigninProps) => {
        return signin({
          email: vars.email!,
          password: vars.password!,
          name: vars.name!,
        });
      },
      onError: (error) => {
        setError(error.message);
      },
      onSuccess: () => {
        notify('Check your mail for details');
        setError('');
      },
    });

  const { mutate: userSigninWithGoogle, isPending: isSigninInWithGoogle } =
    useMutation({
      mutationFn: () => signinWithGoogle(),
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

  const userLogin = ({ withGoogle, email, password }: LoginProps) => {
    setError('');
    if (withGoogle) {
      userSigninWithGoogle();
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

  const isLoading =
    isLoadingUser ||
    isSigningIn ||
    isLogingIn ||
    isSigninInWithGoogle ||
    isPendingDeletion ||
    isLoadingAuthUser;

  const value: UserContextObj = {
    user,
    userId: session?.user.id || null,
    isLoadingUser,
    isLoadingAuthUser,
    userLogin,
    userLogout,
    userSigninWithEmailAndPassowrd,
    userSigninWithGoogle,
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

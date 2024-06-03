import { PropsWithChildren, createContext, useEffect, useRef } from 'react';
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
import { createDog } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { throwError } from '../services/error';

interface UserContextObj {
  userId: string | null;
  user?: User | null;
  loadingUserId: boolean;
  isLoadingUser?: boolean;
  userLogin: (props: LoginProps) => void;
  userLogout: () => void;
  userSignin: (props: SigninProps) => void;
  singinError: Error | null;
  loginError: Error | null;
}

const initialData: UserContextObj = {
  userId: null,
  user: null,
  loadingUserId: true,
  isLoadingUser: true,
  userLogin: () => Promise.resolve(),
  userLogout: () => {},
  userSignin: () => Promise.resolve(),
  singinError: null,
  loginError: null,
};

const UserContext = createContext<UserContextObj>(initialData);

const UserContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { userId, loadingUserId } = useOnAuthStateChanged();
  const userExtraDataRef = useRef<{ name: string; dogName: string } | null>(
    null
  );

  const {
    data: user,
    refetch: refetchUser,
    isLoading: isLoadingUser,
  } = useQuery({
    queryKey: ['user', 'me', userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId,
  });

  const { mutate: addDog } = useMutation({
    mutationFn: () => {
      const dogToSet = {
        owner: userId!,
        name: userExtraDataRef.current!.dogName,
      };
      return createDog(dogToSet);
    },
    onSettled: () => {
      userExtraDataRef.current = null;
    },
  });

  const { mutate: addUser } = useMutation({
    mutationFn: (data: { userId: string }) => {
      const userToSet = {
        id: data.userId,
        name: userExtraDataRef.current!.name,
      };
      return createUser(userToSet);
    },
    onSuccess: async () => {
      refetchUser();
      addDog();
    },
  });

  const { mutate: userSignin, error: singinError } = useMutation({
    mutationFn: (vars: SigninProps) =>
      signin({ email: vars.email, password: vars.password }),
    onSuccess: (_data, vars: SigninProps) => {
      userExtraDataRef.current = { name: vars.name, dogName: vars.dogName };
    },
    onError: (error) => {
      userExtraDataRef.current = null;
      throwError(error);
    },
  });

  const { mutate: userLogin, error: loginError } = useMutation({
    mutationFn: (data: LoginProps) =>
      login({ email: data.email, password: data.password }),
    onError: (error) => {
      throwError(error);
    },
  });

  const { mutate: userLogout } = useMutation({
    mutationFn: () => logout(),
  });

  useEffect(() => {
    if (userId) {
      if (userExtraDataRef.current) {
        addUser({ userId });
      } else {
        refetchUser();
      }
    } else {
      queryClient.removeQueries({ queryKey: ['user', 'me'] });
    }
  }, [userId, addUser, refetchUser]);

  const value: UserContextObj = {
    user,
    isLoadingUser,
    userId,
    loadingUserId,
    userLogin,
    userLogout,
    userSignin,
    singinError,
    loginError,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export { UserContextProvider, UserContext };

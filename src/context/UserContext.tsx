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
  isCreatingDog: boolean;
  isCreatingUser: boolean;
  isLogingIn: boolean;
  isSigningIn: boolean;
  isDogCreated: boolean;
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
  isCreatingDog: false,
  isCreatingUser: false,
  isLogingIn: false,
  isSigningIn: false,
  isDogCreated: false,
};

const UserContext = createContext<UserContextObj>(initialData);

const UserContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { userId, loadingUserId } = useOnAuthStateChanged();
  const [isDogCreated, setIsDogCreated] = useState(false);

  const {
    data: user,
    refetch: refetchUser,
    isLoading: isLoadingUser,
  } = useQuery({
    queryKey: ['user', 'me', userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId,
  });

  const { mutate: addDog, isPending: isCreatingDog } = useMutation({
    mutationFn: (data: { owner: string; name: string }) => {
      return createDog({ owner: data.owner, name: data.name });
    },
    onSuccess: () => setIsDogCreated(true),
  });

  const { mutate: addUser, isPending: isCreatingUser } = useMutation({
    mutationFn: (vars: {
      userId: string;
      userName: string;
      dogName: string;
    }) => {
      const userToSet = {
        id: vars.userId,
        name: vars.userName,
      };
      return createUser(userToSet);
    },
    onSuccess: async (
      _data,
      vars: {
        userId: string;
        userName: string;
        dogName: string;
      }
    ) => {
      refetchUser();
      addDog({ owner: vars.userId, name: vars.dogName });
    },
  });

  const {
    mutate: userSignin,
    error: singinError,
    isPending: isSigningIn,
  } = useMutation({
    mutationFn: (vars: SigninProps) =>
      signin({ email: vars.email, password: vars.password }),
    onSuccess: async (data, vars: SigninProps) => {
      const userId = data?.user.uid;
      if (userId) {
        addUser({ userId, userName: vars.name, dogName: vars.dogName });
      }
    },
    onError: (error) => {
      throwError(error);
    },
  });

  const {
    mutate: userLogin,
    error: loginError,
    isPending: isLogingIn,
  } = useMutation({
    mutationFn: (data: LoginProps) =>
      login({ email: data.email, password: data.password }),
    onError: (error) => {
      throwError(error);
    },
  });

  const { mutate: userLogout } = useMutation({
    mutationFn: () => logout(),
    onSettled: () => queryClient.removeQueries({ queryKey: ['user', 'me'] }),
  });

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
    isCreatingDog,
    isCreatingUser,
    isLogingIn,
    isSigningIn,
    isDogCreated,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export { UserContextProvider, UserContext };

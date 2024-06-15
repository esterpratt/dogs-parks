import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase-config';
import { useEffect, useState } from 'react';

const useOnAuthStateChanged = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubsribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoadingUser(false);
    });
    return unsubsribe;
  }, []);

  return {
    userId: user?.uid || null,
    isNewUser: !user
      ? false
      : new Date(user.metadata.lastSignInTime!).getTime() -
          new Date(user.metadata.creationTime!).getTime() <
        1000,
    displayName: user?.providerData?.[0].displayName,
    isLoadingAuthUser: loadingUser,
  };
};

export { useOnAuthStateChanged };

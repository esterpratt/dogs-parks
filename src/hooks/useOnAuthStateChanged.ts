import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase-config';
import { useEffect, useState } from 'react';

const useOnAuthStateChanged = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUserId, setLoadingUserId] = useState(true);

  useEffect(() => {
    const unsubsribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setLoadingUserId(false);
    });
    return unsubsribe;
  }, []);

  return { userId, loadingUserId };
};

export { useOnAuthStateChanged };

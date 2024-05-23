import { useState } from 'react';

const getInitialValue = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : '';
  } catch (e) {
    return '';
  }
};

const useLocalStorage = (key: string) => {
  const [storedValue, setStoredValue] = useState(() => getInitialValue(key));

  // @ts-expect-error - value could be any
  const setValue = (value) => {
    try {
      if (value) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.removeItem(key);
      }

      setStoredValue(value);
    } catch (e) {
      console.log('there was an error saving to local storage: ', e);
    }
  };

  return [storedValue, setValue];
};

export { useLocalStorage };

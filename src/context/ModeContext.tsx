import { createStore, StoreApi, useStore } from 'zustand';
import { createContext, ReactNode, useContext, useState } from 'react';

type Mode = 'light' | 'dark';

interface ModeStoreProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<StoreApi<ModeStoreProps> | undefined>(
  undefined
);

interface ModeProviderProps {
  children: ReactNode;
}

export const ModeProvider = ({ children }: ModeProviderProps) => {
  const getInitialMode = (): Mode => {
    try {
      const stored = localStorage.getItem('theme');
      return stored === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  };

  const [store] = useState(() =>
    createStore<ModeStoreProps>((set) => ({
      mode: getInitialMode(),
      setMode: (mode) => {
        set({ mode });
        localStorage.setItem('theme', mode);
      },
    }))
  );

  return <ModeContext.Provider value={store}>{children}</ModeContext.Provider>;
};

export const useModeContext = <T,>(selector: (state: ModeStoreProps) => T) => {
  const context = useContext(ModeContext);

  if (!context) {
    throw new Error('mode context was used outside of its provider');
  }

  return useStore(context, selector);
};

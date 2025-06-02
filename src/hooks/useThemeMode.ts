import { useEffect } from "react";
import { useModeContext } from "../context/ModeContext";

const useThemeMode = () => {
  const mode = useModeContext((state) => state.mode);

  useEffect(() => {
    document.body.classList.toggle('dark', mode === 'dark');
  }, [mode]);
}

export { useThemeMode };
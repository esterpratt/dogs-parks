import { Sun, Moon } from 'lucide-react';
import { useModeContext } from '../../context/ModeContext';
import { ToggleInput } from '../../components/inputs/ToggleInput';

export const ThemeToggle = () => {
  const mode = useModeContext((state) => state.mode);
  const setMode = useModeContext((state) => state.setMode);

  return (
    <ToggleInput
      label="Dark mode"
      value={mode}
      valueOn="dark"
      valueOff="light"
      onChange={setMode}
      iconOn={<Moon />}
      iconOff={<Sun />}
    />
  );
};

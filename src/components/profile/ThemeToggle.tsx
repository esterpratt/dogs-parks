import { Sun, Moon } from 'lucide-react';
import { useModeContext } from '../../context/ModeContext';
import { ToggleInput } from '../../components/inputs/ToggleInput';
import { useTranslation } from 'react-i18next';

export const ThemeToggle = () => {
  const mode = useModeContext((state) => state.mode);
  const setMode = useModeContext((state) => state.setMode);
  const { t } = useTranslation();

  return (
    <ToggleInput
      label={t('settings.theme.darkMode')}
      value={mode}
      valueOn="dark"
      valueOff="light"
      onChange={setMode}
      iconOn={<Moon />}
      iconOff={<Sun />}
    />
  );
};

import { MouseEvent } from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { setPreferredLanguage } from '../utils/languageStorage';

interface LanguageSwitcherProps {
  className?: string;
  onClick?: () => void;
}

const LanguageSwitcher = ({ className, onClick }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();

  const handleToggle = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const next = i18n.language?.startsWith('he') ? 'en' : 'he';
    await i18n.changeLanguage(next);
    await setPreferredLanguage(next as 'en' | 'he');
    if (onClick) {
      onClick();
    }
  };

  const label = i18n.language?.startsWith('he') ? 'English' : 'עברית';

  return (
    <button
      type="button"
      className={classnames(className)}
      onClick={handleToggle}
    >
      <span>{label}</span>
    </button>
  );
};

export { LanguageSwitcher };

import { MouseEvent } from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { setPreferredLanguage } from '../utils/languageStorage';
import { APP_LANGUAGES } from '../utils/consts';

const LABEL_ENGLISH = 'English';
const LABEL_HEBREW = 'עברית';

interface LanguageSwitcherProps {
  className?: string;
  onClick?: () => void;
}

const LanguageSwitcher = (props: LanguageSwitcherProps) => {
  const { className, onClick } = props;
  const { i18n } = useTranslation();

  const currentLang = i18n.language?.split('-')[0] || APP_LANGUAGES.EN;
  const isHebrew = currentLang === APP_LANGUAGES.HE;
  const nextLang = isHebrew ? APP_LANGUAGES.HE : APP_LANGUAGES.EN;
  const label = isHebrew ? LABEL_ENGLISH : LABEL_HEBREW;

  const handleToggle = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await i18n.changeLanguage(nextLang);
    await setPreferredLanguage(nextLang);
    if (onClick) {
      onClick();
    }
  };

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

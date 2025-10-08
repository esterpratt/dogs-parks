import { useTranslation } from 'react-i18next';
import { Languages, X, Check } from 'lucide-react';
import { TopModal } from './TopModal';
import { Button } from '../Button';
import { setPreferredLanguage } from '../../utils/languageStorage';
import { APP_LANGUAGES } from '../../utils/consts';
import { deriveAppLanguage } from '../../utils/language';
import { AppLanguage } from '../../types/language';
import styles from './LanguageSelectionModal.module.scss';

interface LanguageSelectionModalProps {
  open: boolean;
  onClose: () => void;
}

interface LanguageOption {
  code: AppLanguage;
  nativeLabel: string;
}

const LanguageSelectionModal = (props: LanguageSelectionModalProps) => {
  const { open, onClose } = props;
  const { i18n, t } = useTranslation();

  const currentLang = deriveAppLanguage(i18n.language);

  const languageOptions: LanguageOption[] = [
    {
      code: APP_LANGUAGES.EN,
      nativeLabel: 'English',
    },
    {
      code: APP_LANGUAGES.HE,
      nativeLabel: 'עברית',
    },
    {
      code: APP_LANGUAGES.AR,
      nativeLabel: 'العربية',
    },
  ];

  const handleLanguageSelect = async (languageCode: AppLanguage) => {
    if (languageCode === currentLang) {
      onClose();
      return;
    }

    try {
      await i18n.changeLanguage(languageCode);
      await setPreferredLanguage(languageCode);
      onClose();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleOptionClick = (languageCode: AppLanguage) => {
    handleLanguageSelect(languageCode);
  };

  const handleCloseClick = () => {
    onClose();
  };

  return (
    <TopModal open={open} onClose={onClose} className={styles.modal}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Languages className={styles.icon} size={20} />
            <h2 className={styles.title}>
              {t('language.modalTitle', 'Language')}
            </h2>
          </div>
          <Button
            variant="round"
            onClick={handleCloseClick}
            className={styles.exitButton}
          >
            <X size={18} />
          </Button>
        </div>
        <div className={styles.buttonsRow}>
          {languageOptions.map((option) => (
            <Button
              key={option.code}
              variant={option.code === currentLang ? 'primary' : 'secondary'}
              onClick={() => handleOptionClick(option.code)}
              className={styles.languageButton}
            >
              <div className={styles.buttonContent}>
                <span className={styles.nativeLabel}>{option.nativeLabel}</span>
                {option.code === currentLang && (
                  <Check className={styles.checkIcon} size={16} />
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>
    </TopModal>
  );
};

export { LanguageSelectionModal };

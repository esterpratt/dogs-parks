import { MouseEvent, useState } from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { LanguageSelectionModal } from './modals/LanguageSelectionModal';
import styles from './LanguageSwitcher.module.scss';

interface LanguageSwitcherProps {
  className?: string;
  onClick?: () => void;
}

const LanguageSwitcher = (props: LanguageSwitcherProps) => {
  const { className, onClick } = props;
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <button
        type="button"
        className={classnames(styles.button, className)}
        onClick={handleOpenModal}
      >
        <Languages className={styles.icon} size={18} />
        <span className={styles.label}>{t('language.title', 'Language')}</span>
      </button>

      <LanguageSelectionModal open={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export { LanguageSwitcher };

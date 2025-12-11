import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { TopModal } from './TopModal';
import { Button } from '../Button';
import styles from './FormModal.module.scss';

interface FormModalProps {
  open: boolean;
  onClose?: () => void;
  className?: string;
  formContainerClassName?: string;
  formClassName?: string;
  titleClassName?: string;
  children: ReactNode;
  onSave?: () => void;
  height?: number | null;
  saveText?: string;
  disabled?: boolean;
  title?: string;
}

const FormModal = ({
  open,
  onClose,
  children,
  className,
  formContainerClassName,
  formClassName,
  titleClassName,
  height,
  onSave,
  saveText,
  disabled,
  title,
}: FormModalProps) => {
  const { t } = useTranslation();
  return (
    <TopModal
      open={open}
      onClose={onClose}
      height={height}
      className={classnames(styles.modal, className)}
    >
      <div className={classnames(styles.container, formContainerClassName)}>
        <div className={classnames(styles.formContainer, formClassName)}>
          {title && (
            <div className={classnames(styles.title, titleClassName)}>
              {title}
            </div>
          )}
          {children}
        </div>
        <div className={styles.buttonsContainer}>
          {!!onSave && (
            <Button
              disabled={disabled}
              onClick={onSave}
              className={styles.button}
            >
              {saveText ?? t('common.actions.save')}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onClose}
            className={styles.button}
          >
            {t('common.actions.cancel')}
          </Button>
        </div>
      </div>
    </TopModal>
  );
};

export { FormModal };

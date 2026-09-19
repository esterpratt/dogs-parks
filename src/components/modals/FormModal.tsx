import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { TopModal } from './TopModal';
import { Button } from '../Button';
import { Loader } from '../Loader';
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
  isPending?: boolean;
  title?: string;
}

const FormModal = (props: FormModalProps) => {
  const {
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
    isPending,
    title,
  } = props;
  const { t } = useTranslation();

  // Keep the modal open while the server is processing the submitted data.
  const handleClose = () => {
    if (isPending) {
      return;
    }

    onClose?.();
  };

  return (
    <TopModal
      open={open}
      onClose={handleClose}
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
              disabled={disabled || isPending}
              onClick={onSave}
              className={styles.button}
            >
              {/* Match the established loading behavior of event action buttons. */}
              {isPending ? (
                <Loader
                  variant="secondary"
                  inside
                  className={styles.loader}
                />
              ) : (
                saveText ?? t('common.actions.save')
              )}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleClose}
            className={styles.button}
            disabled={isPending}
          >
            {t('common.actions.cancel')}
          </Button>
        </div>
      </div>
    </TopModal>
  );
};

export { FormModal };

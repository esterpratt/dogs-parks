import { MouseEvent } from 'react';
import { Button } from './Button';
import styles from './ModalSaveButton.module.scss';

interface ModalSaveButtonProps {
  onSave: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

const ModalSaveButton: React.FC<ModalSaveButtonProps> = ({
  onSave,
  disabled = false,
}) => {
  return (
    <div
      className={styles.buttonContainer}
      onClick={(event) => event?.stopPropagation()}
    >
      <Button
        variant="green"
        className={styles.saveButton}
        onClick={onSave}
        disabled={disabled}
      >
        Save
      </Button>
    </div>
  );
};

export { ModalSaveButton };

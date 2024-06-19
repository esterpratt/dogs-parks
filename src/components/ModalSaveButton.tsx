import { MouseEvent } from 'react';
import { Button } from './Button';
import styles from './ModalSaveButton.module.scss';

interface ModalSaveButtonProps {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

const ModalSaveButton: React.FC<ModalSaveButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  return (
    <div className={styles.buttonContainer}>
      <Button
        variant="green"
        className={styles.saveButton}
        onClick={onClick}
        disabled={disabled}
      >
        Save
      </Button>
    </div>
  );
};

export { ModalSaveButton };

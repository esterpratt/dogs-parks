import { ReactNode } from "react";
import { FormModal } from "../modals/FormModal";
import styles from "../../pages/DogOwnership.module.scss";

interface OwnershipModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSave: () => void;
  saveText: string;
  isPending?: boolean;
  disabled?: boolean;
  cancelText?: string;
  onSecondaryAction?: () => void;
}

const OwnershipModal = (props: OwnershipModalProps) => {
  const { children, isPending, ...modalProps } = props;
  // Use the exact form/footer component used by park invitations and edits.
  return (
    <FormModal
      open
      isPending={isPending}
      {...modalProps}
      className={styles.modal}
    >
      <fieldset className={styles.form} disabled={isPending}>
        {children}
      </fieldset>
    </FormModal>
  );
};

export { OwnershipModal };

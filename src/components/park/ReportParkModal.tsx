import { ChangeEvent, useContext, useState } from 'react';
import { Modal } from '../Modal';
import { TextArea } from '../inputs/TextArea';
import { UserContext } from '../../context/UserContext';
import styles from './ReportParkModal.module.scss';
import { createReport } from '../../services/reports';
import { useMutation } from '@tanstack/react-query';
import { useThankYouModalContext } from '../../context/ThankYouModalContext';
import { useOrientationContext } from '../../context/OrientationContext';

interface ReportParkModalProps {
  open: boolean;
  onClose: () => void;
  parkId: string;
}

export const ReportParkModal: React.FC<ReportParkModalProps> = ({
  open,
  onClose,
  parkId,
}) => {
  const { userId } = useContext(UserContext);
  const orientation = useOrientationContext((state) => state.orientation);
  const setIsThankYouModalOpen = useThankYouModalContext(
    (state) => state.setIsOpen
  );
  const [text, setText] = useState('');
  const { mutate } = useMutation({
    mutationFn: () => createReport({ userId: userId!, parkId, text }),
    onSuccess: () => setIsThankYouModalOpen(true),
  });

  const onChangeText = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const onSubmitReport = async () => {
    onClose();
    if (text) {
      mutate();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      height="70%"
      onSave={onSubmitReport}
      className={styles.container}
    >
      <TextArea
        className={styles.textArea}
        rows={orientation === 'landscape' ? 3 : 12}
        name="report"
        label="Tell us what’s wrong here."
        value={text}
        onChange={onChangeText}
        maxLength={400}
      />
    </Modal>
  );
};

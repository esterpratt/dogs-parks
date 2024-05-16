import { ChangeEvent, useContext, useState } from 'react';
import { Modal } from '../Modal';
import { TextArea } from '../inputs/TextArea';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import styles from './ReportParkModal.module.scss';
import { createReport } from '../../services/reports';

interface ReportParkModalProps {
  open: boolean;
  onClose: () => void;
  parkId: string;
}

const ReportParkModal: React.FC<ReportParkModalProps> = ({
  open,
  onClose,
  parkId,
}) => {
  const { userId } = useContext(UserContext);
  const [text, setText] = useState('');

  const onChangeText = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const onSubmitReport = async () => {
    onClose();
    if (text) {
      await createReport({ userId: userId!, parkId, text });
    }
  };

  return (
    <Modal open={open} onClose={onClose} height="60%">
      <div className={styles.container}>
        <TextArea
          rows={15}
          name="report"
          label="Please fill here the wrong details"
          value={text}
          onChange={onChangeText}
          maxLength={360}
        />
        <Button
          variant="green"
          onClick={onSubmitReport}
          className={styles.button}
        >
          Submit
        </Button>
      </div>
    </Modal>
  );
};

export { ReportParkModal };

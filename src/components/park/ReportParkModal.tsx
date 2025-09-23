import { ChangeEvent, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { TextArea } from '../inputs/TextArea';
import { UserContext } from '../../context/UserContext';
import { createParkReport } from '../../services/park-reports';
import { useOrientationContext } from '../../context/OrientationContext';
import { useNotification } from '../../context/NotificationContext';
import { FormModal } from '../modals/FormModal';
import styles from './ReportParkModal.module.scss';

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
  const { t } = useTranslation();
  const { userId } = useContext(UserContext);
  const orientation = useOrientationContext((state) => state.orientation);
  const { notify } = useNotification();
  const [text, setText] = useState('');
  const { mutate } = useMutation({
    mutationFn: () =>
      createParkReport({ user_id: userId!, park_id: parkId, text }),
    onSuccess: () => notify(),
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
    <FormModal
      saveText={t('common.actions.report')}
      open={open}
      onClose={onClose}
      onSave={onSubmitReport}
      className={styles.modal}
      disabled={!text}
    >
      <TextArea
        rows={orientation === 'landscape' ? 3 : 12}
        name="report"
        label={t('parks.report.modal.textLabel')}
        value={text}
        onChange={onChangeText}
        maxLength={400}
        className={styles.textArea}
      />
    </FormModal>
  );
};

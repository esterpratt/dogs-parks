import { useState } from 'react';
import classnames from 'classnames';
import { REPORT_DESCRIPTION, ReportReason } from '../types/report';
import { reportReview } from '../services/reviews';
import { useNotification } from '../context/NotificationContext';
import { FormModal } from './modals/FormModal';
import styles from './ReportModal.module.scss';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reviewId,
}) => {
  const { notify } = useNotification();
  const [chosenReason, setChosenReason] = useState<ReportReason | null>(null);

  const onSubmitReport = async () => {
    if (chosenReason) {
      reportReview({ reviewId, reason: chosenReason });
    }

    onClose();
    notify('Report sent');
  };

  const onChooseReason = (reason: ReportReason) => {
    setChosenReason(reason);
  };

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      onSave={onSubmitReport}
      saveText="Submit"
      disabled={!chosenReason}
      className={styles.modal}
      title="Why do you wish to report this review?"
    >
      <div className={styles.options}>
        {Object.entries(REPORT_DESCRIPTION).map(([key, value]) => {
          return (
            <div
              key={key}
              className={classnames(
                styles.input,
                key === chosenReason && styles.checked
              )}
            >
              <input
                type="radio"
                name={key}
                value={key}
                id={key}
                checked={key === chosenReason}
                onChange={() => onChooseReason(key as ReportReason)}
              />
              <label htmlFor={key}>
                {value.title} - {value.content}
              </label>
            </div>
          );
        })}
      </div>
    </FormModal>
  );
};

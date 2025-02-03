import { useState } from 'react';
import classnames from 'classnames';
import { Modal } from './Modal';
import styles from './ReportModal.module.scss';
import { useThankYouModalContext } from '../context/ThankYouModalContext';
import { REPORT_DESCRIPTION, ReportReason } from '../types/report';
import { reportReview } from '../services/reviews';

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
  const setIsThankYouModalOpen = useThankYouModalContext(
    (state) => state.setIsOpen
  );
  const [chosenReason, setChosenReason] = useState<ReportReason | null>(null);

  const onSubmitReport = async () => {
    if (chosenReason) {
      reportReview({ reviewId, reason: chosenReason });
    }

    onClose();
    setIsThankYouModalOpen(true);
  };

  const onChooseReason = (reason: ReportReason) => {
    setChosenReason(reason);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      height={'70%'}
      onSave={onSubmitReport}
      saveText="Submit Report"
      saveButtonDisabled={!chosenReason}
      className={styles.modal}
    >
      <div className={styles.container}>
        <div className={styles.title}>
          Why do you wish to report this review?
        </div>
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
      </div>
    </Modal>
  );
};

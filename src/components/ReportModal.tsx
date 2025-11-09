import { useState } from 'react';
import classnames from 'classnames';
import { REPORT_DESCRIPTION, ReportReason } from '../types/report';
import { reportReview } from '../services/reviews';
import { useNotification } from '../context/NotificationContext';
import { FormModal } from './modals/FormModal';
import styles from './ReportModal.module.scss';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const onSubmitReport = async () => {
    if (chosenReason) {
      reportReview({ reviewId, reason: chosenReason });
    }

    onClose();
    notify(t('reports.reviewModal.success'));
  };

  const onChooseReason = (reason: ReportReason) => {
    setChosenReason(reason);
  };

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      onSave={onSubmitReport}
      saveText={t('common.actions.report')}
      disabled={!chosenReason}
      className={styles.modal}
      title={t('reports.reviewModal.title')}
    >
      <div className={styles.options}>
        {Object.entries(REPORT_DESCRIPTION).map(([key]) => {
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
                {t(`reports.reasons.${key}.title`)} -{' '}
                {t(`reports.reasons.${key}.content`)}
              </label>
            </div>
          );
        })}
      </div>
    </FormModal>
  );
};

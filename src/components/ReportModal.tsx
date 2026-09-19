import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
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

const ReportModal: React.FC<ReportModalProps> = (props) => {
  const { isOpen, onClose, reviewId } = props;
  const { notify } = useNotification();
  const [chosenReason, setChosenReason] = useState<ReportReason | null>(null);
  const { t } = useTranslation();

  const handleClose = () => {
    setChosenReason(null);
    onClose();
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (reason: ReportReason) =>
      reportReview({
        reviewId,
        reason,
      }),
    onError: () => {
      notify(t('toasts.generic.error'), true);
    },
    onSuccess: () => {
      // Show success and close only after the report was persisted.
      notify(t('reports.reviewModal.sentMessage'));
      handleClose();
    },
  });

  const onSubmitReport = () => {
    if (!chosenReason || isPending) {
      return;
    }

    mutate(chosenReason);
  };

  const onChooseReason = (reason: ReportReason) => {
    setChosenReason(reason);
  };

  return (
    <FormModal
      open={isOpen}
      onClose={handleClose}
      onSave={onSubmitReport}
      saveText={t('common.actions.report')}
      disabled={!chosenReason}
      isPending={isPending}
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
                disabled={isPending}
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

export { ReportModal };

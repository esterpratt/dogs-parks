import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { useNotification } from '../../context/NotificationContext';
import {
  ActiveParkCondition,
  ParkCondition,
  ParkConditionStatus,
} from '../../types/parkCondition';
import { useAddParkCondition } from '../../hooks/api/useAddParkCondition';
import { PARK_CONDITIONS } from '../../utils/parkConditions';
import { FormModal } from '../modals/FormModal';
import styles from './ReportConditionModal.module.scss';

interface ReportConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  parkId: string;
  activeConditions: ActiveParkCondition[];
}

const ReportConditionModal: React.FC<ReportConditionModalProps> = (props) => {
  const { isOpen, onClose, parkId, activeConditions } = props;
  const { t } = useTranslation();
  const { notify } = useNotification();
  const { mutate, isPending } = useAddParkCondition();
  const [chosenCondition, setChosenCondition] = useState<ParkCondition | null>(
    null
  );

  const reportableConditions = PARK_CONDITIONS.filter(
    (option) =>
      !activeConditions.some(
        (activeCondition) => activeCondition.condition === option.id
      )
  );

  const handleClose = () => {
    setChosenCondition(null);
    onClose();
  };

  const onSubmitReport = () => {
    if (!chosenCondition || isPending) {
      return;
    }

    mutate(
      {
        parkId,
        condition: chosenCondition,
        status: ParkConditionStatus.PRESENT,
      },
      {
        onSuccess: () => {
          notify(t('toasts.live.reportThanks'));
          handleClose();
        },
        onError: () => {
          notify(t('toasts.live.reportRejected'), true);
        },
      }
    );
  };

  return (
    <FormModal
      open={isOpen}
      onClose={handleClose}
      onSave={reportableConditions.length === 0 ? undefined : onSubmitReport}
      saveText={t('parks.live.report')}
      disabled={!chosenCondition}
      isPending={isPending}
      className={styles.modal}
      title={t('parks.live.reportModal.title')}
    >
      <div className={styles.options} data-test="report-condition-modal">
        {reportableConditions.length === 0 ? (
          <p className={styles.noReportableConditions}>
            {t('parks.live.reportModal.noReportable')}
          </p>
        ) : (
          reportableConditions.map((option) => {
            const isChecked = chosenCondition === option.id;

            return (
              <div
                key={option.id}
                className={classnames(
                  styles.input,
                  isChecked && styles.checked
                )}
              >
                <input
                  type="radio"
                  id={option.id}
                  name="park-condition"
                  value={option.id}
                  checked={isChecked}
                  onChange={() => setChosenCondition(option.id)}
                  disabled={isPending}
                />
                <label htmlFor={option.id}>
                  <option.icon size={18} />
                  <span>{t(option.key)}</span>
                </label>
              </div>
            );
          })
        )}
      </div>
    </FormModal>
  );
};

export { ReportConditionModal };

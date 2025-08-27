import { useNotification } from '../../context/NotificationContext';
import {
  ActiveParkCondition,
  ParkCondition,
  ParkConditionStatus,
} from '../../types/parkCondition';
import { FormModal } from '../modals/FormModal';
import styles from './ReportConditionModal.module.scss';
import { useAddParkCondition } from '../../hooks/api/useAddParkCondition';
import { PARK_CONDITIONS } from '../../utils/parkConditions';

interface ReportConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  parkId: string;
  activeConditions: ActiveParkCondition[];
}

export const ReportConditionModal: React.FC<ReportConditionModalProps> = ({
  isOpen,
  onClose,
  parkId,
  activeConditions,
}) => {
  const { notify } = useNotification();
  const { mutate, isPending } = useAddParkCondition();

  const reportableConditions = PARK_CONDITIONS.filter(
    (option) => !activeConditions.some((ac) => ac.condition === option.value)
  );

  const handleReportCondition = (conditionToReport: ParkCondition) => {
    mutate(
      {
        parkId: parkId,
        condition: conditionToReport,
        status: ParkConditionStatus.PRESENT,
      },
      {
        onSuccess: () => {
          notify('Thanks for reporting park conditions!');
          onClose();
        },
        onError: () => {
          notify(
            'Sorry, your report was not accepted. Please try again later.'
          );
        },
      }
    );
  };

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      className={styles.modal}
      title="Report park condition"
    >
      <div className={styles.options}>
        {reportableConditions.length === 0 ? (
          <p className={styles.noReportableConditions}>
            All conditions are currently reported.
          </p>
        ) : (
          reportableConditions.map((option) => {
            return (
              <button
                key={option.id}
                className={styles.conditionButton}
                onClick={() => handleReportCondition(option.value)}
                disabled={isPending}
              >
                <option.icon size={18} />
                <span>{option.value}</span>
              </button>
            );
          })
        )}
      </div>
    </FormModal>
  );
};

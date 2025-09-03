import { useState } from 'react';
import classnames from 'classnames';
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
  const [chosenCondition, setChosenCondition] = useState<ParkCondition | null>(
    null
  );

  const reportableConditions = PARK_CONDITIONS.filter(
    (option) => !activeConditions.some((ac) => ac.condition === option.id)
  );

  const onSubmitReport = () => {
    if (!chosenCondition) {
      return;
    }

    mutate(
      {
        parkId: parkId,
        condition: chosenCondition,
        status: ParkConditionStatus.PRESENT,
      },
      {
        onSuccess: () => {
          notify('Thanks for keeping the pack updated!');
          onClose();
          setChosenCondition(null);
        },
        onError: () => {
          notify('Your report was not accepted. Please try again later.', true);
        },
      }
    );
  };

  return (
    <FormModal
      open={isOpen}
      onClose={() => {
        setChosenCondition(null);
        onClose();
      }}
      onSave={reportableConditions.length === 0 ? undefined : onSubmitReport}
      saveText="Report"
      disabled={!chosenCondition || isPending}
      className={styles.modal}
      title="Spot an issue here?"
    >
      <div className={styles.options} data-test="report-condition-modal">
        {reportableConditions.length === 0 ? (
          <p className={styles.noReportableConditions}>
            All conditions are currently reported.
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
                  <option.icon size={18} /> <span>{option.value}</span>
                </label>
              </div>
            );
          })
        )}
      </div>
    </FormModal>
  );
};

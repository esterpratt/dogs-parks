import {
  ActiveParkCondition,
  ParkConditionStatus,
} from '../../types/parkCondition';
import { useAddParkCondition } from '../../hooks/api/useAddParkCondition';
import { Button } from '../Button';
import { getFormattedPastDate } from '../../utils/time';
import { PARK_CONDITIONS } from '../../utils/parkConditions';
import { useNotification } from '../../context/NotificationContext';
import styles from './ConditionItem.module.scss';

interface ConditionItemProps {
  conditionObservation: ActiveParkCondition;
}

const ConditionItem = (props: ConditionItemProps) => {
  const { conditionObservation } = props;
  const { mutate, isPending } = useAddParkCondition();
  const { notify } = useNotification();

  const handleConfirm = () => {
    mutate(
      {
        parkId: conditionObservation.park_id,
        condition: conditionObservation.condition,
        status: ParkConditionStatus.PRESENT,
      },
      {
        onSuccess: () => {
          notify('Thanks for confirming!');
        },
        onError: () => {
          notify('Your confirmation failed. Please try again later.', true);
        },
      }
    );
  };

  const handleDeny = () => {
    mutate(
      {
        parkId: conditionObservation.park_id,
        condition: conditionObservation.condition,
        status: ParkConditionStatus.NOT_PRESENT,
      },
      {
        onSuccess: () => {
          notify('Thanks for updating!');
        },
        onError: () => {
          notify('Your update failed. Please try again later.', true);
        },
      }
    );
  };

  const ConditionIcon = PARK_CONDITIONS.find(
    (parkCondition) => parkCondition.id === conditionObservation.condition
  )?.icon;
  const conditionValue = PARK_CONDITIONS.find(
    (parkCondition) => parkCondition.id === conditionObservation.condition
  )?.value;
  const formattedReportedAt = getFormattedPastDate(
    new Date(conditionObservation.last_reported_at)
  );

  return (
    <div className={styles.container}>
      <div className={styles.conditionInfo}>
        {ConditionIcon && <ConditionIcon size={18} />}
        <span className={styles.conditionName}>{conditionValue}</span>
        <span className={styles.reportedAt}>
          Reported {formattedReportedAt}
        </span>
      </div>
      <div className={styles.stillTherePrompt}>
        <span>Still there?</span>
        <Button
          variant="simple"
          className={styles.button}
          onClick={handleConfirm}
          disabled={isPending}
        >
          Yes
        </Button>
        <Button
          variant="simple"
          className={styles.button}
          onClick={handleDeny}
          disabled={isPending}
        >
          No
        </Button>
      </div>
    </div>
  );
};

export { ConditionItem };

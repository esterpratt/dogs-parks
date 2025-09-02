import { Check, X } from 'lucide-react';
import classnames from 'classnames';
import {
  ActiveParkCondition,
  ParkCondition,
  ParkConditionStatus,
} from '../../types/parkCondition';
import { useAddParkCondition } from '../../hooks/api/useAddParkCondition';
import { Button } from '../Button';
import { getFormattedPastDate } from '../../utils/time';
import { PARK_CONDITIONS } from '../../utils/parkConditions';
import { useNotification } from '../../context/NotificationContext';
import styles from './ParkConditionItem.module.scss';

interface ParkConditionItemProps {
  conditionObservation: ActiveParkCondition;
}

const ParkConditionItem = (props: ParkConditionItemProps) => {
  const { conditionObservation } = props;
  const { mutate, isPending } = useAddParkCondition();
  const { notify } = useNotification();

  const conditionId = conditionObservation.condition;

  const handleConfirm = () => {
    mutate(
      {
        parkId: conditionObservation.park_id,
        condition: conditionId,
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
        condition: conditionId,
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
    (parkCondition) => parkCondition.id === conditionId
  )?.icon;
  const conditionValue = PARK_CONDITIONS.find(
    (parkCondition) => parkCondition.id === conditionId
  )?.value;
  const formattedReportedAt = getFormattedPastDate(
    new Date(conditionObservation.last_reported_at)
  );

  const backgroundVariantClass =
    conditionId === ParkCondition.MUDDY
      ? styles.conditionBackgroundOrange
      : conditionId === ParkCondition.BROKEN_FOUNTAIN
        ? styles.conditionBackgroundBlue
        : styles.conditionBackgroundRed;

  return (
    <div className={classnames(styles.container, backgroundVariantClass)}>
      <div className={styles.conditionInfo}>
        <div className={styles.left}>
          {ConditionIcon && (
            <div className={styles.iconContainer}>
              <ConditionIcon size={16} />
            </div>
          )}
          <div className={styles.conditionText}>
            <span className={styles.conditionName}>{conditionValue}</span>
            <span className={styles.reportedAt}>{formattedReportedAt}</span>
          </div>
        </div>
        <div className={styles.stillTherePrompt}>
          <span className={styles.stillThereLabel}>Still there?</span>
          <div className={styles.stillThereButtons}>
            <Button
              className={styles.button}
              onClick={handleConfirm}
              disabled={isPending}
            >
              <Check size={20} color={styles.green} />
            </Button>
            <Button
              className={`${styles.button} ${styles.buttonDeny}`}
              onClick={handleDeny}
              disabled={isPending}
            >
              <X size={20} color={styles.red} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ParkConditionItem };

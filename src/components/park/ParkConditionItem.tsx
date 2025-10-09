import { Check, X } from 'lucide-react';
import classnames from 'classnames';
import {
  ActiveParkCondition,
  ParkCondition,
  ParkConditionStatus,
} from '../../types/parkCondition';
import { useAddParkCondition } from '../../hooks/api/useAddParkCondition';
import { Button } from '../Button';
import { useDateUtils } from '../../hooks/useDateUtils';
import { PARK_CONDITIONS } from '../../utils/parkConditions';
import { useNotification } from '../../context/NotificationContext';
import styles from './ParkConditionItem.module.scss';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../context/UserContext';
import { capitalizeText } from '../../utils/text';

interface ParkConditionItemProps {
  conditionObservation: ActiveParkCondition;
}

const ParkConditionItem = (props: ParkConditionItemProps) => {
  const { conditionObservation } = props;
  const { mutate, isPending } = useAddParkCondition();
  const { notify } = useNotification();
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();

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
          notify(t('toasts.live.confirmThanks'));
        },
        onError: () => {
          notify(t('toasts.live.confirmRejected'), true);
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
          notify(t('toasts.live.updateThanks'));
        },
        onError: () => {
          notify(t('toasts.live.updateRejected'), true);
        },
      }
    );
  };

  const ConditionIcon = PARK_CONDITIONS.find(
    (parkCondition) => parkCondition.id === conditionId
  )?.icon;
  const conditionKey = PARK_CONDITIONS.find(
    (parkCondition) => parkCondition.id === conditionId
  )?.key;
  const { getFormattedPastDate } = useDateUtils();
  const formattedReportedAt = capitalizeText(
    getFormattedPastDate(new Date(conditionObservation.last_reported_at))
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
            <span className={styles.conditionName}>
              {conditionKey ? t(conditionKey) : ''}
            </span>
            <span className={styles.reportedAt}>{formattedReportedAt}</span>
          </div>
        </div>
        {!!userId && (
          <div className={styles.stillTherePrompt}>
            <span className={styles.stillThereLabel}>
              {t('parks.conditions.stillThere')}
            </span>
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
        )}
      </div>
    </div>
  );
};

export { ParkConditionItem };

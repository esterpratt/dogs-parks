import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { reportDogsCount } from '../../services/dogs-count';
import { queryClient } from '../../services/react-query';
import { ControlledInput } from '../inputs/ControlledInput';
import { Checkbox } from '../inputs/Checkbox';
import { useNotification } from '../../context/NotificationContext';
import { FormModal } from '../modals/FormModal';
import styles from './DogsCountModal.module.scss';

interface DogsCountModalProps {
  parkId: string;
  isOpen: boolean;
  onClose: () => void;
  showOnlyCount?: boolean;
  title?: string;
}

const DogsCountModal: React.FC<DogsCountModalProps> = (props) => {
  const { parkId, isOpen, onClose, showOnlyCount, title } = props;
  const { notify } = useNotification();
  const { t } = useTranslation();

  const [shouldHideDogsModal, setShouldHideDogsModal] =
    useLocalStorage('hideDogsModal');
  const [shouldHideDogsModalLocal, setShouldHideDogsModalLocal] =
    useState<boolean>(shouldHideDogsModal ?? false);
  const [dogsCount, setDogsCount] = useState('');

  const resetAndClose = () => {
    setDogsCount('');
    onClose();
  };

  const handleCancel = () => {
    setDogsCount('');
    setShouldHideDogsModalLocal(shouldHideDogsModal ?? false);
    onClose();
  };

  const { mutate: addDogCountReport, isPending } = useMutation({
    mutationFn: (reportedDogsCount: number) =>
      reportDogsCount({
        parkId,
        dogsCount: reportedDogsCount,
      }),
    onError: () => {
      notify(t('toasts.generic.error'), true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dogsCount', parkId],
      });

      if (shouldHideDogsModalLocal) {
        setShouldHideDogsModal(true);
      }

      // Close only after the count report was saved successfully.
      notify();
      resetAndClose();
    },
  });

  const onSave = () => {
    if (isPending) {
      return;
    }

    if (!dogsCount) {
      if (shouldHideDogsModalLocal) {
        setShouldHideDogsModal(true);
      }

      // No server write is needed when only the local preference changed.
      resetAndClose();
      return;
    }

    addDogCountReport(Number(dogsCount));
  };

  return (
    <FormModal
      saveText={t('common.actions.submit')}
      title={title}
      open={isOpen}
      onClose={handleCancel}
      onSave={onSave}
      className={styles.modal}
      isPending={isPending}
      disabled={
        !dogsCount &&
        ((!showOnlyCount && !shouldHideDogsModalLocal) || showOnlyCount)
      }
    >
      <div className={styles.inputsContainer}>
        <ControlledInput
          type="number"
          inputMode="numeric"
          name="dogsCount"
          label={t('parks.busyHours.modal.dogsCountLabel')}
          min={0}
          max={99}
          value={dogsCount}
          onChange={(event) => setDogsCount(event.currentTarget.value)}
        />
      </div>
      {!showOnlyCount && (
        <div className={styles.privacyContainer}>
          <Checkbox
            id="show"
            label={t('common.actions.dontShowAgain')}
            onChange={() =>
              setShouldHideDogsModalLocal(
                (previousShouldHideValue) => !previousShouldHideValue
              )
            }
            isChecked={shouldHideDogsModalLocal}
          />
          <span>{t('parks.busyHours.modal.hintSuffix')}</span>
        </div>
      )}
    </FormModal>
  );
};

export { DogsCountModal };

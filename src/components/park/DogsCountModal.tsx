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

const DogsCountModal: React.FC<{
  parkId: string;
  isOpen: boolean;
  onClose: () => void;
  showOnlyCount?: boolean;
  title?: string;
}> = ({ parkId, isOpen, onClose, showOnlyCount, title }) => {
  const { notify } = useNotification();
  const { t } = useTranslation();

  const [shouldHideDogsModal, setShouldHideDogsModal] =
    useLocalStorage('hideDogsModal');
  const [shouldHideDogsModalLocal, setShouldHideDogsModalLocal] =
    useState<boolean>(shouldHideDogsModal ?? false);
  const [dogsCount, setDogsCount] = useState<string>('');

  const { mutate: addDogCountReport } = useMutation({
    mutationFn: (dogsCount: number) =>
      reportDogsCount({
        parkId,
        dogsCount,
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogsCount', parkId],
      });
      notify();
    },
  });

  const onSave = async () => {
    if (shouldHideDogsModalLocal) {
      setShouldHideDogsModal(true);
    }
    if (dogsCount) {
      addDogCountReport(Number(dogsCount));
    }
    onClose();
  };

  return (
    <FormModal
      saveText={t('common.actions.submit')}
      title={title}
      open={isOpen}
      onClose={() => onClose()}
      onSave={onSave}
      className={styles.modal}
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
            onChange={() => setShouldHideDogsModalLocal((prev) => !prev)}
            isChecked={shouldHideDogsModalLocal}
          />
          <span>{t('parks.busyHours.modal.hintSuffix')}</span>
        </div>
      )}
    </FormModal>
  );
};

export { DogsCountModal };

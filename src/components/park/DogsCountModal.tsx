import { useState } from 'react';
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

  const [_shouldHideDogsModal, setShouldHideDogsModal] =
    useLocalStorage('hideDogsModal');
  const [shouldHideDogsModalLocal, setShouldHideDogsModalLocal] =
    useState<boolean>(_shouldHideDogsModal ?? false);
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
      saveText="Submit"
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
          name="dogsCount"
          label="How many dogs are currently in the park?"
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
            label="Please don't ask me again"
            onChange={() => setShouldHideDogsModalLocal((prev) => !prev)}
            isChecked={shouldHideDogsModalLocal}
          />
          <span>
            * You can always add a report by clicking the plus sign in the Busy
            Hours section.
          </span>
        </div>
      )}
    </FormModal>
  );
};

export { DogsCountModal };

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import classnames from 'classnames';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Modal } from '../Modal';
import { reportDogsCount } from '../../services/dogs-count';
import styles from './DogsCountModal.module.scss';
import { queryClient } from '../../services/react-query';
import { useThankYouModalContext } from '../../context/ThankYouModalContext';
import { ControlledInput } from '../inputs/ControlledInput';
import { Checkbox } from '../inputs/Checkbox';
import { useOrientationContext } from '../../context/OrientationContext';

const DogsCountModal: React.FC<{
  parkId: string;
  isOpen: boolean;
  userName?: string;
  onClose: () => void;
  showOnlyCount?: boolean;
}> = ({ parkId, userName, isOpen, onClose, showOnlyCount }) => {
  const setIsThankYouModalOpen = useThankYouModalContext(
    (state) => state.setIsOpen
  );

  const orientation = useOrientationContext((state) => state.orientation);

  const [shouldHideDogsModalStorage, setShouldHideDogsModal] =
    useLocalStorage('hideDogsModal');
  const shouldHideDogsModal = shouldHideDogsModalStorage ?? false;
  const [shouldHideDogsModalLocal, setShouldHideDogsModalLocal] =
    useState<boolean>(shouldHideDogsModal || false);
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
      setIsThankYouModalOpen(true);
    },
  });

  const onSave = async (dogsCount: string) => {
    setShouldHideDogsModal(shouldHideDogsModalLocal);
    if (dogsCount) {
      addDogCountReport(Number(dogsCount));
    }
    onClose();
  };

  return (
    <Modal
      height={
        orientation === 'landscape'
          ? '95%'
          : !showOnlyCount && shouldHideDogsModal
          ? '20%'
          : '50%'
      }
      style={orientation === 'landscape' ? { margin: 'auto' } : {}}
      open={isOpen}
      autoClose={!showOnlyCount && shouldHideDogsModal}
      onClose={() => onClose()}
      onSave={
        !showOnlyCount && shouldHideDogsModal
          ? undefined
          : () => onSave(dogsCount)
      }
      className={classnames(styles.modalContent, {
        [styles.keepPadding]: showOnlyCount,
      })}
      saveButtonDisabled={
        !dogsCount && dogsCount !== '0' && !shouldHideDogsModalLocal
      }
    >
      {!showOnlyCount && (
        <div
          className={classnames(styles.title, {
            [styles.large]: shouldHideDogsModal,
          })}
        >
          Enjoy your stay
          {userName ? (
            <>
              , <span>{userName}!</span>
            </>
          ) : (
            <>!</>
          )}
        </div>
      )}
      {(showOnlyCount || !shouldHideDogsModal) && (
        <>
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
                * If you are hidden, you won’t appear in search results. Only
                your friends or users you have sent friend requests to will be
                able to see your page.
              </span>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export { DogsCountModal };

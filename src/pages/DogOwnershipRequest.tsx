import { useContext, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { OwnershipModal } from '../components/dog/OwnershipModal';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { UserContext } from '../context/UserContext';
import {
  cancelDogOwnershipRequest,
  createDogOwnershipRequest,
  fetchPendingDogOwnershipRequests,
} from '../services/dog-ownership';
import { fetchDogPage } from '../services/dogs';
import { queryClient } from '../services/react-query';
import styles from './DogOwnership.module.scss';

const DogOwnershipRequest = () => {
  const { dogId } = useParams();
  const navigate = useNavigate();
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const requestKey = useRef(uuidv4());

  const { data: dogPage, isLoading } = useQuery({
    queryKey: ['dogPage', dogId],
    queryFn: () => fetchDogPage(dogId!),
    enabled: !!dogId,
  });
  const capabilities = dogPage?.capabilities;
  const { data: pendingRequests = [], isLoading: isLoadingRequests } = useQuery(
    {
      queryKey: ['dogOwnershipActions', dogId, 'myRequests'],
      queryFn: () => fetchPendingDogOwnershipRequests(dogId!),
      enabled: !!capabilities?.enabled && !!userId,
    },
  );
  const pendingRequest = pendingRequests.find(
    (request) => request.requester_user_id === userId,
  );

  // Keep the form pending until both request and capability data agree.
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dogPage', dogId] }),
      queryClient.invalidateQueries({
        queryKey: ['dogOwnershipActions', dogId],
      }),
    ]);
  const { mutate: submitRequest, isPending: isSubmitting } = useMutation({
    onMutate: () => setErrorMessage(''),
    onError: () => setErrorMessage(t('dogOwnership.requestError')),
    mutationFn: () => createDogOwnershipRequest(dogId!, requestKey.current),
    onSuccess: (result) => {
      // A confirmed response ends this retry window; recreation uses a new key.
      requestKey.current = uuidv4();
      setOutcome(result.outcome);
      return refresh();
    },
  });
  const { mutate: cancelRequest, isPending: isCanceling } = useMutation({
    onMutate: () => setErrorMessage(''),
    onError: () => setErrorMessage(t('dogOwnership.requestError')),
    mutationFn: cancelDogOwnershipRequest,
    onSuccess: (result) => {
      setOutcome(result.outcome);
      return refresh();
    },
  });

  if (isLoading) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }
  if (!dogPage) {
    return (
      <main className={styles.container}>
        <p>{t('dogOwnership.outcomes.DOG_UNAVAILABLE')}</p>
      </main>
    );
  }
  if (!capabilities?.enabled) {
    return null;
  }

  return (
    <OwnershipModal
      title={t('dogOwnership.requestTitle')}
      onClose={() => navigate(`/dogs/${dogId}`, { replace: true })}
      isPending={isSubmitting || isCanceling}
    >
      <section className={styles.modalBody}>
        {isLoadingRequests ? (
          <Loader inside />
        ) : pendingRequest ? (
          <>
            <p>{t('dogOwnership.requestPending')}</p>
            <Button
              disabled={isCanceling}
              onClick={() => cancelRequest(pendingRequest.id)}
              type="button"
              variant="secondary"
            >
              {t('dogOwnership.cancelRequest')}
            </Button>
          </>
        ) : (
          <>
            <p>{t('dogOwnership.disclosure')}</p>
            <label className={styles.checkbox}>
              <input
                checked={disclosureAccepted}
                onChange={(event) =>
                  setDisclosureAccepted(event.target.checked)
                }
                type="checkbox"
              />
              <span>{t('dogOwnership.disclosureAccept')}</span>
            </label>
            <Button
              disabled={
                !capabilities.can_request || !disclosureAccepted || isSubmitting
              }
              onClick={() => submitRequest()}
              type="button"
            >
              {t('dogOwnership.submitRequest')}
            </Button>
          </>
        )}
        {errorMessage ? (
          <p role="alert" className={styles.error}>
            {errorMessage}
          </p>
        ) : null}
        <p className={styles.status} role="status">
          {outcome ? t(`dogOwnership.outcomes.${outcome}`) : ''}
        </p>
      </section>
    </OwnershipModal>
  );
};

export default DogOwnershipRequest;

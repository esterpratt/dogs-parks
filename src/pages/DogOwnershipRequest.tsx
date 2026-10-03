import { useContext, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';
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
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [outcome, setOutcome] = useState('');
  const requestKey = useRef(uuidv4());

  const { data: dogPage, isLoading } = useQuery({
    queryKey: ['dogPage', dogId],
    queryFn: () => fetchDogPage(dogId!),
    enabled: !!dogId,
  });
  const capabilities = dogPage?.capabilities;
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['dogOwnershipActions', dogId, 'myRequests'],
    queryFn: () => fetchPendingDogOwnershipRequests(dogId!),
    enabled: !!capabilities?.enabled && !!userId,
  });
  const pendingRequest = pendingRequests.find(
    (request) => request.requester_user_id === userId,
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dogPage', dogId] });
    queryClient.invalidateQueries({ queryKey: ['dogOwnershipActions', dogId] });
  };
  const { mutate: submitRequest, isPending: isSubmitting } = useMutation({
    mutationFn: () => createDogOwnershipRequest(dogId!, requestKey.current),
    onSuccess: (result) => {
      // A confirmed response ends this retry window; recreation uses a new key.
      requestKey.current = uuidv4();
      setOutcome(result.outcome);
      refresh();
    },
  });
  const { mutate: cancelRequest, isPending: isCanceling } = useMutation({
    mutationFn: cancelDogOwnershipRequest,
    onSuccess: (result) => {
      setOutcome(result.outcome);
      refresh();
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
    <main className={styles.container}>
      <div className={styles.header}>
        <Link to={`/dogs/${dogId}`} aria-label={t('dogOwnership.back')}>
          <MoveLeft size={20} />
        </Link>
        <h1>{t('dogOwnership.requestTitle')}</h1>
      </div>
      <section className={styles.section}>
        {pendingRequest ? (
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
        {outcome ? <p>{t(`dogOwnership.outcomes.${outcome}`)}</p> : null}
      </section>
    </main>
  );
};

export default DogOwnershipRequest;

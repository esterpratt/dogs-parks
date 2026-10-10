import { useContext, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { OwnershipModal } from '../components/dog/OwnershipModal';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Checkbox } from '../components/inputs/Checkbox';
import { useNotification } from '../context/NotificationContext';
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
  const { notify } = useNotification();
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
    onError: () => notify(t('dogOwnership.requestError'), true),
    mutationFn: () => createDogOwnershipRequest(dogId!, requestKey.current),
    onSuccess: (result) => {
      // A confirmed response ends this retry window; recreation uses a new key.
      requestKey.current = uuidv4();
      const succeeded = ['CREATED', 'CANCELED'].includes(result.outcome);
      notify(t(`dogOwnership.outcomes.${result.outcome}`), !succeeded);
      if (succeeded) {
        navigate(`/dogs/${dogId}`, { replace: true });
      }
      return refresh();
    },
  });
  const { mutate: cancelRequest, isPending: isCanceling } = useMutation({
    onError: () => notify(t('dogOwnership.requestError'), true),
    mutationFn: cancelDogOwnershipRequest,
    onSuccess: (result) => {
      const succeeded = ['CREATED', 'CANCELED'].includes(result.outcome);
      notify(t(`dogOwnership.outcomes.${result.outcome}`), !succeeded);
      if (succeeded) {
        navigate(`/dogs/${dogId}`, { replace: true });
      }
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
      onSave={() =>
        pendingRequest ? cancelRequest(pendingRequest.id) : submitRequest()
      }
      saveText={t(
        pendingRequest
          ? 'dogOwnership.cancelRequest'
          : 'dogOwnership.submitRequest',
      )}
      disabled={
        isLoadingRequests ||
        (!pendingRequest && (!capabilities.can_request || !disclosureAccepted))
      }
    >
      {isLoadingRequests ? (
        <Loader inside />
      ) : pendingRequest ? (
        <p>{t('dogOwnership.requestPending')}</p>
      ) : (
        <>
          <p>{t('dogOwnership.disclosure')}</p>
          <Checkbox
            id="ownership-request-disclosure"
            isChecked={disclosureAccepted}
            onChange={() => setDisclosureAccepted(!disclosureAccepted)}
            label={t('dogOwnership.disclosureAccept')}
          />
        </>
      )}
    </OwnershipModal>
  );
};

export default DogOwnershipRequest;

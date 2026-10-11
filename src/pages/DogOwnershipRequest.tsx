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
    // Permissions belong to this viewer, never a previous account.
    queryKey: ['dogPage', dogId, userId],
    queryFn: () => fetchDogPage(dogId!),
    enabled: !!dogId,
  });
  const capabilities = dogPage?.capabilities;
  const { data: pendingRequests = [], isLoading: isLoadingRequests } = useQuery(
    {
      queryKey: ['dogOwnershipActions', dogId, userId, 'requests'],
      queryFn: () => fetchPendingDogOwnershipRequests(dogId!),
      // New requests need no extra fetch; pending actions reuse the tab query.
      enabled:
        !!capabilities?.enabled && !!capabilities.pending_action && !!userId,
    },
  );
  const needsRequestLookup = !!capabilities?.pending_action;
  const loadingPendingRequest = needsRequestLookup && isLoadingRequests;
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
    onSuccess: async (result) => {
      // A confirmed response ends this retry window; recreation uses a new key.
      requestKey.current = uuidv4();
      const succeeded = ['CREATED', 'CANCELED'].includes(result.outcome);
      notify(
        t(
          result.outcome === 'CREATED'
            ? 'dogOwnership.requestSent'
            : result.outcome === 'CANCELED'
              ? 'dogOwnership.requestCanceled'
              : `dogOwnership.outcomes.${result.outcome}`,
          { dogName: dogPage?.dog.name },
        ),
        !succeeded,
      );
      await refresh();
      if (succeeded) {
        navigate(`/dogs/${dogId}/ownership`, { replace: true });
      }
    },
  });
  const { mutate: cancelRequest, isPending: isCanceling } = useMutation({
    onError: () => notify(t('dogOwnership.requestError'), true),
    mutationFn: cancelDogOwnershipRequest,
    onSuccess: async (result) => {
      const succeeded = ['CREATED', 'CANCELED'].includes(result.outcome);
      notify(
        t(
          result.outcome === 'CREATED'
            ? 'dogOwnership.requestSent'
            : result.outcome === 'CANCELED'
              ? 'dogOwnership.requestCanceled'
              : `dogOwnership.outcomes.${result.outcome}`,
          { dogName: dogPage?.dog.name },
        ),
        !succeeded,
      );
      await refresh();
      if (succeeded) {
        navigate(`/dogs/${dogId}`, { replace: true });
      }
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
      onClose={() =>
        navigate(
          pendingRequest || capabilities.pending_action
            ? `/dogs/${dogId}/ownership`
            : `/dogs/${dogId}`,
          { replace: true },
        )
      }
      isPending={isSubmitting || isCanceling}
      onSave={() =>
        pendingRequest ? cancelRequest(pendingRequest.id) : submitRequest()
      }
      saveText={t(
        pendingRequest
          ? 'dogOwnership.withdrawShort'
          : 'dogOwnership.sendShort',
      )}
      disabled={
        loadingPendingRequest ||
        (!pendingRequest && (!capabilities.can_request || !disclosureAccepted))
      }
    >
      {loadingPendingRequest ? (
        <Loader inside />
      ) : pendingRequest ? (
        <p>{t('dogOwnership.requestPending')}</p>
      ) : (
        <>
          <p>{t('dogOwnership.disclosure', { dogName: dogPage.dog.name })}</p>
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

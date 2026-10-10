import { useContext, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OwnershipModal } from '../components/dog/OwnershipModal';
import { Checkbox } from '../components/inputs/Checkbox';
import { Loader } from '../components/Loader';
import { UserContext } from '../context/UserContext';
import { useNotification } from '../context/NotificationContext';
import {
  fetchDogOwnershipAction,
  respondToDogInvite,
  respondToDogOwnershipRequest,
  respondToPrimaryTransfer,
} from '../services/dog-ownership';
import { fetchDogPage } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { DogOwnershipActionType, DogPageData } from '../types/dog-ownership';

const OwnershipAction = () => {
  const { actionId, actionType, dogId } = useParams();
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const normalizedType: DogOwnershipActionType =
    actionType === 'request'
      ? 'request'
      : actionType === 'transfer'
        ? 'transfer'
        : 'invite';
  const queryKey = ['dogOwnershipAction', normalizedType, actionId];
  const { data: action, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchDogOwnershipAction(normalizedType, actionId!),
    enabled: !!actionId,
  });
  const { data: dogPage, isLoading: isLoadingDog } = useQuery({
    queryKey: ['dogPage', dogId],
    queryFn: () => fetchDogPage(dogId!),
    enabled: !!dogId,
  });
  const destination = dogPage?.viewer.is_owner
    ? `/dogs/${dogId}/ownership`
    : `/dogs/${dogId}`;
  const { mutate: respond, isPending } = useMutation({
    mutationFn: (approve: boolean) =>
      normalizedType === 'invite'
        ? respondToDogInvite(actionId!, approve, disclosureAccepted)
        : normalizedType === 'transfer'
          ? respondToPrimaryTransfer(actionId!, approve)
          : respondToDogOwnershipRequest(actionId!, approve),
    onSuccess: async (result) => {
      const finished = [
        'ACCEPTED',
        'APPROVED',
        'DECLINED',
        'CANCELED',
        'EXPIRED',
        'NO_CHANGE',
      ].includes(result.outcome);
      // Keep a single busy form until caches agree, then dismiss into the dog
      // tab and use the same toast as other app actions, without an interim card.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ['dogPage', dogId] }),
        queryClient.invalidateQueries({
          queryKey: ['dogOwnershipActions', dogId],
        }),
        queryClient.invalidateQueries({ queryKey: ['userDogs'] }),
      ]);
      if (finished) {
        const updatedDog = queryClient.getQueryData<DogPageData>([
          'dogPage',
          dogId,
        ]);
        navigate(
          updatedDog?.viewer.is_owner
            ? `/dogs/${dogId}/ownership`
            : `/dogs/${dogId}`,
          { replace: true },
        );
      }
      notify(t(`dogOwnership.outcomes.${result.outcome}`), !finished);
    },
    onError: () => notify(t('dogOwnership.requestError'), true),
  });

  if (isLoading || isLoadingDog) {
    return <Loader inside />;
  }
  const canRespond =
    action &&
    (normalizedType === 'invite'
      ? 'invitee_user_id' in action && action.invitee_user_id === userId
      : normalizedType === 'transfer'
        ? 'to_user_id' in action && action.to_user_id === userId
        : 'primary_user_id_at_creation' in action &&
          action.primary_user_id_at_creation === userId);
  if (
    !action ||
    action.dog_id !== dogId ||
    !dogPage?.capabilities.enabled ||
    !canRespond ||
    (action.status !== 'PENDING' && !isPending)
  ) {
    return <Navigate to={destination} replace />;
  }

  return (
    <OwnershipModal
      title={t(`dogOwnership.${normalizedType}ResponseTitle`)}
      onClose={() => navigate(destination, { replace: true })}
      onSave={() => respond(true)}
      saveText={t('dogOwnership.approve')}
      onSecondaryAction={() => respond(false)}
      cancelText={t('dogOwnership.decline')}
      isPending={isPending}
      disabled={normalizedType === 'invite' && !disclosureAccepted}
    >
      <p>{dogPage.dog.name}</p>
      <p>
        {t(
          normalizedType === 'transfer'
            ? 'dogOwnership.transferResponseHelp'
            : 'dogOwnership.disclosure',
        )}
      </p>
      {normalizedType === 'invite' ? (
        <Checkbox
          id="ownership-invite-disclosure"
          isChecked={disclosureAccepted}
          onChange={() => setDisclosureAccepted(!disclosureAccepted)}
          label={t('dogOwnership.disclosureAccept')}
        />
      ) : null}
    </OwnershipModal>
  );
};

// Changing notifications starts a fresh decision and disclosure state.
const OwnershipActionRoute = () => {
  const { actionType, actionId } = useParams();
  return <OwnershipAction key={`${actionType}:${actionId}`} />;
};

export default OwnershipActionRoute;

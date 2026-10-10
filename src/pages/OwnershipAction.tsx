import { useContext, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OwnershipModal } from '../components/dog/OwnershipModal';
import { Button } from '../components/Button';
import styles from './DogOwnership.module.scss';
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

interface OwnershipActionProps {
  invitationId?: string;
}

const OwnershipAction = (props: OwnershipActionProps) => {
  const { invitationId } = props;
  const { actionId: routeActionId, actionType, dogId } = useParams();
  const actionId = invitationId ?? routeActionId;
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const normalizedType: DogOwnershipActionType = invitationId
    ? 'invite'
    : actionType === 'request'
      ? 'request'
      : actionType === 'transfer'
        ? 'transfer'
        : 'invite';
  const queryKey = ['dogOwnershipAction', normalizedType, actionId, userId];
  const { data: action, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchDogOwnershipAction(normalizedType, actionId!),
    enabled: !!actionId,
  });
  const { data: dogPage, isLoading: isLoadingDog } = useQuery({
    // Permissions belong to this viewer, never a previous account.
    queryKey: ['dogPage', dogId, userId],
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
          userId,
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
    return invitationId ? null : <Navigate to={destination} replace />;
  }

  const content = (
    <>
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
    </>
  );

  // Invitations are part of the ownership tab, so there is no dialog to reopen.
  if (invitationId) {
    return (
      <section className={styles.group}>
        <h2 className={styles.title}>{t('dogOwnership.yourInvitation')}</h2>
        <div className={styles.section}>
          <fieldset className={styles.form} disabled={isPending}>
            {content}
          </fieldset>
          <div className={styles.responseButtons}>
            <Button
              className={styles.button}
              disabled={isPending || !disclosureAccepted}
              onClick={() => respond(true)}
            >
              {t('dogOwnership.approve')}
            </Button>
            <Button
              className={styles.button}
              variant="secondary"
              disabled={isPending}
              onClick={() => respond(false)}
            >
              {t('dogOwnership.decline')}
            </Button>
          </div>
        </div>
      </section>
    );
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
      {content}
    </OwnershipModal>
  );
};

// Changing notifications starts a fresh decision and disclosure state.
const OwnershipActionRoute = () => {
  const { actionType, actionId, dogId } = useParams();
  if (actionType === 'invite') {
    return <Navigate to={`/dogs/${dogId}/ownership`} replace />;
  }
  return <OwnershipAction key={`${actionType}:${actionId}`} />;
};

export { OwnershipAction };
export default OwnershipActionRoute;

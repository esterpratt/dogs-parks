import { useContext } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';
import { PrevLinks } from '../components/PrevLinks';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { UserContext } from '../context/UserContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmModalContext';
import {
  cancelDogDeletion,
  fetchDogDeletionProposal,
  respondToDogDeletion,
  withdrawDogDeletionApproval,
} from '../services/dog-ownership';
import { fetchDogPage } from '../services/dogs';
import { queryClient } from '../services/react-query';
import styles from './DogOwnership.module.scss';

const DogOwnershipDeletion = () => {
  const { dogId, proposalId } = useParams();
  const { userId } = useContext(UserContext);
  const { showModal } = useConfirm();
  const { t } = useTranslation();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const {
    data: proposal,
    isLoading: isLoadingProposal,
    refetch,
  } = useQuery({
    queryKey: ['dogDeletionProposal', dogId, proposalId, userId],
    queryFn: () => fetchDogDeletionProposal(dogId!, proposalId),
    enabled: !!dogId || !!proposalId,
  });
  const resolvedDogId = dogId ?? proposal?.dog_id;
  const { data: dogPage, isLoading: isLoadingCapabilities } = useQuery({
    // Permissions belong to this viewer, never a previous account.
    queryKey: ['dogPage', resolvedDogId, userId],
    queryFn: () => fetchDogPage(resolvedDogId!),
    enabled: !!resolvedDogId,
  });
  const capabilities = dogPage?.capabilities;
  const members = dogPage?.members ?? [];
  const currentMember = members.find((member) => member.user_id === userId);
  const currentConsent = proposal?.consents.find(
    (consent) => consent.member_id === currentMember?.id,
  );
  const refreshDeletion = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['dogPage', resolvedDogId] });
  };
  const { mutateAsync: respond, isPending: isResponding } = useMutation({
    onError: () => notify(t('dogOwnership.requestError'), true),
    mutationFn: (approve: boolean) =>
      respondToDogDeletion(proposal!.id, approve),
    onSuccess: (result) => {
      notify(t(`dogOwnership.outcomes.${result.outcome}`));
      if (result.outcome === 'DELETION_PREPARED') {
        navigate(`/profile/${userId}/dogs`, { replace: true });
      }
      refreshDeletion();
    },
  });
  const { mutateAsync: withdraw, isPending: isWithdrawing } = useMutation({
    onError: () => notify(t('dogOwnership.requestError'), true),
    mutationFn: () => withdrawDogDeletionApproval(proposal!.id),
    onSuccess: (result) => {
      notify(t(`dogOwnership.outcomes.${result.outcome}`));
      if (result.outcome === 'DELETION_PREPARED') {
        navigate(`/profile/${userId}/dogs`, { replace: true });
      }
      refreshDeletion();
    },
  });
  const { mutateAsync: cancel, isPending: isCanceling } = useMutation({
    onError: () => notify(t('dogOwnership.requestError'), true),
    mutationFn: () => cancelDogDeletion(proposal!.id),
    onSuccess: (result) => {
      notify(t(`dogOwnership.outcomes.${result.outcome}`));
      if (result.outcome === 'DELETION_PREPARED') {
        navigate(`/profile/${userId}/dogs`, { replace: true });
      }
      refreshDeletion();
    },
  });

  if (isLoadingCapabilities || isLoadingProposal) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }
  if (!capabilities?.enabled || !capabilities.is_owner || !proposal) {
    return null;
  }

  const showDestructiveConfirmation = (
    titleKey: string,
    confirmKey: string,
    action: () => Promise<unknown>,
  ) => {
    // Shared deletion decisions use the existing app-level confirmation sheet.
    showModal({
      title: t(titleKey),
      confirmText: t(confirmKey),
      cancelText: t('dogOwnership.cancel'),
      onConfirm: async () => {
        await action();
      },
    });
  };
  const isPending = proposal.status === 'PENDING';

  return (
    <main className={styles.container}>
      <PrevLinks
        links={{
          to: `/dogs/${resolvedDogId}/ownership`,
          icon: <MoveLeft size={16} />,
          text: t('dogOwnership.back'),
        }}
      />
      <h1 className={styles.pageTitle}>{t('dogOwnership.deletionTitle')}</h1>
      <section className={styles.section}>
        <p>{t('dogOwnership.deletionWarning')}</p>
        <p>
          {t('dogOwnership.deletionProgress', {
            approved: proposal.approved_consent_count,
            required: proposal.required_consent_count,
          })}
        </p>
        {!isPending ? (
          <p>{t(`dogOwnership.outcomes.${proposal.status}`)}</p>
        ) : null}
        {isPending && !currentConsent ? (
          <div className={styles.actions}>
            <Button
              disabled={isResponding}
              onClick={() =>
                showDestructiveConfirmation(
                  'dogOwnership.finalApprovalTitle',
                  'dogOwnership.approveDeletion',
                  () => respond(true),
                )
              }
              type="button"
            >
              {t('dogOwnership.approveDeletion')}
            </Button>
            <Button
              disabled={isResponding}
              onClick={() =>
                showDestructiveConfirmation(
                  'dogOwnership.rejectDeletionTitle',
                  'dogOwnership.rejectDeletion',
                  () => respond(false),
                )
              }
              type="button"
              variant="secondary"
            >
              {t('dogOwnership.rejectDeletion')}
            </Button>
          </div>
        ) : null}
        {isPending && currentConsent?.decision === 'APPROVED' ? (
          <Button
            disabled={isWithdrawing}
            onClick={() =>
              showDestructiveConfirmation(
                'dogOwnership.withdrawDeletionTitle',
                'dogOwnership.withdrawDeletion',
                withdraw,
              )
            }
            type="button"
            variant="secondary"
          >
            {t('dogOwnership.withdrawDeletion')}
          </Button>
        ) : null}
        {isPending && capabilities.role === 'PRIMARY_OWNER' ? (
          <Button
            disabled={isCanceling}
            onClick={() => cancel()}
            type="button"
            variant="secondary"
          >
            {t('dogOwnership.cancelDeletion')}
          </Button>
        ) : null}
      </section>
    </main>
  );
};

export default DogOwnershipDeletion;

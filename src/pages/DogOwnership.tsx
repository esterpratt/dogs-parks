import { useContext, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Link,
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  User as UserIcon,
  Plus,
  ArrowRightLeft,
  LogOut,
  Trash2,
  FileCheck2,
  CircleX,
  Clock3,
  Ban,
} from 'lucide-react';
import { OwnerRecipient } from '../components/dog/OwnerRecipient';
import { OwnershipAction } from './OwnershipAction';
import { OwnershipModal } from '../components/dog/OwnershipModal';
import { SelectUsers } from '../components/SelectUsers';
import { User } from '../types/user';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmModalContext';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { UserContext } from '../context/UserContext';
import { useFetchFriends } from '../hooks/api/useFetchFriends';
import {
  cancelDogInvite,
  cancelPrimaryTransfer,
  createDogInvite,
  fetchDogDeletionProposal,
  createPrimaryTransfer,
  fetchDogInvites,
  fetchPendingDogOwnershipRequests,
  fetchPendingPrimaryTransfers,
  proposeDogDeletion,
} from '../services/dog-ownership';
import { fetchDogPage } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { DeleteDogModal } from '../components/dog/DeleteDogModal';
import styles from './DogOwnership.module.scss';

const DogOwnership = () => {
  const { dogId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notificationStatus = searchParams.get('status');
  const receiptType = searchParams.get('action');
  const receiptTitle =
    receiptType === 'request'
      ? 'requestResponseTitle'
      : receiptType === 'transfer'
        ? 'transferResponseTitle'
        : 'inviteResponseTitle';
  const visibleStatus = [
    'ACCEPTED',
    'APPROVED',
    'DECLINED',
    'CANCELED',
    'EXPIRED',
  ].includes(notificationStatus ?? '')
    ? notificationStatus
    : null;
  const isClosedStatus = ['CANCELED', 'DECLINED', 'EXPIRED'].includes(
    visibleStatus ?? '',
  );
  const { notify } = useNotification();
  const [invitedFriends, setInvitedFriends] = useState<User[]>([]);
  const { t } = useTranslation();
  const { userId } = useContext(UserContext);
  const { showModal } = useConfirm();
  const [activeModal, setActiveModal] = useState<'invite' | 'transfer' | null>(
    null,
  );
  const [isDeleteDogModalOpen, setIsDeleteDogModalOpen] = useState(false);
  const [selectedTransferMemberId, setSelectedTransferMemberId] = useState('');
  const inviteKeys = useRef(new Map<string, string>());
  const transferKey = useRef<string | null>(null);
  const deletionKey = useRef<string | null>(null);
  const { friends, isLoadingFriends } = useFetchFriends({ userId });
  const queryKey = ['dogOwnershipActions', dogId, userId];

  const { data: dogPage, isLoading: isLoadingCapabilities } = useQuery({
    // Permissions belong to this viewer, never a previous account.
    queryKey: ['dogPage', dogId, userId],
    queryFn: () => fetchDogPage(dogId!),
    enabled: !!dogId,
  });
  const capabilities = dogPage?.capabilities;
  const { data: allInvites = [], isLoading: isLoadingInvites } = useQuery({
    queryKey: [...queryKey, 'invites'],
    queryFn: () => fetchDogInvites(dogId!),
    enabled: !!capabilities?.enabled && !!userId,
  });
  const invites = allInvites.filter((invite) => invite.status === 'PENDING');
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: [...queryKey, 'requests'],
    queryFn: () => fetchPendingDogOwnershipRequests(dogId!),
    enabled:
      !!capabilities?.enabled && !!userId && capabilities.role !== 'CO_OWNER',
  });
  const members = dogPage?.members ?? [];
  const { data: transfers = [] } = useQuery({
    queryKey: [...queryKey, 'transfers'],
    queryFn: () => fetchPendingPrimaryTransfers(dogId!),
    enabled: !!capabilities?.enabled && dogPage?.viewer.is_owner === true,
  });
  // Deletion controls are fetched only after server capabilities enable the
  // shared ownership surface for an authenticated current owner.
  const { data: deletionProposal } = useQuery({
    queryKey: [...queryKey, 'deletion'],
    queryFn: () => fetchDogDeletionProposal(dogId!),
    enabled:
      capabilities?.enabled === true &&
      dogPage?.viewer.is_owner === true &&
      (capabilities.active_owner_count ?? 0) > 1,
  });

  // Await cache refreshes so controls cannot reappear between server states.
  const refreshActions = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ['dogPage', dogId] }),
    ]);
  const { mutate: inviteFriends, isPending: isInviting } = useMutation({
    // Each invitation retains its own retry key. Partial failures keep only
    // unsent selections in the picker; confirmed invitations are not resent.
    mutationFn: (friendsToInvite: User[]) =>
      Promise.allSettled(
        friendsToInvite.map(async (friend) => {
          const key = inviteKeys.current.get(friend.id) ?? uuidv4();
          inviteKeys.current.set(friend.id, key);
          const result = await createDogInvite(dogId!, friend.id, key);
          inviteKeys.current.delete(friend.id);
          return result;
        }),
      ),
    onSuccess: async (results, friendsToInvite) => {
      const failedFriends = friendsToInvite.filter((_friend, index) => {
        const result = results[index];
        return (
          result.status === 'rejected' || result.value.outcome !== 'CREATED'
        );
      });
      setInvitedFriends(failedFriends);
      if (!failedFriends.length) {
        setActiveModal(null);
        notify(t('dogOwnership.invitationSent'));
      } else {
        const firstFailure = results.find(
          (result) =>
            result.status === 'fulfilled' && result.value.outcome !== 'CREATED',
        );
        notify(
          firstFailure?.status === 'fulfilled'
            ? t(`dogOwnership.outcomes.${firstFailure.value.outcome}`)
            : t('dogOwnership.requestError'),
          true,
        );
      }
      await refreshActions();
    },
    onError: () => notify(t('dogOwnership.requestError'), true),
  });
  const { mutateAsync: cancelInvite, isPending: isCancelingInvite } =
    useMutation({
      onError: () => notify(t('dogOwnership.requestError'), true),
      mutationFn: cancelDogInvite,
      onSuccess: (result) => {
        notify(
          t(
            result.outcome === 'CANCELED'
              ? 'dogOwnership.invitationRevoked'
              : `dogOwnership.outcomes.${result.outcome}`,
          ),
          result.outcome !== 'CANCELED',
        );
        return refreshActions();
      },
    });
  const { mutate: offerTransfer, isPending: isOfferingTransfer } = useMutation({
    onError: () => notify(t('dogOwnership.requestError'), true),
    mutationFn: (memberId: string) => {
      const idempotencyKey = transferKey.current ?? uuidv4();
      transferKey.current = idempotencyKey;
      return createPrimaryTransfer(dogId!, memberId, idempotencyKey);
    },
    onSuccess: (result) => {
      transferKey.current = null;
      notify(
        t(
          result.outcome === 'CREATED'
            ? 'dogOwnership.offerSent'
            : `dogOwnership.outcomes.${result.outcome}`,
        ),
        result.outcome !== 'CREATED',
      );
      if (result.outcome === 'CREATED') {
        setActiveModal(null);
      }
      return refreshActions();
    },
  });
  const { mutate: cancelTransfer, isPending: isCancelingTransfer } =
    useMutation({
      onError: () => notify(t('dogOwnership.requestError'), true),
      mutationFn: cancelPrimaryTransfer,
      onSuccess: (result) => {
        notify(
          t(
            result.outcome === 'CANCELED'
              ? 'dogOwnership.offerRevoked'
              : `dogOwnership.outcomes.${result.outcome}`,
          ),
          result.outcome !== 'CANCELED',
        );
        return refreshActions();
      },
    });
  const { mutateAsync: proposeDeletion, isPending: isProposingDeletion } =
    useMutation({
      onError: () => notify(t('dogOwnership.requestError'), true),
      mutationFn: () => {
        const idempotencyKey = deletionKey.current ?? uuidv4();
        deletionKey.current = idempotencyKey;
        return proposeDogDeletion(dogId!, idempotencyKey);
      },
      onSuccess: (result) => {
        notify(
          t(
            result.outcome === 'CREATED'
              ? 'dogOwnership.deletionSent'
              : `dogOwnership.outcomes.${result.outcome}`,
          ),
          result.outcome !== 'CREATED',
        );
        deletionKey.current = null;
        return refreshActions();
      },
    });

  if (isLoadingCapabilities) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }

  if (!dogPage || !capabilities) {
    return (
      <main className={styles.container}>
        <p>{t('dogOwnership.outcomes.DOG_UNAVAILABLE')}</p>
      </main>
    );
  }

  const invitedUserIds = new Set(
    invites.map((invite) => invite.invitee_user_id),
  );
  // Existing co-owners remain friends but are already part of this dog; avoid
  // offering invitations that the server would correctly reject as duplicates.
  const ownerUserIds = new Set(members.map((member) => member.user_id));
  const eligibleFriends =
    friends?.filter(
      (friend) =>
        !invitedUserIds.has(friend.id) && !ownerUserIds.has(friend.id),
    ) ?? [];
  const eligibleTransferMembers = members.filter(
    (member) => member.role === 'CO_OWNER',
  );

  const openModal = (modal: 'invite' | 'transfer') => {
    setInvitedFriends([]);
    // Start each transfer picker with a currently eligible co-owner.
    setSelectedTransferMemberId(eligibleTransferMembers[0]?.id ?? '');
    setActiveModal(modal);
  };
  const friendName = (friendId: string) =>
    friends?.find((friend) => friend.id === friendId)?.name ??
    t('dogOwnership.memberFallback');

  return (
    <div className={styles.content}>
      {!dogPage.viewer.is_owner &&
      visibleStatus &&
      !isLoadingRequests &&
      !isLoadingInvites &&
      !requests.some((request) => request.requester_user_id === userId) &&
      !invites.some((invite) => invite.invitee_user_id === userId) ? (
        <section
          className={`${styles.statusCard} ${isClosedStatus ? styles.closedStatus : ''}`}
        >
          <div className={styles.statusHeading}>
            {isClosedStatus ? (
              <Ban size={22} aria-hidden="true" />
            ) : (
              <FileCheck2 size={22} aria-hidden="true" />
            )}
            <h2>{t(`dogOwnership.${receiptTitle}`)}</h2>
          </div>
          <p className={styles.statusBadge}>
            {t(`dogOwnership.receipt.${visibleStatus}`)}
          </p>
        </section>
      ) : null}
      {invites
        .filter((invite) => invite.invitee_user_id === userId)
        .map((invite) => (
          <OwnershipAction key={invite.id} invitationId={invite.id} />
        ))}
      {/* A requester can revisit their own pending action without seeing owner administration. */}
      {!dogPage.viewer.is_owner &&
      requests.some((request) => request.requester_user_id === userId) ? (
        <section className={styles.statusCard}>
          <div className={styles.statusHeading}>
            <Clock3 size={22} aria-hidden="true" />
            <p>{t('dogOwnership.requestPending')}</p>
          </div>
          <p>{t('dogOwnership.requestPendingHelp')}</p>
          <Button
            variant="secondary"
            className={styles.button}
            onClick={() => navigate(`/dogs/${dogId}/ownership/request`)}
          >
            {t('dogOwnership.cancelRequest')}
          </Button>
        </section>
      ) : null}
      {capabilities.role === 'CO_OWNER'
        ? transfers
            .filter((transfer) =>
              members.some(
                (member) =>
                  member.id === transfer.to_member_id &&
                  member.user_id === userId,
              ),
            )
            .map((transfer) => (
              <section className={styles.group} key={transfer.id}>
                <h2 className={styles.title}>
                  {t('dogOwnership.incomingTransferTitle')}
                </h2>
                <div className={styles.section}>
                  <p>{t('dogOwnership.transferResponseHelp')}</p>
                  <Button
                    className={styles.button}
                    variant="secondary"
                    onClick={() =>
                      navigate(
                        `/dogs/${dogId}/ownership/actions/transfer/${transfer.id}`,
                      )
                    }
                  >
                    {t('dogOwnership.reviewOffer')}
                  </Button>
                </div>
              </section>
            ))
        : null}
      {dogPage.viewer.is_owner ? (
        <>
          <section className={styles.group}>
            <div className={styles.header}>
              <h2 className={styles.title}>{t('dogOwnership.ownersTitle')}</h2>
              {capabilities.enabled &&
              capabilities.can_invite &&
              !isLoadingFriends &&
              !isLoadingInvites &&
              eligibleFriends.length > 0 ? (
                <Button
                  className={styles.button}
                  onClick={() => openModal('invite')}
                  disabled={!capabilities.can_invite}
                >
                  <Plus size={16} /> {t('dogOwnership.inviteTitle')}
                </Button>
              ) : null}
            </div>
            <div className={styles.ownerList}>
              {/* Display the primary owner first without changing succession order. */}
              {[...members]
                .sort(
                  (first, second) =>
                    Number(second.role === 'PRIMARY_OWNER') -
                    Number(first.role === 'PRIMARY_OWNER'),
                )
                .map((member) => (
                  <div className={styles.ownerCard} key={member.id}>
                    <Link
                      className={styles.person}
                      to={`/profile/${member.user_id}`}
                    >
                      <UserIcon
                        className={styles.avatar}
                        size={24}
                        aria-hidden="true"
                      />
                      {member.user_id === userId
                        ? t('dogOwnership.me')
                        : (member.user_name ??
                          t('dogOwnership.memberFallback'))}
                    </Link>
                    <span className={styles.role}>
                      {t(`dogOwnership.roles.${member.role}`)}
                    </span>
                  </div>
                ))}
            </div>
          </section>

          {capabilities.enabled && capabilities.role === 'PRIMARY_OWNER' ? (
            <>
              {/* Empty administrative sections stay out of the everyday profile. */}
              {requests.length > 0 ? (
                <section className={styles.group}>
                  <h2 className={styles.title}>
                    {t('dogOwnership.pendingRequests')}
                  </h2>
                  <div className={styles.section}>
                    {requests.map((request) => (
                      <div className={styles.row} key={request.id}>
                        <Link
                          className={styles.person}
                          to={`/profile/${request.requester_user_id}`}
                        >
                          <UserIcon size={24} aria-hidden="true" />
                          {friendName(request.requester_user_id)}
                        </Link>
                        <Button
                          className={styles.rowAction}
                          aria-label={t('dogOwnership.reviewRequest')}
                          title={t('dogOwnership.reviewRequest')}
                          variant="secondary"
                          onClick={() =>
                            navigate(
                              `/dogs/${dogId}/ownership/actions/request/${request.id}`,
                            )
                          }
                        >
                          <FileCheck2 size={20} aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              {invites.length > 0 ? (
                <section className={styles.group}>
                  <h2 className={styles.title}>
                    {t('dogOwnership.pendingInvites')}
                  </h2>
                  <div className={styles.section}>
                    {invites.map((invite) => (
                      <div className={styles.row} key={invite.id}>
                        <Link
                          className={styles.person}
                          to={`/profile/${invite.invitee_user_id}`}
                        >
                          <UserIcon size={24} aria-hidden="true" />
                          {friendName(invite.invitee_user_id)}
                        </Link>
                        <Button
                          className={styles.rowAction}
                          aria-label={t('dogOwnership.revokeInvitation')}
                          title={t('dogOwnership.revokeInvitation')}
                          disabled={isCancelingInvite}
                          onClick={() =>
                            showModal({
                              title: t('dogOwnership.revokeInvitationConfirm', {
                                name: friendName(invite.invitee_user_id),
                              }),
                              confirmText: t('dogOwnership.revokeInvitation'),
                              onConfirm: async () => {
                                await cancelInvite(invite.id);
                              },
                            })
                          }
                          type="button"
                          variant="secondary"
                        >
                          <CircleX size={20} aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              {transfers.length > 0 ? (
                <section className={styles.group}>
                  <h2 className={styles.title}>
                    {t('dogOwnership.pendingTransferTitle')}
                  </h2>
                  <div className={styles.section}>
                    {transfers.map((transfer) => (
                      <div className={styles.row} key={transfer.id}>
                        <Link
                          className={styles.person}
                          to={`/profile/${members.find((member) => member.id === transfer.to_member_id)?.user_id}`}
                        >
                          <UserIcon size={24} aria-hidden="true" />
                          {members.find(
                            (member) => member.id === transfer.to_member_id,
                          )?.user_name ?? t('dogOwnership.memberFallback')}
                        </Link>
                        <Button
                          className={styles.rowAction}
                          aria-label={t('dogOwnership.revokeOffer')}
                          title={t('dogOwnership.revokeOffer')}
                          disabled={isCancelingTransfer}
                          onClick={() => cancelTransfer(transfer.id)}
                          variant="secondary"
                        >
                          <CircleX size={20} aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          <div className={styles.secondaryActions}>
            {capabilities.enabled &&
            capabilities.role === 'PRIMARY_OWNER' &&
            eligibleTransferMembers.length > 0 &&
            transfers.length === 0 ? (
              <Button
                variant="primary"
                className={styles.button}
                onClick={() => openModal('transfer')}
                disabled={!capabilities.can_transfer}
              >
                <ArrowRightLeft size={18} /> {t('dogOwnership.transferTitle')}
              </Button>
            ) : null}
            {capabilities.enabled && capabilities.can_leave ? (
              <Button
                variant="secondary"
                className={styles.button}
                onClick={() => navigate(`/dogs/${dogId}/ownership/leave`)}
              >
                <LogOut size={18} /> {t('dogOwnership.leaveAction')}
              </Button>
            ) : null}
            {capabilities.enabled &&
            (capabilities.active_owner_count ?? 0) > 1 ? (
              deletionProposal ? (
                <Link
                  className={styles.actionLink}
                  to={`/dogs/${dogId}/ownership/deletion/${deletionProposal.id}`}
                >
                  <Trash2 size={18} /> {t('dogOwnership.reviewDeletion')}
                </Link>
              ) : capabilities.role === 'PRIMARY_OWNER' ? (
                <Button
                  variant="secondary"
                  className={styles.button}
                  color={styles.red}
                  disabled={isProposingDeletion}
                  onClick={() =>
                    showModal({
                      title: t('dogOwnership.deletionWarning'),
                      confirmText: t('dogOwnership.proposeDeletion'),
                      onConfirm: async () => {
                        await proposeDeletion();
                      },
                    })
                  }
                >
                  <Trash2 size={18} /> {t('dogOwnership.proposeDeletion')}
                </Button>
              ) : null
            ) : null}
            {members.length === 1 && dogPage.viewer.role === 'PRIMARY_OWNER' ? (
              <Button
                variant="secondary"
                className={styles.button}
                color={styles.red}
                onClick={() => setIsDeleteDogModalOpen(true)}
              >
                <Trash2 size={18} />{' '}
                {t('settings.deleteDogButton', { name: dogPage.dog.name })}
              </Button>
            ) : null}
          </div>
          {activeModal === 'invite' ? (
            <OwnershipModal
              title={t('dogOwnership.inviteTitle')}
              onClose={() => setActiveModal(null)}
              onSave={() => inviteFriends(invitedFriends)}
              saveText={t('dogOwnership.invite')}
              isPending={isInviting}
              disabled={
                !invitedFriends.length ||
                !capabilities.can_invite ||
                invitedFriends.length > 8 - members.length - invites.length
              }
            >
              <p>{t('dogOwnership.inviteHelp')}</p>
              <div>
                <SelectUsers
                  inlineDropdown
                  users={eligibleFriends}
                  selectedUsers={invitedFriends}
                  setSelectedUsers={setInvitedFriends}
                />
              </div>
              {invitedFriends.length > 8 - members.length - invites.length ? (
                <p role="alert">
                  {t('dogOwnership.outcomes.CAPACITY_REACHED')}
                </p>
              ) : null}
            </OwnershipModal>
          ) : null}
          {activeModal === 'transfer' ? (
            <OwnershipModal
              title={t('dogOwnership.transferTitle')}
              onClose={() => setActiveModal(null)}
              isPending={isOfferingTransfer}
              onSave={() =>
                offerTransfer(
                  selectedTransferMemberId ||
                    eligibleTransferMembers[0]?.id ||
                    '',
                )
              }
              saveText={t('dogOwnership.transferAction')}
              disabled={
                !capabilities.can_transfer ||
                eligibleTransferMembers.length === 0
              }
            >
              <p>{t('dogOwnership.transferHelp')}</p>
              <OwnerRecipient
                members={eligibleTransferMembers}
                value={selectedTransferMemberId}
                onChange={setSelectedTransferMemberId}
              />
            </OwnershipModal>
          ) : null}
          <DeleteDogModal
            dog={dogPage.dog}
            isOpen={isDeleteDogModalOpen}
            onClose={() => setIsDeleteDogModalOpen(false)}
          />
        </>
      ) : null}
      <Outlet />
    </div>
  );
};

export default DogOwnership;

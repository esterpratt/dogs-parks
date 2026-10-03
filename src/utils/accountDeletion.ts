import type { AccountDeletionReviewItem } from '../types/account-deletion';
import type { DogPageData } from '../types/dog-ownership';

const buildAccountDeletionReview = (
  dogPages: DogPageData[],
  currentUserId: string
): AccountDeletionReviewItem[] => {
  return dogPages.map((dogPage) => {
    const members = dogPage.members ?? [];
    const eligibleSuccessors = members
      .filter(
        (member) =>
          member.role === 'CO_OWNER' && member.user_id !== currentUserId
      )
      .sort((firstMember, secondMember) =>
        firstMember.joined_at.localeCompare(secondMember.joined_at)
      );
    const isShared = members.length > 1;
    const isPrimaryOwner = dogPage.viewer.role === 'PRIMARY_OWNER';

    // The server uses the same tenure ordering when a selected successor goes stale.
    const effect = !isShared
      ? 'DELETE_SOLO_DOG'
      : isPrimaryOwner
        ? 'TRANSFER_SHARED_DOG'
        : 'LEAVE_SHARED_DOG';

    return {
      dogId: dogPage.dog.id,
      dogName: dogPage.dog.name,
      effect,
      eligibleSuccessors,
      selectedSuccessorMemberId:
        effect === 'TRANSFER_SHARED_DOG'
          ? (eligibleSuccessors[0]?.id ?? null)
          : null,
    };
  });
};

const getSuccessorSelections = (
  reviewItems: AccountDeletionReviewItem[]
): Record<string, string> => {
  return reviewItems.reduce<Record<string, string>>((selections, item) => {
    if (
      item.effect === 'TRANSFER_SHARED_DOG' &&
      item.selectedSuccessorMemberId
    ) {
      selections[item.dogId] = item.selectedSuccessorMemberId;
    }
    return selections;
  }, {});
};

export { buildAccountDeletionReview, getSuccessorSelections };

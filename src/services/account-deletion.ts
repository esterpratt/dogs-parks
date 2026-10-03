import type { AccountDeletionReviewItem } from '../types/account-deletion';
import { buildAccountDeletionReview } from '../utils/accountDeletion';
import { fetchDogPage, fetchUserDogs } from './dogs';

const fetchAccountDeletionReview = async (
  userId: string
): Promise<AccountDeletionReviewItem[]> => {
  const dogs = (await fetchUserDogs(userId)) ?? [];
  const dogPages = await Promise.all(dogs.map(({ id }) => fetchDogPage(id)));

  // Dog-page payloads are owner-only here and contain the successor roster.
  return buildAccountDeletionReview(
    dogPages.filter((dogPage) => dogPage !== null),
    userId
  );
};

export { fetchAccountDeletionReview };

import { useQuery } from "@tanstack/react-query";
import { Friendship, FRIENDSHIP_STATUS } from "../types/friendship";
import { fetchUserFriendships } from "../services/friendships";
import { User } from "../types/user";

interface UseIsAllowedToViewProfileProps {
  user: User;
  signedInUserId?: string;
  isSignedInUser: boolean;
}

const useIsAllowedToViewProfile = (props: UseIsAllowedToViewProfileProps) => {
  const { user, signedInUserId, isSignedInUser } = props;

  const { data: pendingFriendships, isPending: isPendingPendingFriendships } = useQuery({
    queryKey: ['friendships', user.id, 'pending'],
    queryFn: () =>
      fetchUserFriendships({
        userId: user.id,
        status: FRIENDSHIP_STATUS.PENDING,
      }),
  });

  const { data: approvedFriendships, isPending: isPendingApprovedFriendships } = useQuery({
    queryKey: ['friendships', user.id, 'approved'],
    queryFn: () =>
      fetchUserFriendships({
        userId: user.id,
      }),
  });

  if (!isSignedInUser && user.private) {
    const pendingFriendsIds = pendingFriendships?.map(
      (friendship: Friendship) => {
        if (user.id === friendship.requestee_id) {
          return friendship.requester_id;
        }
        return friendship.requestee_id;
      }
    );

    const approvedFriendsIds = approvedFriendships?.map(
      (friendship: Friendship) => {
        if (user.id === friendship.requestee_id) {
          return friendship.requester_id;
        }
        return friendship.requestee_id;
      }
    );

    if (!isPendingPendingFriendships && !isPendingApprovedFriendships &&
      !pendingFriendsIds?.concat(approvedFriendsIds ?? []).includes(signedInUserId ?? '')
    ) {
      return { isAllowedToViewProfile: false};
    }
  }

  return { isAllowedToViewProfile: true};
}

export { useIsAllowedToViewProfile };
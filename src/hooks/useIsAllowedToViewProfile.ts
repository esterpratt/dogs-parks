import { FRIENDSHIP_STATUS, USER_ROLE } from "../types/friendship";
import { User } from "../types/user";
import { useUserFriendshipMap } from "./api/useUserFriendshipMap";
import { getFriendIdsByStatus } from "../utils/friendship";

interface UseIsAllowedToViewProfileProps {
  user: User;
  signedInUserId?: string;
  isSignedInUser: boolean;
}

const useIsAllowedToViewProfile = (props: UseIsAllowedToViewProfileProps) => {
  const { user, signedInUserId, isSignedInUser } = props;

  const {
      data: friendshipMap,
    } = useUserFriendshipMap(user.id);

  if (!isSignedInUser && user.private) {
    if (friendshipMap) {
      const friendIds = getFriendIdsByStatus({friendshipMap, status: FRIENDSHIP_STATUS.APPROVED, userId: user.id});
      const pendindFriendIds = getFriendIdsByStatus({friendshipMap, status: FRIENDSHIP_STATUS.PENDING, userId: user.id, userRole: USER_ROLE.REQUESTER});

      if (!friendIds.includes(signedInUserId ?? '') && !pendindFriendIds.includes(signedInUserId ?? '')) {
        return { isAllowedToViewProfile: false};
      }
    }
  }

  return { isAllowedToViewProfile: true};
}

export { useIsAllowedToViewProfile };
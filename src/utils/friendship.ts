import { fetchUserFriendships } from "../services/friendships";
import { Friendship, FRIENDSHIP_STATUS, USER_ROLE } from "../types/friendship";

interface GetFriendIdsByStatusProps {
  friendshipMap: Map<string, Friendship>;
  userId?: string;
  status: FRIENDSHIP_STATUS;
  userRole?: USER_ROLE;
}

export const getFriendIdsByStatus = ({ friendshipMap, userId, status, userRole }: GetFriendIdsByStatusProps) => {
  const userRoleToFilter = userId && userRole ? userRole === USER_ROLE.REQUESTEE ? 'requestee_id' : 'requester_id' : null;
  
  return  [...friendshipMap.entries()]
    .filter(([, friendship]) => {
      return friendship.status === status && (!userRoleToFilter || friendship[userRoleToFilter] === userId)
    }).map(([userId]) => userId);
};

export const buildFriendshipMap = async (userId: string): Promise<Map<string, Friendship>> => {
  const friendships = await fetchUserFriendships({ userId });

  const map = new Map<string, Friendship>();
  friendships?.forEach((friendship: Friendship) => {
    const friendId = friendship.requestee_id === userId ? friendship.requester_id : friendship.requestee_id;
    map.set(friendId, friendship);
  });

  return map;
};
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { supabase } from './supabase-client';

interface CreateFriendshipProps {
  requesterId: string;
  requesteeId: string;
}

type FetchFriendshipProps = [string, string];

interface UpdateFriendshipProps {
  friendshipId: string;
  status: FRIENDSHIP_STATUS;
}

interface FetchUserFriendshipsProps {
  userId: string;
  userRole?: USER_ROLE;
  status?: FRIENDSHIP_STATUS;
}

const createFriendship = async ({
  requesterId,
  requesteeId,
}: CreateFriendshipProps) => {
  try {
    const { data: friendship, error } = await supabase
      .from('friendships')
      .insert([
        { requestee_id: requesteeId, requester_id: requesterId, status: FRIENDSHIP_STATUS.PENDING },
      ])
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return friendship.id;
  } catch (error) {
    console.error(
      `there was an error while creating friendship for users ${requesteeId}, ${requesterId}: ${JSON.stringify(error)}`
    );
    return null;
  }
};

const fetchFriendship = async (ids: FetchFriendshipProps) => {
  try {
    const { data: friendship, error } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(requester_id.eq.${ids[0]},requestee_id.eq.${ids[1]}),and(requester_id.eq.${ids[1]},requestee_id.eq.${ids[0]})`
    )
    .maybeSingle();

    if (error) {
      throw error;
    }

    return friendship;
  } catch (error) {
    console.error(
      `there was an error while fetching friendship for users ${ids[0]}, ${ids[1]}: ${JSON.stringify(error)}`
    );
    return null;
  }
};

const getFriendshipUserQuery = ({
  userId,
  userRole,
  status
}: FetchUserFriendshipsProps) => {
  switch (userRole) {
    case USER_ROLE.REQUESTEE:
      return supabase
        .from('friendships')
        .select('*')
        .eq('status', status)
        .eq('requestee_id', userId);
    case USER_ROLE.REQUESTER:
      return supabase
        .from('friendships')
        .select('*')
        .eq('status', status)
        .eq('requester_id', userId);
    case USER_ROLE.ANY:
    default:
      return supabase
        .from('friendships')
        .select('*')
        .eq('status', status)
        .or(`requester_id.eq.${userId}, requestee_id.eq.${userId}`);
  }
};

const fetchUserFriendships = async ({
  userId,
  userRole = USER_ROLE.ANY,
  status = FRIENDSHIP_STATUS.APPROVED,
}: FetchUserFriendshipsProps) => {
  try {
    const { data: friendships, error } = await getFriendshipUserQuery({ userId, userRole, status });
    
    if (error) {
      throw error;
    }

    return friendships;
  } catch (error) {
    console.error(
      `there was an error while fetching friendships for user ${userId}: ${JSON.stringify(error)}`
    );
    return null;
  }
};

const updateFriendship = async ({
  friendshipId,
  status,
}: UpdateFriendshipProps) => {
  try {
    const { error } = await supabase
    .from('friendships')
    .update({ status })
    .eq('id', friendshipId)

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(
      `there was an error while updating friendship with id ${friendshipId}: ${JSON.stringify(error)}`
    );
  }
};

const deleteFriendship = async (friendshipId: string) => {
  try {
    const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(
      `there was an error deleting friendship with id ${friendshipId}: ${JSON.stringify(error)}`
    );
  }
};

export {
  createFriendship,
  updateFriendship,
  fetchFriendship,
  fetchUserFriendships,
  deleteFriendship,
};

import { User } from '../types/user';
import { fetchUserFriendships } from './friendships';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { throwError } from './error';
import { fetchDogs, fetchUsersDogs } from './dogs';
import { Dog } from '../types/dog';
import { supabase } from './supabase-client';

interface EditUserProps {
  userId: string;
  userDetails: Omit<User, 'id'>;
}

interface FetchFriendsProps {
  userId: string;
  userRole?: USER_ROLE;
  status?: FRIENDSHIP_STATUS;
}

const updateUser = async ({ userId, userDetails }: EditUserProps) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ ...userDetails })
      .eq('id', userId);
    
      if (error) {
      throw error;
    }
  } catch (error) {
    throwError(error);
  }
};

const fetchUser = async (id: string) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    throwError(error);
  }
};

const fetchUsers = async (ids?: string[]) => {
  try {
    if (!ids || !ids.length) {
      const { data: users, error } = await supabase
      .from('users')
      .select("*")
      
      if (error) {
        throw error;
      }

      return users;
    } else {
      const { data: users, error } = await supabase
        .from('users')
        .select("*")
        .in('id', ids)

      if (error) {
        throw error;
      }

      return users;
    }
  } catch (error) {
    throwError(error);
  }
};

const fetchUsersWithDogsByIds = async (ids?: string[]) => {
  try {
    const dogsPromise = ids?.length ? fetchUsersDogs(ids) : fetchDogs();
    const promises: [Promise<User[] | undefined>, Promise<Dog[] | undefined>] =
      [fetchUsers(ids), dogsPromise];

    const [users = [], dogs = []] = await Promise.all(promises);
    const usersWithDogs = users?.map((user) => {
      return {
        ...user,
        dogs: dogs ? dogs.filter((dog) => dog.owner === user.id) : [],
      };
    });

    return usersWithDogs;
  } catch (error) {
    throwError(error);
  }
};

const fetchFriends = async ({
  userId,
  userRole = USER_ROLE.ANY,
  status = FRIENDSHIP_STATUS.APPROVED,
}: FetchFriendsProps) => {
  try {
    const friendships = await fetchUserFriendships({
      userId,
      userRole,
      status,
    });
    if (!friendships || !friendships.length) {
      return [];
    }
    const friendsIds = friendships.map((friendship) => {
      if (friendship.requestee_id !== userId) {
        return friendship.requestee_id;
      }
      return friendship.requester_id;
    });

    const friends = await fetchUsers(friendsIds);
    return friends;
  } catch (error) {
    throwError(error);
  }
};

const fetchFriendsWithDogs = async ({
  userId,
  userRole = USER_ROLE.ANY,
  status = FRIENDSHIP_STATUS.APPROVED,
}: FetchFriendsProps) => {
  try {
    const friends = await fetchFriends({
      userId,
      userRole,
      status,
    });

    if (!friends?.length) {
      return [];
    }

    const dogs = await fetchUsersDogs(friends.map((friend) => friend.id));
    const friendsWithDogs = friends.map((friend) => {
      return {
        ...friend,
        dogs: dogs ? dogs.filter((dog) => dog.owner === friend.id) : [],
      };
    });

    return friendsWithDogs;
  } catch (error) {
    throwError(error);
  }
};

const filterUsersAndDogs = async (input: string) => {
  try {
    const { data, error } = await supabase.rpc('search_users_with_dogs', { input });

    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`there was an error searching users: ${JSON.stringify(error)}`);
    return [];
  }
};

export {
  updateUser,
  fetchUser,
  fetchUsers,
  fetchFriendsWithDogs,
  fetchUsersWithDogsByIds,
  filterUsersAndDogs
};

export type { EditUserProps };

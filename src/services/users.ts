import { User } from '../types/user';
import { AppError, throwError } from './error';
import { fetchUsersDogs } from './dogs';
import { Dog } from '../types/dog';
import { UserDogRow } from '../types/dogOwnership';
import { supabase } from './supabase-client';
import { USER_NOT_FOUND_ERROR } from '../utils/consts';

interface EditUserProps {
  userId: string;
  userDetails: Omit<User, 'id'>;
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
      throw new AppError(USER_NOT_FOUND_ERROR, 403);
    }

    return user;
  } catch (error) {
    throwError(error);
  }
};

const fetchUsers = async (ids?: string[]): Promise<User[] | undefined> => {
  try {
    if (!ids || !ids.length) {
      const { data: users, error } = await supabase.from('users').select('*');

      if (error) {
        throw error;
      }

      return users;
    } else {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .in('id', ids);

      if (error) {
        throw error;
      }

      return users;
    }
  } catch (error) {
    throwError(error);
  }
};

const fetchUsersWithDogsByIds = async (ids: string[]) => {
  try {
    if (!ids.length) {
      return [];
    }

    const dogsPromise = fetchUsersDogs(ids);
    const promises: [
      Promise<User[] | undefined>,
      Promise<UserDogRow[] | undefined>,
    ] = [fetchUsers(ids), dogsPromise];

    const [users = [], dogs = []] = await Promise.all(promises);
    const usersWithDogs = users?.map((user) => {
      const userRows = dogs
        ? dogs.filter((row) => row.user_id === user.id)
        : [];
      const rolePriority: Record<UserDogRow['role'], number> = {
        PRIMARY_OWNER: 0,
        EDITOR: 1,
        VIEWER: 2,
      };
      const userDogs = userRows
        .sort((a, b) => rolePriority[a.role] - rolePriority[b.role])
        .map((row) => row.dog)
        .filter((dog): dog is Dog => !!dog);

      return {
        ...user,
        dogs: userDogs,
      };
    });

    return usersWithDogs;
  } catch (error) {
    throwError(error);
  }
};

const filterUsersAndDogs = async (input: string) => {
  try {
    const { data, error } = await supabase.rpc('search_users_with_dogs', {
      input,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`there was an error searching users: ${error}`);
    return [];
  }
};

export {
  updateUser,
  fetchUser,
  fetchUsers,
  fetchUsersWithDogsByIds,
  filterUsersAndDogs,
};

export type { EditUserProps };

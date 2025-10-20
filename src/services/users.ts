import { User } from '../types/user';
import { AppError, throwError } from './error';
import { fetchUsersDogs } from './dogs';
import { Dog } from '../types/dog';
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
    console.error(
      `there was an error searching users: ${JSON.stringify(error)}`
    );
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

import { db } from './firebase-config';
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from '../types/user';
import { fetchUserFriendships } from './friendships';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { fetchParkCheckins } from './checkins';
import { AppError, throwError } from './error';

const usersCollection = collection(db, 'users');

type createUserProps = Pick<User, 'id' | 'name'>;

interface EditUserProps {
  userId: string;
  userDetails: Omit<User, 'id'>;
}

interface FetchFriendsProps {
  userId: string;
  userRole?: USER_ROLE;
  status?: FRIENDSHIP_STATUS;
}

const createUser = async ({ id, name }: createUserProps) => {
  try {
    await setDoc(doc(db, 'users', id), {
      name,
    });
  } catch (error) {
    throwError(error);
  }
};

const updateUser = async ({ userId, userDetails }: EditUserProps) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userDetails,
    });
  } catch (error) {
    throwError(error);
  }
};

const fetchUser = async (id: string) => {
  try {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new AppError('user does not exists', 404);
    }

    const user = docSnap.data() as User;
    return { ...user, id: docSnap.id };
  } catch (error) {
    throwError(error);
  }
};

const fetchUsers = async (ids: string[]) => {
  try {
    if (!ids || !ids.length) {
      const data = await getDocs(usersCollection);
      const users = data.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id,
        };
      }) as User[];
      return users;
    } else {
      const usersQuery = query(usersCollection, where(documentId(), 'in', ids));
      const querySnapshot = await getDocs(usersQuery);
      const res: User[] = [];
      querySnapshot.forEach((doc) => {
        res.push({ ...doc.data(), id: doc.id } as User);
      });
      return res;
    }
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
      if (friendship.requesteeId !== userId) {
        return friendship.requesteeId;
      }
      return friendship.requesterId;
    });

    const friends = await fetchUsers(friendsIds);
    return friends;
  } catch (error) {
    throwError(error);
  }
};

const fetchCheckedInUsers = async (parkId: string) => {
  try {
    const parkCheckins = await fetchParkCheckins(parkId);
    if (!parkCheckins || !parkCheckins.length) {
      return [];
    }

    const userIds = parkCheckins.map((checkin) => checkin.userId);
    const checkedInUsers = await fetchUsers(userIds);
    return checkedInUsers;
  } catch (error) {
    throwError(error);
  }
};

export {
  createUser,
  updateUser,
  fetchUser,
  fetchFriends,
  fetchCheckedInUsers,
  fetchUsers,
};

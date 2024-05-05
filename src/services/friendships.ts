import { db } from './firebase-config';
import {
  Query,
  addDoc,
  and,
  collection,
  deleteDoc,
  doc,
  getDocs,
  or,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Friendship, FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';

const friendshipsCollection = collection(db, 'friendships');

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
    const res = await addDoc(friendshipsCollection, {
      requesteeId,
      requesterId,
      status: FRIENDSHIP_STATUS.PENDING,
    });
    return res.id;
  } catch (error) {
    console.error(
      `there was an error while creating friendship for users ${requesteeId}, ${requesterId}: ${error}`
    );
    return null;
  }
};

const fetchFriendship = async (ids: FetchFriendshipProps) => {
  try {
    const friendshipQuery = query(
      friendshipsCollection,
      or(
        and(
          where('requesterId', '==', ids[0]),
          where('requesteeId', '==', ids[1])
        ),
        and(
          where('requesterId', '==', ids[1]),
          where('requesteeId', '==', ids[0])
        )
      )
    );

    const querySnapshot = await getDocs(friendshipQuery);
    const res: Friendship[] = [];
    querySnapshot.forEach((doc) => {
      res.push({ ...doc.data(), id: doc.id } as Friendship);
    });
    return res[0];
  } catch (error) {
    console.error(
      `there was an error while fetching friendship for users ${ids[0]}, ${ids[1]}: ${error}`
    );
    return null;
  }
};

const getFriendshipUserQuery = ({
  userId,
  userRole,
}: FetchUserFriendshipsProps) => {
  switch (userRole) {
    case USER_ROLE.REQUESTEE:
      return where('requesteeId', '==', userId);
    case USER_ROLE.REQUESTER:
      return where('requesterId', '==', userId);
    case USER_ROLE.ANY:
    default:
      return or(
        where('requesterId', '==', userId),
        where('requesteeId', '==', userId)
      );
  }
};

const fetchUserFriendships = async ({
  userId,
  userRole = USER_ROLE.ANY,
  status = FRIENDSHIP_STATUS.APPROVED,
}: FetchUserFriendshipsProps) => {
  try {
    const friendshipsQuery: Query = query(
      friendshipsCollection,
      and(
        getFriendshipUserQuery({
          userId,
          userRole,
        }),
        where('status', '==', status)
      )
    );

    const querySnapshot = await getDocs(friendshipsQuery);
    const res: Friendship[] = [];
    querySnapshot.forEach((doc) => {
      res.push({ ...doc.data(), id: doc.id } as Friendship);
    });
    return res;
  } catch (error) {
    console.error(
      `there was an error while fetching friendships for user ${userId}: ${error}`
    );
    return null;
  }
};

const updateFriendship = async ({
  friendshipId,
  status,
}: UpdateFriendshipProps) => {
  try {
    const friendshipRef = doc(db, 'friendships', friendshipId);
    await updateDoc(friendshipRef, {
      status,
    });
    return friendshipId;
  } catch (error) {
    console.error(
      `there was an error while updating friendship with id ${friendshipId}:  ${error}`
    );
    return null;
  }
};

const deleteFriendship = async (friendshipId: string) => {
  try {
    const friendshipRef = doc(db, 'friendships', friendshipId);
    await deleteDoc(friendshipRef);
  } catch (error) {
    console.error(
      `there was an error deleting friendship with id ${friendshipId}:  ${error}`
    );
    return null;
  }
};

export {
  createFriendship,
  updateFriendship,
  fetchFriendship,
  fetchUserFriendships,
  deleteFriendship,
};

import { db } from './firebase-config';
import {
  addDoc,
  and,
  collection,
  doc,
  getDocs,
  or,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from '../types/user';
import { Friendship, FRIENDSHIP_STATUS } from '../types/friendship';

const friendshipsCollection = collection(db, 'friendships');

interface CreateFriendshipProps {
  requesterId: User['id'];
  requesteeId: User['id'];
}

type FetchFriendshipProps = [User['id'], User['id']];

interface UpdateFriendshipProps {
  friendshipId: string;
  status: FRIENDSHIP_STATUS;
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
    console.error(`there was an error while creating friendship: ${error}`);
    return null;
  }
};

const fetchFriendship = async (ids: FetchFriendshipProps) => {
  try {
    const friendRequestQuery = query(
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

    const querySnapshot = await getDocs(friendRequestQuery);
    const res: Friendship[] = [];
    querySnapshot.forEach((doc) => {
      res.push({ ...doc.data(), id: doc.id } as Friendship);
    });
    return res[0];
  } catch (error) {
    console.error(`there was an error while fetching friendship: ${error}`);
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
    console.error('there was an error while updating friendship: ', error);
    return null;
  }
};

export { createFriendship, updateFriendship, fetchFriendship };

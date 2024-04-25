import { json } from 'react-router';
import { db } from './firebase-config';
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { User } from '../types/user';
import { fetchFriendships } from './friendships';

const usersCollection = collection(db, 'users');

type createUserProps = Pick<User, 'id' | 'name'>;

const createUser = async ({ id, name }: createUserProps) => {
  try {
    await setDoc(doc(db, 'users', id), {
      name,
    });
  } catch (error) {
    console.error(
      `there was an error while creating user with id ${id}: ${error}`
    );
    throw error;
  }
};

const fetchUser = async (id: User['id']) => {
  try {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('user does not exists');
    }

    const user = docSnap.data() as User;
    return { ...user, id: docSnap.id };
  } catch (error) {
    console.error(`there was an error while fetching user ${id}: ${error}`);

    let status = 500;
    let message = 'We Hate Google';
    if (error instanceof Response) {
      status = error.status;
      message = error.statusText;
    }
    throw json({ message }, { status });
  }
};

const fetchUsers = async (ids: User['id'][]) => {
  try {
    const usersQuery = query(usersCollection, where(documentId(), 'in', ids));
    const querySnapshot = await getDocs(usersQuery);
    const res: User[] = [];
    querySnapshot.forEach((doc) => {
      res.push({ ...doc.data(), id: doc.id } as User);
    });
    return res;
  } catch (error) {
    console.error(error);
  }
};

const fetchFriends = async (id: User['id']) => {
  try {
    const friendships = await fetchFriendships(id);
    if (!friendships) {
      return [];
    }
    const friendsIds = friendships.map((friendship) => {
      if (friendship.requesteeId !== id) {
        return friendship.requesteeId;
      }
      return friendship.requesterId;
    });
    const friends = await fetchUsers(friendsIds);
    return friends;
  } catch (error) {
    console.error(error);
  }
};

export { createUser, fetchUser, fetchFriends };

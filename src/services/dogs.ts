import { db } from './firebase-config';
import {
  addDoc,
  collection,
  documentId,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { User } from '../types/user';
import { throwError } from './error';
import { Dog } from '../types/dog';
import { fetchUser } from './users';

const dogsCollection = collection(db, 'dogs');

type CreateDogProps = Omit<Dog, 'id'>;

const createDog = async (createDogProps: CreateDogProps) => {
  try {
    await addDoc(dogsCollection, {
      ...createDogProps,
    });
  } catch (error) {
    throwError(error);
  }
};

const fetchDogs = async (ids: string[]) => {
  try {
    const usersQuery = query(dogsCollection, where(documentId(), 'in', ids));
    const querySnapshot = await getDocs(usersQuery);
    const res: User[] = [];
    querySnapshot.forEach((doc) => {
      res.push({ ...doc.data(), id: doc.id } as User);
    });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchUserDogs = async (userId: string) => {
  try {
    const user = await fetchUser(userId);
    if (user?.dogs) {
      return fetchDogs(user.dogs);
    } else {
      return null;
    }
  } catch (error) {
    throwError(error);
  }
};

export { fetchDogs, createDog, fetchUserDogs };

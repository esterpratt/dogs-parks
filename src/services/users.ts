import { json } from 'react-router';
import { db } from './firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types/user';

// const usersCollection = collection(db, 'users');

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

const fetchUser = async (id: string) => {
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

export { createUser, fetchUser };

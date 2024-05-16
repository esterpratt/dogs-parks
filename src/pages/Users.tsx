import { useLoaderData } from 'react-router';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { UserPreview } from '../components/users/UserPreview';
import styles from './Users.module.scss';

const Users = () => {
  const { usersWithDogs } = useLoaderData() as {
    usersWithDogs: (User & Dog[])[];
  };

  return (
    <div className={styles.container}>
      {usersWithDogs.map((user) => {
        return <UserPreview user={user} key={user.id} />;
      })}
    </div>
  );
};

export { Users };

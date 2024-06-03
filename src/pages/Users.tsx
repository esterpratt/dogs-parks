import { useLoaderData } from 'react-router';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { UserPreview } from '../components/users/UserPreview';
import styles from './Users.module.scss';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { SearchList } from '../components/SearchList';
import { Link } from 'react-router-dom';

interface UserWithDogs extends User {
  dogs: Dog[];
}

const Users = () => {
  const { userId } = useContext(UserContext);
  const { usersWithDogs } = useLoaderData() as {
    usersWithDogs: UserWithDogs[];
  };

  const usersWithoutCurrentUser = usersWithDogs.filter(
    (user) => user.id !== userId
  );

  const filterUsers = (userWithDogs: UserWithDogs, searchInput: string) => {
    if (!searchInput) {
      return false;
    }

    const namesToSearch = [
      userWithDogs.name,
      ...userWithDogs.dogs.map((dog) => dog.name),
    ];
    return namesToSearch.some((name) => {
      return name?.toLowerCase().includes(searchInput.toLowerCase());
    });
  };

  const NoResultsLayout = (
    <div className={styles.noResults}>No users were found</div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.message}>
        {!userId ? (
          <>
            To see user details and make friends, you need to{' '}
            <Link to="../login" className={styles.link}>
              log in
            </Link>
          </>
        ) : (
          <span>Sniff out some friends</span>
        )}
      </div>
      <SearchList
        isSearchToSee
        placeholder="Search by user or dog name"
        itemKeyfn={(userWithDog) => userWithDog.id}
        items={usersWithoutCurrentUser}
        filterFunc={filterUsers}
        noResultsLayout={NoResultsLayout}
        containerClassName={styles.list}
      >
        {(user) => <UserPreview user={user} showFriendshipButton={false} />}
      </SearchList>
    </div>
  );
};

export { Users };

import { ChangeEvent, useContext, useState } from 'react';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { UserPreview } from '../components/users/UserPreview';
import { UserContext } from '../context/UserContext';
import { SearchListAsync } from '../components/searchList/SearchListAsync';
import { filterUsersAndDogs } from '../services/users';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import styles from './Users.module.scss';
import { useQuery } from '@tanstack/react-query';

interface UserWithDogs extends User {
  dogs: Dog[];
}

const Users = () => {
  const { userId } = useContext(UserContext);

  const [input, setInput] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const {
    data: users,
    isLoading,
    isFetched,
    isFetching,
  } = useQuery({
    queryKey: ['users', searchInput],
    queryFn: () => filterUsersAndDogs(searchInput),
    enabled: !!searchInput,
  });

  const filteredUsers: UserWithDogs[] =
    users?.filter((user: UserWithDogs) => user.id !== userId) ?? [];

  const showNoResults =
    isFetched && !isLoading && !isFetching && filteredUsers.length === 0;

  const { showLoader } = useDelayedLoading({ isLoading });

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const onSearch = async () => {
    if (!input || !input.trim()) {
      return false;
    }

    setSearchInput(input.trim());
  };

  const NoResultsLayout = (
    <div className={styles.noResults}>No users were found</div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <span>Sniff out some friends!</span>
      </div>

      <SearchListAsync
        input={input}
        onChangeInput={onChangeInput}
        showLoader={showLoader}
        showNoResults={showNoResults}
        placeholder="Search by user or dog name"
        itemKeyfn={(userWithDog) => userWithDog.id}
        filteredItems={filteredUsers}
        onSearch={onSearch}
        noResultsLayout={NoResultsLayout}
        containerClassName={styles.list}
        inputContainerClassName={styles.inputContainer}
      >
        {(user) => <UserPreview user={user} showFriendshipButton={false} />}
      </SearchListAsync>
    </div>
  );
};

export default Users;

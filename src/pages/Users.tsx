import { User } from '../types/user';
import { Dog } from '../types/dog';
import { UserPreview } from '../components/users/UserPreview';
import styles from './Users.module.scss';
import { ChangeEvent, useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { SearchListAsync } from '../components/SearchListAsync';
import { filterUsersAndDogs } from '../services/users';

interface UserWithDogs extends User {
  dogs: Dog[];
}

const Users = () => {
  const { userId } = useContext(UserContext);

  const [input, setInput] = useState<string>('');
  const [showLoader, setShowLoader] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDogs[]>([]);
  const [showNoResults, setShowNoResults] = useState(false);

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
    setShowNoResults(false);
  };

  const onSearch = async () => {
    if (!input) {
      return false;
    }

    setShowLoader(true);

    const res = await filterUsersAndDogs(input);

    if (!res.length) {
      setShowNoResults(true);
    }

    const filterUsersWithoutSelf = res.filter(
      (user: UserWithDogs) => user.id !== userId
    );

    setFilteredUsers(filterUsersWithoutSelf);
    setShowLoader(false);
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
      >
        {(user) => <UserPreview user={user} showFriendshipButton={false} />}
      </SearchListAsync>
    </div>
  );
};

export { Users };

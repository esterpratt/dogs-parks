import { Dispatch, SetStateAction, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import classnames from 'classnames';
import { User } from '../types/user';
import { capitalizeWords } from '../utils/text';
import { AutoCompleteMultiSelect } from './inputs/AutoCompleteMultiSelect';
import styles from './SelectUsers.module.scss';

interface SelectUsersProps {
  placeholder?: string;
  label?: string;
  users: User[];
  selectedUsers: User[];
  setSelectedUsers: Dispatch<SetStateAction<User[]>>;
  defaultUserName?: string;
}

const SelectUsers = (props: SelectUsersProps) => {
  const {
    placeholder,
    label,
    users,
    selectedUsers,
    setSelectedUsers,
    defaultUserName = 'Unnamed friend',
  } = props;
  const { t } = useTranslation();

  const selectedUsersSet = useMemo(() => {
    return new Set(selectedUsers.map((user) => user.id));
  }, [selectedUsers]);

  const checkIsUserSelected = (user: User) => {
    return selectedUsersSet.has(user.id);
  };

  const handleAddUser = (user: User) => {
    setSelectedUsers((prev: User[]) => {
      return [...prev, user];
    });
  };

  const handleRemoveUser = (user: User) => {
    setSelectedUsers((prev) => {
      return prev.filter((selectedUser) => selectedUser.id !== user.id);
    });
  };

  const handleClickUser = (user: User) => {
    const isUserSelected = checkIsUserSelected(user);
    if (!isUserSelected) {
      handleAddUser(user);
    } else {
      handleRemoveUser(user);
    }
  };

  const filterUsers = (user: User, input: string) => {
    const inputToMatch = input.trim().toLowerCase();
    if (!inputToMatch) {
      return true;
    }
    return (user.name || '').toLowerCase().includes(inputToMatch);
  };

  return (
    <div className={styles.container}>
      <AutoCompleteMultiSelect
        selectedInputs={selectedUsers}
        items={users}
        placeholder={placeholder || t('parkInvite.modal.friends.placeholder')}
        label={label ?? t('parkInvite.modal.friends.label')}
        itemKeyfn={(user) => user.id}
        selectedItemKeyfn={(user) => `selected-${user.id}`}
        onSelectItem={handleClickUser}
        onRemoveItem={handleRemoveUser}
        equalityFunc={checkIsUserSelected}
        filterFunc={filterUsers}
        selectedInputsFormatter={(user) =>
          capitalizeWords(user.name || defaultUserName)
        }
      >
        {(user, isChosen) => (
          <div className={classnames(styles.user, isChosen && styles.chosen)}>
            {isChosen && <Check size={16} />}
            <span>{user.name}</span>
          </div>
        )}
      </AutoCompleteMultiSelect>
    </div>
  );
};

export { SelectUsers };

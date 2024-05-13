import { ChangeEvent, FormEvent, useContext, useEffect, useState } from 'react';
import { Button } from '../Button';
import styles from './EditUser.module.scss';
import { ControlledInput } from '../ControlledInput';
import { User } from '../../types/user';
import { UserContext } from '../../context/UserContext';

interface EditUserProps {
  user: User;
  onSubmitForm?: () => void;
}

// TODO: create context / lift state up
// so the state will include the data from each dog without overriding
const EditUser: React.FC<EditUserProps> = ({ user, onSubmitForm }) => {
  const [userData, setUserData] = useState(user);
  const { editUser } = useContext(UserContext);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserData((prev) => {
      return {
        ...prev,
        [event.target.name]: event.target.value,
      };
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await editUser({ ...userData, id: user.id });
    if (onSubmitForm) {
      onSubmitForm();
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <ControlledInput
        value={userData.name || ''}
        onChange={onInputChange}
        name="name"
        label="Name"
        required
      />
      <Button type="submit" variant="green" className={styles.saveButton}>
        Save
      </Button>
    </form>
  );
};

export { EditUser };

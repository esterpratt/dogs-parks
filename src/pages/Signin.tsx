import { FormEvent, useContext, useEffect, useState } from 'react';
import { FormInput } from '../components/FormInput';
import { UserContext } from '../context/UserContext';
import { SigninProps } from '../services/authentication';
import { Link, useNavigate } from 'react-router-dom';
import { AppError } from '../services/error';
import { Button } from '../components/Button';
import styles from './Signin.module.scss';

const Signin = () => {
  const { userSignin, user } = useContext(UserContext);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(`/profile/${user.id}`);
    }
  }, [user, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = Object.fromEntries(
      new FormData(event.currentTarget)
    ) as unknown as SigninProps;
    try {
      await userSignin(formData);
    } catch (error) {
      setError((error as AppError).message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2>Sign In</h2>
        <form onSubmit={handleSubmit} className={styles.inputsContainer}>
          <FormInput
            onChange={() => setError('')}
            name="email"
            label="Email"
            type="email"
          />
          <FormInput
            onChange={() => setError('')}
            name="password"
            label="Password"
            type="password"
          />
          <FormInput
            onChange={() => setError('')}
            name="name"
            label="Your Name"
            type="text"
          />
          <div className={styles.error}>{error}</div>
          <Button type="submit" className={styles.button}>
            Sign In
          </Button>
        </form>
      </div>
      <div>
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
};

export { Signin };

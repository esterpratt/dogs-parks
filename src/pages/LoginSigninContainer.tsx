import { FormEvent, useContext, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import styles from './LoginSigninContainer.module.scss';
import { Button } from '../components/Button';
import { UserContext } from '../context/UserContext';
import { SigninProps } from '../services/authentication';
import { Link } from 'react-router-dom';
import { FormInput } from '../components/inputs/FormInput';

interface LoginSigninContainerProps {
  method: 'signin' | 'login';
}

const LoginSigninContainer: React.FC<LoginSigninContainerProps> = ({
  method,
}) => {
  const {
    userSignin,
    userLogin,
    singinError,
    loginError,
    isCreatingDog,
    isCreatingUser,
    isLogingIn,
    isSigningIn,
  } = useContext(UserContext);
  const [error, setError] = useState<string>('');
  const isMethodChanged = useRef(false);
  console.log('error is: ', error);

  useEffect(() => {
    setError('');
    isMethodChanged.current = true;
  }, [method]);

  useEffect(() => {
    if (!isMethodChanged.current) {
      const error =
        method === 'login' ? loginError?.message : singinError?.message;
      setError(error || '');
    } else {
      isMethodChanged.current = false;
    }
  }, [singinError, loginError, method]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = Object.fromEntries(
      new FormData(event.currentTarget)
    ) as unknown as SigninProps;
    if (method === 'signin') {
      userSignin(formData);
    } else {
      userLogin(formData);
    }
  };

  const isLoading =
    isCreatingDog || isCreatingUser || isLogingIn || isSigningIn;

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>
          <span>{method === 'signin' ? 'Sign In' : 'Log In'}</span>
          {isLoading && <span className={styles.loading}>Loading...</span>}
        </h2>
        <div className={classnames(styles.error, error ? styles.show : '')}>
          {error}
        </div>
        <form onSubmit={handleSubmit} className={styles.inputsContainer}>
          <FormInput
            onChange={() => setError('')}
            name="email"
            label="Email *"
            type="email"
            required
          />
          <FormInput
            onChange={() => setError('')}
            name="password"
            label="Password *"
            type="password"
            required
          />
          {method === 'signin' && (
            <>
              <FormInput
                onChange={() => setError('')}
                name="name"
                label="Your Name *"
                type="text"
                required
              />
              <FormInput
                onChange={() => setError('')}
                name="dogName"
                label={
                  <>
                    Your Dog Name *
                    <span>
                      Got a pack? Awesome! You can add everyone later.
                    </span>
                  </>
                }
                type="text"
                required
              />
            </>
          )}
          <Button variant="green" type="submit" className={styles.button}>
            {method === 'signin' ? 'Sign In' : 'Log In'}
          </Button>
        </form>
      </div>
      <div className={styles.changeMethod}>
        {method === 'signin' ? (
          <>
            Already part of the pack? <Link to="/login">Log In</Link>
          </>
        ) : (
          <>
            Not part of the pack yet? <Link to="/signin">Sign In</Link>
          </>
        )}
      </div>
    </div>
  );
};

export { LoginSigninContainer };

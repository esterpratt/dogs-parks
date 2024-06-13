import { FormEvent, useContext, useEffect } from 'react';
import classnames from 'classnames';
import styles from './LoginSigninContainer.module.scss';
import { Button } from '../components/Button';
import { UserContext } from '../context/UserContext';
import { SigninProps } from '../context/UserContext';
import { Link } from 'react-router-dom';
import { FormInput } from '../components/inputs/FormInput';

interface LoginSigninContainerProps {
  method: 'signin' | 'login';
}

const LoginSigninContainer: React.FC<LoginSigninContainerProps> = ({
  method,
}) => {
  const { userSignin, userLogin, error, setError, isLoading } =
    useContext(UserContext);

  useEffect(() => {
    setError('');
  }, [method, setError]);

  const googleSignin = async () => {
    if (method === 'signin') {
      userSignin({ withGoogle: true });
    } else {
      userLogin({ withGoogle: true });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = Object.fromEntries(
      new FormData(event.currentTarget)
    ) as unknown as Required<Omit<SigninProps, 'withGoogle'>>;
    if (method === 'signin') {
      userSignin(formData);
    } else {
      userLogin(formData);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>
          <span>{method === 'signin' ? 'Sign In' : 'Log In'}</span>
          {isLoading && <span className={styles.loading}>Loading...</span>}
        </h2>
        <Button
          variant="orange"
          className={styles.googleLoginButton}
          onClick={googleSignin}
        >
          {method === 'signin' ? 'Sign In' : 'Log In'} With Google
        </Button>
        <span>Or fill:</span>
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
            </>
          )}
          <div className={classnames(styles.error, error ? styles.show : '')}>
            {error}
          </div>
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

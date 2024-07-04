import { FormEvent, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import { FcGoogle } from 'react-icons/fc';
import styles from './LoginSigninContainer.module.scss';
import { Button } from '../components/Button';
import { UserContext } from '../context/UserContext';
import { SigninProps } from '../context/UserContext';
import { FormInput } from '../components/inputs/FormInput';
import { Loader } from '../components/Loading';

interface LoginSigninContainerProps {
  method: 'signin' | 'login';
}

const LoginSigninContainer: React.FC<LoginSigninContainerProps> = ({
  method,
}) => {
  const {
    userSignin,
    userLogin,
    error,
    setError,
    isLoading,
    isLoadingAuthUser,
  } = useContext(UserContext);

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

  if (isLoading || isLoadingAuthUser) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>
          <span>{method === 'signin' ? 'Sign In' : 'Log In'}</span>
        </h2>
        <Button
          variant="nuteral"
          className={styles.googleLoginButton}
          onClick={googleSignin}
        >
          <FcGoogle />
          <span>{method === 'signin' ? 'Sign In' : 'Log In'} With Google</span>
        </Button>
        <div className={styles.lineThrough}>
          <span>Or</span>
        </div>
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

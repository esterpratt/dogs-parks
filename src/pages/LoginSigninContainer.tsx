import { FormEvent, useContext, useEffect, useState } from 'react';
import classnames from 'classnames';
import styles from './LoginSigninContainer.module.scss';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router';
import { UserContext } from '../context/UserContext';
import { SigninProps } from '../services/authentication';
import { AppError } from '../services/error';
import { Link } from 'react-router-dom';
import { FormInput } from '../components/FormInput';

interface LoginSigninContainerProps {
  method: 'signin' | 'login';
}

const LoginSigninContainer: React.FC<LoginSigninContainerProps> = ({
  method,
}) => {
  const { userSignin, userLogin, user } = useContext(UserContext);
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
      if (method === 'signin') {
        await userSignin(formData);
      } else {
        await userLogin(formData);
      }
    } catch (error) {
      setError((error as AppError).message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2>{method === 'signin' ? 'Sign In' : 'Log In'}</h2>
        <div className={classnames(styles.error, error ? styles.show : '')}>
          {error}
        </div>
        <form onSubmit={handleSubmit} className={styles.inputsContainer}>
          <FormInput
            onChange={() => setError('')}
            name="email"
            label="Email"
            type="email"
            required
          />
          <FormInput
            onChange={() => setError('')}
            name="password"
            label="Password"
            type="password"
            required
          />
          {method === 'signin' && (
            <>
              <FormInput
                onChange={() => setError('')}
                name="name"
                label="Your Name"
                type="text"
                required
              />
              <FormInput
                onChange={() => setError('')}
                name="dogName"
                label={
                  <>
                    Your Dog Name
                    <span>
                      if you have more than one, don't worry, you could later
                      add the rest
                    </span>
                  </>
                }
                type="text"
                required
              />
            </>
          )}

          <Button variant="orange" type="submit" className={styles.button}>
            {method === 'signin' ? 'Sign In' : 'Log In'}
          </Button>
        </form>
      </div>
      <div className={styles.changeMethod}>
        {method === 'signin' ? (
          <>
            Already have an account? <Link to="/login">Log In</Link>
          </>
        ) : (
          <>
            Doesn't have an account yet? <Link to="/signin">Sign In</Link>
          </>
        )}
      </div>
    </div>
  );
};

export { LoginSigninContainer };

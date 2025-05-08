import { FormEvent, MouseEvent, useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import classnames from 'classnames';
import GoogleIcon from '../assets/google.svg?react';
import { Button } from '../components/Button';
import { UserContext } from '../context/UserContext';
import { SigninProps } from '../context/UserContext';
import { useMutation } from '@tanstack/react-query';
import { sendResetEmail } from '../services/authentication';
import { Input } from '../components/inputs/Input';
import styles from './Login.module.scss';
import { useNotification } from '../context/NotificationContext';

const Login = () => {
  const { user, userSignin, userLogin, error, setError, isLoading } =
    useContext(UserContext);
  const [searchParams, setSearchParams] = useSearchParams({ mode: 'signup' });
  const isSignup = searchParams.get('mode') === 'signup';
  const mailRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { notify } = useNotification();

  useEffect(() => {
    if (user) {
      navigate(`/profile/${user.id}`);
    }
  }, [user, navigate]);

  useEffect(() => {
    setError('');
  }, [isSignup, setError]);

  const { mutate: resetPassword, isPending: isPendingResetPassword } =
    useMutation({
      mutationFn: (email: string) => {
        return sendResetEmail(email);
      },
      onError: (error) => {
        setError(error.message);
      },
      onSuccess: () => {
        notify('Check your mail for details');
        setError('');
      },
    });

  const googleSignin = async () => {
    if (isSignup) {
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
    if (isSignup) {
      if (!formData.email || !formData.password || !formData.name) {
        setError('Please fill in the missing details');
      } else {
        userSignin(formData);
      }
    } else {
      if (!formData.email || !formData.password) {
        setError('Please fill in the missing details');
      } else {
        userLogin(formData);
      }
    }
  };

  const onClickResetPassword = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const email = mailRef.current?.value;
    if (email) {
      resetPassword(email);
    } else {
      setError('Please Enter Email');
    }
  };

  const changeMethod = (method: 'login' | 'signup') => {
    setSearchParams((prev) => {
      prev.set('mode', method);
      return prev;
    });
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.formContainer}>
          <div className={styles.title}>
            <div className={classnames(styles.error, error ? styles.show : '')}>
              {error}
            </div>
            <span
              className={classnames(
                styles.loading,
                (isLoading || isPendingResetPassword) && styles.show
              )}
            >
              Paws a sec...
            </span>
          </div>
          <form onSubmit={handleSubmit} className={styles.inputsContainer}>
            <div className={styles.inputs}>
              <Input
                ref={mailRef}
                onChange={() => setError('')}
                name="email"
                placeholder="Email *"
                type="email"
              />
              <Input
                onChange={() => setError('')}
                name="password"
                placeholder="Password *"
                type="password"
              />
              {isSignup && (
                <Input
                  onChange={() => setError('')}
                  name="name"
                  placeholder="Your Name *"
                  type="text"
                />
              )}
            </div>
            <Button type="submit" className={styles.button}>
              {isSignup ? 'Sign Up' : 'Dog In'}
            </Button>
          </form>
          <div className={styles.lineThrough}>
            <span>Or</span>
          </div>
          <Button
            variant="secondary"
            color={styles.text}
            className={styles.googleLoginButton}
            onClick={googleSignin}
          >
            <GoogleIcon width={16} height={16} />
            <span>{isSignup ? 'Sign Up' : 'Dog In'} With Google</span>
          </Button>
        </div>
        <div className={styles.changeMethod}>
          {isSignup ? (
            <>
              <span>Already part of the pack?</span>
              <Button
                className={styles.changeMethodButton}
                variant="simple"
                onClick={() => changeMethod('login')}
              >
                Log In
              </Button>
            </>
          ) : (
            <>
              <span>Not part of the pack yet?</span>
              <Button
                className={styles.changeMethodButton}
                variant="simple"
                onClick={() => changeMethod('signup')}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
        {!isSignup && (
          <div className={styles.resetPassword}>
            <span>Forgot password?</span>
            <Button
              variant="simple"
              onClick={onClickResetPassword}
              className={styles.resetButton}
            >
              Reset password
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default Login;

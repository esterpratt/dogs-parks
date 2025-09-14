import {
  FormEvent,
  MouseEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeClosed } from 'lucide-react';
import classnames from 'classnames';
import GoogleIcon from '../assets/google.svg?react';
import AppleWhite from '../assets/apple-white.svg?react';
import AppleBlack from '../assets/apple-black.svg?react';
import { Button } from '../components/Button';
import { UserContext, SigninProps } from '../context/UserContext';
import { useMutation } from '@tanstack/react-query';
import { sendResetEmail, signin } from '../services/authentication';
import { Input } from '../components/inputs/Input';
import { useNotification } from '../context/NotificationContext';
import { preserveCursor } from '../utils/input';
import styles from './Login.module.scss';
import { useModeContext } from '../context/ModeContext';
import { useTransportOnline } from '../hooks/useTransportOnline';

const Login = () => {
  const {
    user,
    userSigninWithGoogle,
    userSigninWithApple,
    userLogin,
    error,
    setError,
    isLoading,
  } = useContext(UserContext);
  const [searchParams, setSearchParams] = useSearchParams({ mode: 'signup' });
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = searchParams.get('mode') === 'signup';
  const mailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const topRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { notify } = useNotification();

  const mode = useModeContext((state) => state.mode);

  const transport = useTransportOnline();
  const isOffline = transport !== null && transport.isConnected === false;

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' });
  }, [isSignup]);

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
        changeMethod('login');
      },
    });

  const googleSignin = async () => {
    if (isOffline) {
      setError('You are offline. Connect to continue.');
      return;
    }

    if (isSignup) {
      userSigninWithGoogle();
    } else {
      userLogin({ withGoogle: true });
    }
  };

  const appleSignin = async () => {
    if (isOffline) {
      setError('You are offline. Connect to continue.');
      return;
    }

    if (isSignup) {
      userSigninWithApple();
    } else {
      userLogin({ withApple: true });
    }
  };

  const { mutate: userSigninWithEmailAndPassowrd, isPending: isSigningIn } =
    useMutation({
      mutationFn: (vars: SigninProps) => {
        return signin({
          email: vars.email!,
          password: vars.password!,
          name: vars.name!,
        });
      },
      onError: (error) => {
        setError(error.message);
      },
      onSuccess: () => {
        notify('Check your mail for details');
        setError('');
        changeMethod('login');
      },
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isOffline) {
      setError('You are offline. Connect to log in.');
      return;
    }

    const formData = Object.fromEntries(
      new FormData(event.currentTarget)
    ) as unknown as Required<Omit<SigninProps, 'withGoogle'>>;
    if (isSignup) {
      if (!formData.email || !formData.password || !formData.name) {
        setError('Please fill in the missing details');
      } else {
        userSigninWithEmailAndPassowrd(formData);
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

    if (isOffline) {
      setError('You are offline. Connect to reset your password.');
      return;
    }

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
        <div className={styles.formContainer} ref={topRef}>
          <h1 className={styles.title}>
            {isSignup
              ? 'Sign up to KlavHub to create a profile, add friends, and contribute park info.'
              : 'Log in to KlavHub to manage your profile, add friends, and share park updates.'}
          </h1>
          <div className={styles.infoLine}>
            <div className={classnames(styles.error, error ? styles.show : '')}>
              {error}
            </div>
            <span
              className={classnames(
                styles.loading,
                (isLoading || isSigningIn || isPendingResetPassword) &&
                  styles.show
              )}
            >
              Paws a sec...
            </span>
          </div>
          <form onSubmit={handleSubmit} className={styles.inputsContainer}>
            <div className={styles.inputs}>
              <Input
                className={classnames(styles.input, {
                  [styles.dark]: mode === 'dark',
                })}
                ref={mailRef}
                onChange={() => setError('')}
                name="email"
                placeholder="Email *"
                type="email"
                data-test="login-email"
              />
              <Input
                className={classnames(styles.input, {
                  [styles.dark]: mode === 'dark',
                })}
                ref={passwordRef}
                onChange={() => setError('')}
                name="password"
                placeholder="Password *"
                type={showPassword ? 'text' : 'password'}
                data-test="login-password"
                rightIcon={
                  showPassword ? (
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() =>
                        preserveCursor(passwordRef, () =>
                          setShowPassword(false)
                        )
                      }
                    >
                      <Eye size={20} color={styles.pink} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() =>
                        preserveCursor(passwordRef, () => setShowPassword(true))
                      }
                    >
                      <EyeClosed size={20} color={styles.pink} />
                    </button>
                  )
                }
              />
              {isSignup && (
                <Input
                  onChange={() => setError('')}
                  name="name"
                  placeholder="Your name *"
                  type="text"
                  className={classnames(styles.input, {
                    [styles.dark]: mode === 'dark',
                  })}
                />
              )}
            </div>
            <Button
              type="submit"
              className={styles.button}
              data-test="login-submit"
              disabled={
                isOffline || isSigningIn || isLoading || isPendingResetPassword
              }
            >
              {isSignup ? 'Sign up' : 'Dog in'}
            </Button>
          </form>
          <div className={styles.lineThrough}>
            <span>Or</span>
          </div>
          <Button
            variant="secondary"
            color={styles.text}
            className={classnames(styles.appleLoginButton, {
              [styles.dark]: mode === 'dark',
            })}
            onClick={appleSignin}
            disabled={isOffline}
          >
            {mode === 'dark' ? (
              <AppleWhite className={styles.appleIcon} />
            ) : (
              <AppleBlack className={styles.appleIcon} />
            )}
            <div className={styles.buttonText}>
              {isSignup ? 'Sign up' : 'Continue'} with Apple
            </div>
          </Button>
          <Button
            variant="secondary"
            color={styles.text}
            className={classnames(styles.googleLoginButton, {
              [styles.dark]: mode === 'dark',
            })}
            onClick={googleSignin}
            disabled={isOffline}
          >
            <GoogleIcon width={16} height={16} />
            <div className={styles.buttonText}>
              {isSignup ? 'Sign up' : 'Continue'} with Google
            </div>
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
                Log in
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
                Sign up
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
              disabled={isOffline}
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

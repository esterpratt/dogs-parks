import {
  FormEvent,
  MouseEvent,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link, Navigate } from 'react-router-dom';
import classnames from 'classnames';
import { FcGoogle } from 'react-icons/fc';
import styles from './LoginSigninContainer.module.scss';
import { Button } from '../components/Button';
import { UserContext } from '../context/UserContext';
import { SigninProps } from '../context/UserContext';
import { FormInput } from '../components/inputs/FormInput';
import { Loader } from '../components/Loading';
import ThankYouModal from '../components/ThankYouModal';
import { useMutation } from '@tanstack/react-query';
import { sendResetEmail } from '../services/authentication';

interface LoginSigninContainerProps {
  method: 'signin' | 'login';
}

const LoginSigninContainer: React.FC<LoginSigninContainerProps> = ({
  method,
}) => {
  const { userSignin, userLogin, error, setError, userId, isLoading } =
    useContext(UserContext);
  const mailRef = useRef<HTMLInputElement | null>(null);
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);

  useEffect(() => {
    setError('');
  }, [method, setError]);

  const { mutate: resetPassword } = useMutation({
    mutationFn: (email: string) => {
      return sendResetEmail(email);
    },
    onError: (error) => {
      setError(error.message);
    },
    onSuccess: () => {
      setIsThankYouModalOpen(true);
      setError('');
    },
  });

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

  if (isLoading) {
    return <Loader />;
  }

  if (userId) {
    return <Navigate to={`/profile/${userId}`} />;
  }

  return (
    <>
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
            <span>
              {method === 'signin' ? 'Sign In' : 'Log In'} With Google
            </span>
          </Button>
          <div className={styles.lineThrough}>
            <span>Or</span>
          </div>
          <div className={classnames(styles.error, error ? styles.show : '')}>
            {error}
          </div>
          <form onSubmit={handleSubmit} className={styles.inputsContainer}>
            <FormInput
              ref={mailRef}
              onChange={() => setError('')}
              name="email"
              label="Email *"
              type="email"
            />
            <FormInput
              onChange={() => setError('')}
              name="password"
              label="Password *"
              type="password"
            />
            {method === 'signin' && (
              <FormInput
                onChange={() => setError('')}
                name="name"
                label="Your Name *"
                type="text"
              />
            )}
            {method === 'login' && (
              <Button
                onClick={onClickResetPassword}
                className={styles.resetButton}
              >
                Reset Password
              </Button>
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
      <Suspense fallback={null}>
        <ThankYouModal
          open={isThankYouModalOpen}
          onClose={() => setIsThankYouModalOpen(false)}
          title="Check your mail for details"
        />
      </Suspense>
    </>
  );
};

export { LoginSigninContainer };

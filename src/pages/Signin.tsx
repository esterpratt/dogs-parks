import { FormEvent, useContext, useEffect, useState } from 'react';
import { FormInput } from '../components/FormInput';
import { UserContext } from '../context/UserContext';
import { SigninProps } from '../services/authentication';
import { Link, useNavigate } from 'react-router-dom';
import { AppError } from '../types/error';

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
    <div>
      <div>
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
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
          <button type="submit">Sign Up</button>
        </form>
      </div>
      {error && <div>{error}</div>}
      <div>
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
};

export { Signin };

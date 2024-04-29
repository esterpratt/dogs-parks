import { FormEvent, useContext, useEffect, useState } from 'react';
import { FormInput } from '../components/FormInput';
import { useNavigate } from 'react-router';
import { LoginProps } from '../services/authentication';
import { UserContext } from '../context/UserContext';
import { Link } from 'react-router-dom';
import { AppError } from '../types/error';

const Login = () => {
  const { userLogin, user } = useContext(UserContext);
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
    ) as unknown as LoginProps;
    try {
      await userLogin(formData);
    } catch (error) {
      setError((error as AppError).message);
    }
  };

  return (
    <div>
      <div>
        <h2>Log In</h2>
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
          <button type="submit">Log In</button>
        </form>
      </div>
      {error && <div>{error}</div>}
      <div>
        Don't have an account yet? <Link to="/signin">Sign In</Link>
      </div>
    </div>
  );
};

export { Login };

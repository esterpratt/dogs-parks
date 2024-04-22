import { FormEvent, useContext, useEffect } from 'react';
import { FormInput } from '../components/FormInput';
import { UserContext } from '../context/UserContext';
import { SigninProps } from '../services/authentication';
import { Link, useNavigate } from 'react-router-dom';

const Signin = () => {
  const { userSignin, user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = Object.fromEntries(
      new FormData(event.currentTarget)
    ) as unknown as SigninProps;
    const res = await userSignin(formData);
    if (res instanceof Error) {
      console.log('erros: ', res);
    }
  };

  return (
    <div>
      <div>
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <FormInput name="email" label="Email" type="email" />
          <FormInput name="password" label="Password" type="password" />
          <FormInput name="name" label="Your Name" type="text" />
          <button type="submit">Sign Up</button>
        </form>
      </div>
      <div>
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
};

export { Signin };

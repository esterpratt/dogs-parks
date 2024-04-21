import { FormEvent, useContext } from 'react';
import { FormInput } from '../components/FormInput';
import { useNavigate } from 'react-router';
import { LoginProps } from '../services/authentication';
import { UserContext } from '../context/UserContext';
import { Link } from 'react-router-dom';

const Login = () => {
  const { userLogin } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = Object.fromEntries(
      new FormData(event.currentTarget)
    ) as unknown as LoginProps;
    const res = await userLogin(formData);
    if (res instanceof Error) {
      console.log('erros: ', res);
    } else {
      navigate('/profile');
    }
  };

  return (
    <div>
      <div>
        <h2>Log In</h2>
        <form onSubmit={handleSubmit}>
          <FormInput name="email" label="Email" type="email" />
          <FormInput name="password" label="Password" type="password" />
          <button type="submit">Log In</button>
        </form>
      </div>
      <div>
        Don't have an account yet? <Link to="/signin">Sign In</Link>
      </div>
    </div>
  );
};

export { Login };

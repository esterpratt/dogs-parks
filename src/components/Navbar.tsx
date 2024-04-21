import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { useContext } from 'react';

const Navbar = () => {
  const { user, userLogout } = useContext(UserContext);

  return (
    <nav>
      {!user ? (
        <Link to="/login">Login</Link>
      ) : (
        <button onClick={userLogout}>Logout</button>
      )}
    </nav>
  );
};

export { Navbar };

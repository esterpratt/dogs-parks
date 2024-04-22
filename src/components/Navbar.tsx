import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { useContext } from 'react';

const Navbar = () => {
  const { user, loading, userLogout } = useContext(UserContext);

  if (loading) {
    return null;
  }

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

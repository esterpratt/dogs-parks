import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { useContext } from 'react';

const Navbar = () => {
  const { userId, loadingUserId, userLogout } = useContext(UserContext);

  if (loadingUserId) {
    return null;
  }

  return (
    <nav>
      {!userId ? (
        <Link to="/login">Login</Link>
      ) : (
        <button onClick={userLogout}>Logout</button>
      )}
    </nav>
  );
};

export { Navbar };

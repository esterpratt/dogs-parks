import { useLocation, useNavigate } from 'react-router';
import styles from './DeletionConfirmation.module.scss';
import { useEffect } from 'react';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

const DeletionConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  useEffect(() => {
    localStorage.removeItem('userDeleted');
  }, []);

  useEffect(() => {
    if (!state?.userDeleted) {
      navigate('/');
    }
  }, [state, navigate]);

  return (
    <div className={styles.content}>
      <span>Your data has been sent to a farm up north.</span>
      <span>Don't worry - The app's still here wagging its tail for you.</span>
      <span>
        Thanks for being part of the pack! The doggy door is always open — come
        back anytime!
      </span>
      <Link to="/">
        <Button variant="green">Go Home</Button>
      </Link>
    </div>
  );
};

export { DeletionConfirmation };

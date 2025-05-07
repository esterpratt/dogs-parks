import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '../components/Button';
import styles from './DeletionConfirmation.module.scss';

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
      <span>
        Thanks for being part of the pack! The doggy door is always open — come
        back anytime!
      </span>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
};

export { DeletionConfirmation };
